const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
} = require('discord.js');
const config = require('../config');
const ticketManager = require('../utils/ticketManager');
const { findOptionWithPrice } = require('../utils/adsPanel');
const { verifyMember } = require('../utils/verificationManager');
const sellerShop = require('../utils/sellerShopManager');
const creditManager = require('../utils/creditManager');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      // ==================== SLASH COMMANDS ====================
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction);
        return;
      }

      // ==================== TICKET TYPE SELECT MENU ====================
      if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_type_select') {
        await interaction.deferReply({ ephemeral: true });
        const typeKey = interaction.values[0];

        const result = await ticketManager.createTicket(interaction, typeKey);

        if (result.alreadyExists) {
          await interaction.editReply({
            content: `عندك تذكرة مفتوحة من قبل: ${result.channel}`,
          });
        } else {
          await interaction.editReply({
            content: `${config.emojis.success} تم فتح تذكرتك: ${result.channel}`,
          });
        }
        return;
      }

      // ==================== ADS OPTION SELECT MENU ====================
      if (interaction.isStringSelectMenu() && interaction.customId === 'ads_option_select') {
        const optionId = interaction.values[0];

        // Check permission (only ads manager role can create ads)
        if (
          config.ads.managerRoleId &&
          !interaction.member.roles.cache.has(config.ads.managerRoleId) &&
          !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
        ) {
          await interaction.reply({
            content: `${config.emojis.error} ما عندك صلاحية تسوي إعلان.`,
            ephemeral: true,
          });
          return;
        }

        // Open a modal to collect ad details
        const modal = new ModalBuilder()
          .setCustomId(`ads_modal_${optionId}`)
          .setTitle('تفاصيل الإعلان');

        const serverNameInput = new TextInputBuilder()
          .setCustomId('server_name')
          .setLabel('اسم السيرفر')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const serverInfoInput = new TextInputBuilder()
          .setCustomId('server_info')
          .setLabel('الوصف / المعلومات')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        const inviteInput = new TextInputBuilder()
          .setCustomId('invite_link')
          .setLabel('رابط الدعوة')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const gifInput = new TextInputBuilder()
          .setCustomId('gif_url')
          .setLabel('رابط صورة/GIF (اختياري)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(serverNameInput),
          new ActionRowBuilder().addComponents(serverInfoInput),
          new ActionRowBuilder().addComponents(inviteInput),
          new ActionRowBuilder().addComponents(gifInput)
        );

        await interaction.showModal(modal);
        return;
      }

      // ==================== ADS MODAL SUBMIT (credit payment instructions) ====================
      if (interaction.isModalSubmit() && interaction.customId.startsWith('ads_modal_')) {
        await interaction.deferReply({ ephemeral: true });
        const optionId = interaction.customId.replace('ads_modal_', '');

        const found = findOptionWithPrice(optionId);
        if (!found) {
          await interaction.editReply({ content: `${config.emojis.error} خيار غير صالح.` });
          return;
        }
        const { option, price, priceNumeric } = found;

        const serverName = interaction.fields.getTextInputValue('server_name');
        const serverInfo = interaction.fields.getTextInputValue('server_info');
        const inviteLink = interaction.fields.getTextInputValue('invite_link');
        const gifUrl = interaction.fields.getTextInputValue('gif_url') || null;

        const requestId = creditManager.registerPendingCredit({
          kind: 'ads',
          payload: { optionId, serverName, serverInfo, inviteLink, gifUrl },
          buyerId: interaction.user.id,
          amount: priceNumeric,
        });

        const { embed } = creditManager.buildPurchaseInstructionsEmbed({
          getLabel: `إعلان (${option.label})`,
          costAmount: priceNumeric,
          requestId,
        });

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // ==================== TICKET CLAIM BUTTON ====================
      if (interaction.isButton() && interaction.customId === 'ticket_claim') {
        if (config.tickets.staffRoleId && !interaction.member.roles.cache.has(config.tickets.staffRoleId)) {
          await interaction.reply({ content: `${config.emojis.error} بس الستاف يقدر يسوي كليم لهذي التذكرة.`, ephemeral: true });
          return;
        }
        ticketManager.markFirstResponse(interaction.channel.id, interaction.user.id);
        await interaction.reply({
          content: `🙋 تم استلام هذي التذكرة من ${interaction.user}.`,
        });
        return;
      }

      // ==================== TICKET CLOSE BUTTON ====================
      if (interaction.isButton() && interaction.customId === 'ticket_close') {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.warning)
              .setDescription(`${config.emojis.warning} متأكد إنك تبي تسكر هذي التذكرة؟`),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('ticket_close_confirm')
                .setLabel('تأكيد الإغلاق')
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId('ticket_close_cancel')
                .setLabel('إلغاء')
                .setStyle(ButtonStyle.Secondary)
            ),
          ],
        });
        return;
      }

      if (interaction.isButton() && interaction.customId === 'ticket_close_cancel') {
        await interaction.update({ content: `${config.emojis.success} تم الإلغاء، ما انسكرت.`, embeds: [], components: [] });
        return;
      }

      if (interaction.isButton() && interaction.customId === 'ticket_close_confirm') {
        await interaction.update({ content: `${config.emojis.lock} بيتم إغلاق هذي القناة بعد 5 ثواني...`, embeds: [], components: [] });

        const ticket = await ticketManager.closeTicket(interaction.channel.id, interaction.user.id);

        // Log to ticket log channel
        if (ticket && config.tickets.logChannelId) {
          const logChannel = interaction.guild.channels.cache.get(config.tickets.logChannelId);
          if (logChannel) {
            const typeData = config.tickets.types[ticket.type];
            const logEmbed = new EmbedBuilder()
              .setColor(config.colors.black)
              .setTitle(`${config.emojis.lock} تم إغلاق التذكرة — #${ticket.number}`)
              .addFields(
                { name: 'النوع', value: typeData?.label || ticket.type, inline: true },
                { name: 'صاحب التذكرة', value: `<@${ticket.userId}>`, inline: true },
                { name: 'أغلقها', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'المدة', value: ticketManager.formatDuration(ticket.durationMs), inline: true }
              )
              .setTimestamp();
            await logChannel.send({ embeds: [logEmbed] });
          }
        }

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 5000);
        return;
      }

      // ==================== SELLER SUBMIT MODAL ====================
      if (interaction.isModalSubmit() && interaction.customId === 'seller_submit_modal') {
        await interaction.deferReply({ ephemeral: true });

        const productName = interaction.fields.getTextInputValue('product_name');
        const description = interaction.fields.getTextInputValue('product_description');
        const price = interaction.fields.getTextInputValue('product_price');
        const imageUrl = interaction.fields.getTextInputValue('product_image') || null;

        const id = sellerShop.submitProduct({
          sellerId: interaction.user.id,
          sellerTag: interaction.user.tag,
          productName,
          description,
          price,
          imageUrl,
        });

        const publishChannel = config.sellerShop.publishChannelId
          ? interaction.guild.channels.cache.get(config.sellerShop.publishChannelId)
          : interaction.channel;

        if (!publishChannel) {
          await interaction.editReply({ content: `${config.emojis.error} ما قدرت ألقى قناة الشوب، تأكد من الإعدادات (SELLER_SHOP_CHANNEL_ID).` });
          return;
        }

        sellerShop.approveProduct(id, null);

        const publishedEmbeds = sellerShop.buildPublishedEmbed({
          seller: interaction.user,
          productName,
          description,
          price,
          imageUrl,
        });

        await publishChannel.send({ embeds: publishedEmbeds });
        await interaction.editReply({ content: `${config.emojis.success} تم نشر منتجك في المتجر مباشرة (#${id}).` });
        return;
      }

      // ==================== SELLER PRIVATE ROOM - handled directly in /buy-private-room command via credit system ====================

      // ==================== VERIFY BUTTON ====================
      if (interaction.isButton() && interaction.customId === 'verify_button') {
        const result = await verifyMember(interaction.member);
        if (result.alreadyVerified) {
          await interaction.reply({ content: `أنت متحقق من قبل! ${config.emojis.success}`, ephemeral: true });
        } else {
          await interaction.reply({ content: `${config.emojis.success} تم التحقق بنجاح! هلا وغلا فيك في السيرفر.`, ephemeral: true });
        }
        return;
      }
    } catch (err) {
      console.error('[InteractionCreate] Error:', err);
      const errPayload = { content: `${config.emojis.error} صار خطأ، حاول مرة ثانية بعدين.`, ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errPayload).catch(() => {});
      } else {
        await interaction.reply(errPayload).catch(() => {});
      }
    }
  },
};
