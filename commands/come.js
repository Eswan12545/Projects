const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('come')
    .setDescription('إرسال طلب إلى عضو معين')
    .addUserOption((opt) =>
      opt.setName('member').setDescription('العضو اللي تبي تناديه').setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.options.getUser('member');

    try {
      await member.send(`شخص ما يحتاجك في الروم ${interaction.channel}`);
      await interaction.reply({ content: `تم إرسال الطلب إلى ${member}`, ephemeral: true });
    } catch (err) {
      console.error(`حدث خطأ في الأمر /come: ${err.message}`);
      await interaction.reply({ content: `حدث خطأ: ${err.message}`, ephemeral: true });
    }
  },
};
