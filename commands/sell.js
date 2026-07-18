const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('يقدم منتج جديد للموافقة عليه من الأونرز قبل ما ينشر'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('seller_submit_modal')
      .setTitle('تقديم منتج جديد');

    const nameInput = new TextInputBuilder()
      .setCustomId('product_name')
      .setLabel('اسم المنتج')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const descInput = new TextInputBuilder()
      .setCustomId('product_description')
      .setLabel('وصف المنتج')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const priceInput = new TextInputBuilder()
      .setCustomId('product_price')
      .setLabel('السعر')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const imageInput = new TextInputBuilder()
      .setCustomId('product_image')
      .setLabel('رابط صورة المنتج (اختياري)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(descInput),
      new ActionRowBuilder().addComponents(priceInput),
      new ActionRowBuilder().addComponents(imageInput)
    );

    await interaction.showModal(modal);
  },
};
