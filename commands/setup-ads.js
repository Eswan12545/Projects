const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { buildAdsPanel } = require('../utils/adsPanel');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-ads')
    .setDescription('ينشر قائمة الإعلانات في هذي القناة')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const panel = buildAdsPanel();
    await interaction.channel.send(panel);
    await interaction.reply({ content: `${config.emojis.success} تم نشر بانل الإعلانات!`, ephemeral: true });
  },
};
