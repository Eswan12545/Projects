const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { handleMemberJoin } = require('../utils/welcomeManager');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test-welcome')
    .setDescription('يجرب رسالة الترحيب بحسابك')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await handleMemberJoin(interaction.member);
    await interaction.editReply({ content: `${config.emojis.success} تم إرسال رسالة الترحيب!` });
  },
};
