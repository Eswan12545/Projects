const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { connectToVoice } = require('../utils/voiceManager');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('joinvoice')
    .setDescription('يجبر البوت يدخل روم الفويس (24/7) حسب الإعدادات')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await connectToVoice(interaction.client);
    await interaction.editReply({ content: `${config.emojis.success} البوت حاول يدخل روم الفويس.` });
  },
};
