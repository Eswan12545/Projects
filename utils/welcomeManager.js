const { EmbedBuilder } = require('discord.js');
const config = require('../config');

/**
 * Builds and sends the welcome message when a new member joins.
 * Includes server banner image (placeholder until provided) and autorole assignment.
 */
async function handleMemberJoin(member) {
  const channel = member.guild.channels.cache.get(config.welcome.channelId);
  if (!channel) {
    console.warn('[Welcome] WELCOME_CHANNEL_ID not set or channel not found.');
    return;
  }

  const guildId = config.welcome.guildIdForLinks || member.guild.id;
  const { infoChannelId, updatesChannelId, ticketChannelId } = config.welcome.importantChannels;

  const link = (channelId) =>
    channelId ? `https://discord.com/channels/${guildId}/${channelId}` : null;

  const infoLink = link(infoChannelId);
  const updatesLink = link(updatesChannelId);
  const ticketLink = link(ticketChannelId);

  const divider = 'ـــــــــــــــــــــــــــــــــــ';

  const description =
    `# - Akatsuki S\n` +
    `${divider}\n` +
    ` - العضو : ${member}\n` +
    ` - انت العضو رقم : **${member.guild.memberCount}**\n` +
    `${divider}\n` +
    `# - شيك هذي الرومات المهمة\n` +
    `ೃ⁀➷ شيك معلومات عننا\n` +
    `${infoLink || '*(channel machi mzabout f config)*'}\n` +
    `ೃ⁀➷ شيك تحديثات السيرفر\n` +
    `${updatesLink || '*(channel machi mzabout f config)*'}\n` +
    `ೃ⁀➷شيك تكت الطلب\n` +
    `${ticketLink || '*(channel machi mzabout f config)*'}\n` +
    `${divider}\n\n` +
    `استمتع بسيرفر 🤍`;

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setDescription(description)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setTimestamp();

  if (config.welcome.bannerImage) {
    embed.setImage(config.welcome.bannerImage);
  }

  await channel.send({ embeds: [embed] });

  // If verification system uses an "Unverified" role, assign it on join
  if (config.verification.unverifiedRoleId) {
    try {
      await member.roles.add(config.verification.unverifiedRoleId);
    } catch (err) {
      console.error('[Welcome] Failed to assign unverified role:', err.message);
    }
  }
}

module.exports = { handleMemberJoin };
