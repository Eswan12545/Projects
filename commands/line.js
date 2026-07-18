const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const config = require('../config');

const GIF_PATH = path.join(__dirname, '..', 'assets', 'standard.gif');

function hasPermission(member) {
  if (!member || !member.roles) return false;
  const roleIds = [config.tickets.staffRoleId, config.sellerShop.sellerRoleId, config.sellerShop.ownerRoleId].filter(Boolean);
  return roleIds.some((id) => member.roles.cache.has(id));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('line')
    .setDescription('يصيفط اللاين الخفيف (GIF) في هذي القناة — للستاف والسيلرز بس'),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) {
      await interaction.reply({
        content: `${config.emojis.error} هذا الأمر خاص بالستاف والسيلرز بس.`,
        ephemeral: true,
      });
      return;
    }

    try {
      const attachment = new AttachmentBuilder(GIF_PATH, { name: 'standard.gif' });
      await interaction.reply({ content: `${config.emojis.success} تم الإرسال`, ephemeral: true });
      await interaction.channel.send({ files: [attachment] });
    } catch (err) {
      console.error(`حدث خطأ في الأمر /line: ${err.message}`);
      const payload = { content: `${config.emojis.error} حدث خطأ: ${err.message}`, ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  },
};
