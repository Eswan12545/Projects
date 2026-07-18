const { SlashCommandBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('إرسال رسالة معينة')
    .addStringOption((opt) =>
      opt.setName('message').setDescription('الرسالة اللي تبي تصيفطها').setRequired(true)
    ),

  async execute(interaction) {
    const message = interaction.options.getString('message');

    try {
      await interaction.reply({ content: `${config.emojis.success} تم الإرسال`, ephemeral: true });
      await interaction.channel.send(message);
    } catch (err) {
      console.error(`حدث خطأ في الأمر /say: ${err.message}`);
      const errPayload = { content: `${config.emojis.error} حدث خطأ: ${err.message}`, ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errPayload);
      } else {
        await interaction.reply(errPayload);
      }
    }
  },
};
