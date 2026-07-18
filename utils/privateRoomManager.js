const { ChannelType, PermissionsBitField } = require('discord.js');

/**
 * Creates a private text channel named after the buyer, visible only to them + staff/owners.
 * Used for: Ads "Private Room" options, and Seller Shop private room purchases.
 *
 * @param {Guild} guild - discord.js Guild instance
 * @param {User} buyer - the user who purchased the private room
 * @param {string|null} categoryId - category to place the channel under
 * @param {string|null} extraRoleId - an extra role (staff/owner/ads-manager) that should see the channel
 * @param {string} prefix - channel name prefix, e.g. 'ad-room' or 'shop-room'
 */
async function createPrivateRoom(guild, buyer, categoryId, extraRoleId, prefix = 'room') {
  const safeName = buyer.username
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20) || buyer.id;

  const channelName = `${prefix}-${safeName}`;

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
    {
      id: buyer.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles,
        PermissionsBitField.Flags.EmbedLinks,
      ],
    },
  ];

  if (extraRoleId) {
    overwrites.push({
      id: extraRoleId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.ManageChannels,
      ],
    });
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: categoryId || undefined,
    permissionOverwrites: overwrites,
    topic: `Private room owned by ${buyer.tag} (${buyer.id})`,
  });

  return channel;
}

module.exports = { createPrivateRoom };
