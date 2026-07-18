const { SlashCommandBuilder } = require('discord.js');
const config = require('../config');
const creditManager = require('../utils/creditManager');

// Private room price is stored as e.g. "20M" - convert to numeric credits
function parsePriceToNumeric(priceStr) {
  const match = /^(\d+(?:\.\d+)?)\s*M$/i.exec(priceStr.trim());
  if (!match) return null;
  return Math.round(parseFloat(match[1]) * 1_000_000);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy-private-room')
    .setDescription('يطلب شراء روم خاص بإسمك (يتأكد تلقائيًا بعد الدفع)'),

  async execute(interaction) {
    const priceNumeric = parsePriceToNumeric(config.sellerShop.privateRoom.price);
    if (priceNumeric === null) {
      await interaction.reply({ content: `${config.emojis.error} السعر مو مضبوط صح في الإعدادات (sellerShop.privateRoom.price).`, ephemeral: true });
      return;
    }

    const requestId = creditManager.registerPendingCredit({
      kind: 'seller_room',
      payload: {},
      buyerId: interaction.user.id,
      amount: priceNumeric,
    });

    const { embed } = creditManager.buildPurchaseInstructionsEmbed({
      getLabel: 'روم خاص (Private Room)',
      costAmount: priceNumeric,
      requestId,
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
