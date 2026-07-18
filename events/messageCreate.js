const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const config = require('../config');
const jsonDB = require('./../utils/jsonDB');
const ticketManager = require('../utils/ticketManager');
const creditManager = require('../utils/creditManager');
const { buildAdPostEmbed } = require('../utils/adsPanel');
const { createPrivateRoom } = require('../utils/privateRoomManager');
const sellerShop = require('../utils/sellerShopManager');
const { handleMusicCommand } = require('../utils/musicCommands');

const LINE_GIF_PATH = path.join(__dirname, '..', 'assets', 'standard.gif');

/**
 * Checks whether `userId` is the designated owner of a private room channel
 * (i.e. has an explicit non-role permission overwrite on it, added at creation time).
 */
function isRoomOwner(channel, userId) {
  const overwrite = channel.permissionOverwrites.cache.get(userId);
  return Boolean(overwrite);
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild) return;

    // ==================== CREDIT PAYMENT DETECTION (ProBot) ====================
    // هذا لازم يشتغل حتى مع رسائل البوتات (ProBot نفسه بوت)، فما نوقفوش هنا.
    if (message.author.bot) {
      await handlePotentialCreditPayment(message);

      return;
    }

    // ==================== MUSIC COMMANDS (prefix !) ====================
    const wasMusicCommand = await handleMusicCommand(message);
    if (wasMusicCommand) return;

    // ==================== AUTO-LINE: seller drops content in their shop room ====================
    if (message.channel.name?.startsWith('shop-room-') && isRoomOwner(message.channel, message.author.id)) {
      const hasContent = message.attachments.size > 0 || (message.content && message.content.trim().length > 0);
      if (hasContent) {
        try {
          const attachment = new AttachmentBuilder(LINE_GIF_PATH, { name: 'standard.gif' });
          await message.channel.send({ files: [attachment] });
        } catch (err) {
          console.error(`[AutoLine] Error sending line gif: ${err.message}`);
        }
      }
    }

    // ==================== TICKET FIRST-RESPONSE TRACKING ====================
    const db = jsonDB.read('tickets', { counter: 0, open: {}, closed: {}, staffStats: {} });
    const ticket = db.open[message.channel.id];
    if (!ticket) return;

    // Only count as "first response" if the sender is staff and not the ticket owner
    if (message.author.id === ticket.userId) return;

    const member = message.member;
    const isStaff =
      config.tickets.staffRoleId && member?.roles.cache.has(config.tickets.staffRoleId);

    if (isStaff) {
      ticketManager.markFirstResponse(message.channel.id, message.author.id);
    }
  },
};

/**
 * Checks if a bot message (expected: ProBot) confirms a pending credit payment,
 * and if so, fulfills the matching request (ads post / private room).
 */
async function handlePotentialCreditPayment(message) {
  const request = creditManager.tryMatchProBotMessage(message);
  if (!request) return;

  creditManager.markFulfilled(request.id);

  const buyerMember = await message.guild.members.fetch(request.buyerId).catch(() => null);
  const buyer = buyerMember ? buyerMember.user : null;

  try {
    if (request.kind === 'ads') {
      await fulfillAdsRequest(message, request, buyer);
    } else if (request.kind === 'seller_room') {
      await fulfillSellerRoomRequest(message, request, buyer);
    }
  } catch (err) {
    console.error('[CreditPayment] Error fulfilling request:', err.message);
    if (config.tickets.errorLogChannelId) {
      const errChannel = message.guild.channels.cache.get(config.tickets.errorLogChannelId);
      if (errChannel) {
        await errChannel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.danger)
              .setTitle(`${config.emojis.error} خطأ في تنفيذ طلب بعد تأكيد الدفع`)
              .setDescription(`النوع: ${request.kind}\nالمشتري: <@${request.buyerId}>\nالخطأ: ${err.message}`)
              .setTimestamp(),
          ],
        }).catch(() => {});
      }
    }
  }
}

async function fulfillAdsRequest(message, request, buyer) {
  const { findOptionWithPrice } = require('../utils/adsPanel');
  const found = findOptionWithPrice(request.payload.optionId);
  if (!found) return;
  const { option, price } = found;

  const adsChannel = message.guild.channels.cache.get(config.ads.channelId);
  if (!adsChannel) return;

  const { embed, mentionText } = buildAdPostEmbed({
    option,
    price,
    serverName: request.payload.serverName,
    serverInfo: request.payload.serverInfo,
    inviteLink: request.payload.inviteLink,
    gifUrl: request.payload.gifUrl,
    postedBy: buyer,
  });

  await adsChannel.send({ content: mentionText || undefined, embeds: [embed] });

  if (option.privateRoom && buyer) {
    const room = await createPrivateRoom(
      message.guild,
      buyer,
      config.ads.paidCategoryId,
      config.ads.managerRoleId,
      'ad-room'
    );
    await room.send({
      content: `<@${buyer.id}>`,
      embeds: [
        new EmbedBuilder()
          .setColor(config.colors.primary)
          .setDescription(`${config.emojis.success} هذا روم الإعلان الخاص بيك، مبروك على الطلب!`),
      ],
    });
  }

  if (buyer) {
    await buyer.send({
      embeds: [
        new EmbedBuilder()
          .setColor(config.colors.success)
          .setDescription(`${config.emojis.success} تم تأكيد الدفع ونشر إعلانك في ${adsChannel}!`),
      ],
    }).catch(() => {});
  }
}

async function fulfillSellerRoomRequest(message, request, buyer) {
  if (!buyer) return;
  const room = await sellerShop.purchasePrivateRoom(message.guild, buyer);

  await buyer.send({
    embeds: [
      new EmbedBuilder()
        .setColor(config.colors.success)
        .setDescription(`${config.emojis.success} تم تأكيد الدفع، الروم الخاص بيك جاهز: ${room}`),
    ],
  }).catch(() => {});
}
