const {
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const jsonDB = require('./jsonDB');
const config = require('../config');

const DEFAULT_TICKETS = { counter: 0, open: {}, closed: {}, staffStats: {} };

function resolveEmoji(str) {
  if (!str) return '';
  if (str === '__EMOJI_SHOPPINGCART__') return config.emojis.shoppingCart;
  if (str === '__EMOJI_PROBOT__') return config.emojis.proBot;
  if (str === '__EMOJI_EMOJI138__') return config.emojis.emoji138;
  if (str === '__EMOJI_SCALES__') return config.emojis.scales;
  return str;
}

/**
 * Parses a custom emoji string like '<:name:123456789012345678>' into the
 * {id, name} object that ButtonBuilder.setEmoji() expects for custom emojis.
 * Falls back to treating the input as a plain unicode emoji if it doesn't match.
 */
function toButtonEmoji(emojiString) {
  const match = /^<a?:(\w+):(\d+)>$/.exec(emojiString);
  if (match) {
    return { name: match[1], id: match[2] };
  }
  return emojiString;
}

/**
 * Create a new ticket channel for a given type + user.
 */
async function createTicket(interaction, typeKey) {
  const typeData = config.tickets.types[typeKey];
  if (!typeData) throw new Error(`Unknown ticket type: ${typeKey}`);

  const guild = interaction.guild;
  const user = interaction.user;

  const db = jsonDB.read('tickets', DEFAULT_TICKETS);

  // Prevent duplicate open tickets of same type by same user
  const existing = Object.values(db.open).find(
    (t) => t.userId === user.id && t.type === typeKey
  );
  if (existing) {
    const channel = guild.channels.cache.get(existing.channelId);
    if (channel) {
      return { alreadyExists: true, channel };
    }
  }

  db.counter += 1;
  const ticketNumber = db.counter;
  const slug = typeData.slug || typeKey;
  const channelName = `${slug}-${ticketNumber}`;

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
    {
      id: user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles,
      ],
    },
  ];

  if (config.tickets.staffRoleId) {
    const staffRole = guild.roles.cache.get(config.tickets.staffRoleId);
    if (staffRole) {
      overwrites.push({
        id: staffRole.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.ManageChannels,
        ],
      });
    } else {
      console.warn(
        `[ticketManager] STAFF_ROLE_ID (${config.tickets.staffRoleId}) ma tla9itch f guild.roles.cache. ` +
        `Tcheck: 1) l ID s7i7 (right-click role -> Copy Role ID), 2) role mazal kayn f server, ` +
        `3) bot 3ando GatewayIntentBits.Guilds bach roles ikono cached.`
      );
    }
  }

  // Category khassa b had type, ila makaynach kaykhdem b category fallback l3ama
  const rawParentId = typeData.categoryId || config.tickets.categoryId || undefined;
  let parentCategory = undefined;
  if (rawParentId) {
    const cat = guild.channels.cache.get(rawParentId);
    if (cat && cat.type === ChannelType.GuildCategory) {
      parentCategory = cat.id;
    } else {
      console.warn(
        `[ticketManager] Category ID (${rawParentId}) ma tla9itch f guild.channels.cache aw machi category s7i7a. ` +
        `Tcheck: TICKET_CATEGORY_ID / TICKET_CATEGORY_${typeKey.toUpperCase()}_ID f .env. Ghadi ykhla9 bla category.`
      );
    }
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: parentCategory,
    permissionOverwrites: overwrites,
    topic: `Ticket ${typeData.label} | Owner: ${user.tag} (${user.id}) | #${ticketNumber}`,
  });

  db.open[channel.id] = {
    number: ticketNumber,
    channelId: channel.id,
    userId: user.id,
    userTag: user.tag,
    type: typeKey,
    createdAt: Date.now(),
    claimedBy: null,
    firstResponseAt: null,
  };
  jsonDB.write('tickets', db);

  // Build welcome embed with type-specific image + message
  const embed = new EmbedBuilder()
    .setColor(typeData.color || config.colors.primary)
    .setTitle(`${resolveEmoji(typeData.emoji)} ${typeData.label} — #${ticketNumber}`)
    .setDescription(
      `هلا ${user}! ${config.emojis.wave}\n\n${typeData.welcomeMessage}\n\n` +
      `الستاف بيوصلك الحين، خذ راحتك. عشان تسكر هذي التذكرة، اضغط على الزر تحت.`
    )
    .setTimestamp();

  if (typeData.image) {
    embed.setImage(typeData.image);
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_claim')
      .setLabel('استلام')
      .setEmoji(toButtonEmoji(config.emojis.success))
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('إغلاق التذكرة')
      .setEmoji(toButtonEmoji(config.emojis.lock))
      .setStyle(ButtonStyle.Danger)
  );

  const pingContent = config.tickets.staffRoleId
    ? `${user} | <@&${config.tickets.staffRoleId}>`
    : `${user}`;

  await channel.send({ content: pingContent, embeds: [embed], components: [row] });

  return { alreadyExists: false, channel, ticketNumber };
}

/**
 * Mark first staff response time (for avg response time stats).
 */
function markFirstResponse(channelId, staffId) {
  const db = jsonDB.read('tickets', DEFAULT_TICKETS);
  const ticket = db.open[channelId];
  if (!ticket) return;
  if (!ticket.firstResponseAt) {
    ticket.firstResponseAt = Date.now();
  }
  if (!ticket.claimedBy) {
    ticket.claimedBy = staffId;
  }
  jsonDB.write('tickets', db);
}

/**
 * Close a ticket: move to `closed`, update staff leaderboard stats.
 */
async function closeTicket(channelId, closedByUserId) {
  const db = jsonDB.read('tickets', DEFAULT_TICKETS);
  const ticket = db.open[channelId];
  if (!ticket) return null;

  ticket.closedAt = Date.now();
  ticket.closedBy = closedByUserId;
  ticket.durationMs = ticket.closedAt - ticket.createdAt;

  delete db.open[channelId];
  db.closed[channelId] = ticket;

  // Attribute the ticket to whoever handled it (claimedBy) or closer as fallback
  const staffId = ticket.claimedBy || closedByUserId;
  if (staffId) {
    if (!db.staffStats[staffId]) {
      db.staffStats[staffId] = { handled: 0 };
    }
    db.staffStats[staffId].handled += 1;
  }

  jsonDB.write('tickets', db);
  return ticket;
}

function formatDuration(ms) {
  if (ms == null) return 'لا يوجد';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) return `${hours} ساعة${remMinutes ? ` و ${remMinutes} دقيقة` : ''}`;
  const days = Math.floor(hours / 24);
  return `${days} يوم و ${hours % 24} ساعة`;
}

module.exports = {
  createTicket,
  closeTicket,
  markFirstResponse,
  formatDuration,
  resolveEmoji,
  toButtonEmoji,
};
