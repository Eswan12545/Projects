const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { buildVerificationPanel } = require('../utils/verificationManager');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-verification')
    .setDescription('ينشر بانل التحقق في هذي القناة')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const panel = buildVerificationPanel();
    await interaction.channel.send(panel);
    await interaction.reply({ content: `${config.emojis.success} تم نشر بانل التحقق!`, ephemeral: true });
  },
};
