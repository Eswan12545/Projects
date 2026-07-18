const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { buildTicketPanel } = require('../utils/ticketPanel');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-tickets')
    .setDescription("ينشر بانل مركز التذاكر في هذي القناة")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const panel = buildTicketPanel();
    await interaction.channel.send(panel);
    await interaction.reply({ content: `${config.emojis.success} تم نشر بانل التذاكر!`, ephemeral: true });
  },
};
