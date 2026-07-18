const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const config = require('../config');

/**
 * Computes the price for a given option index.
 * Option 1 = basePrice, each option after adds priceStepPerOption.
 * e.g. basePrice=10, step=5 -> 10, 15, 20, 25, 30 ...
 */
function getOptionPrice(optionIndex) {
  const price = config.ads.basePrice + optionIndex * config.ads.priceStepPerOption;
  return `${price}${config.ads.currencySuffix}`;
}

/**
 * Returns the raw numeric price (no "M" suffix) - needed for the #credit command amount.
 * Assumes 1 "M" = 1,000,000 credits (matches the ProBot-style display in the reference image).
 */
function getOptionPriceNumeric(optionIndex) {
  const priceInM = config.ads.basePrice + optionIndex * config.ads.priceStepPerOption;
  return priceInM * 1_000_000;
}

function getOptionByIndex(index) {
  return config.ads.options[index];
}

function findOptionWithPrice(optionId) {
  const index = config.ads.options.findIndex((o) => o.id === optionId);
  if (index === -1) return null;
  return {
    option: config.ads.options[index],
    index,
    price: getOptionPrice(index),
    priceNumeric: getOptionPriceNumeric(index),
  };
}

/**
 * Builds the "Advertisement Menu" embed + select menu (Image 4 style).
 * Prices are computed dynamically: option 1 = basePrice, +priceStepPerOption per option after.
 */
function buildAdsPanel() {
  const optionsList = config.ads.options
    .map((o, i) => `» **${o.label}** — __${getOptionPrice(i)}__`)
    .join('\n');

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('📣 قائمة الإعلانات')
    .setDescription(
      `» يا هلا، جاهز تفجر سيرفرك؟ **إعلانات Akatsuki** حاضرة لك!\n` +
      `اختر الباقة اللي تناسبك من القائمة تحت وخلي سيرفرك يشتهر على طول. ` +
      `سواء تبي إعلان سريع أو تجربة VIP كاملة، عندنا خيارات تناسب كل ميزانية. شوف هذي:\n\n` +
      `${optionsList}\n\n` +
      `» اختر خيار من تحت وخلنا نخلي سيرفرك حديث الكل 💗`
    )
    .setFooter({ text: config.ads.signature })
    .setTimestamp();

  if (config.ads.panelGifUrl) {
    embed.setImage(config.ads.panelGifUrl);
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId('ads_option_select')
    .setPlaceholder('اختر خيار الإعلان')
    .addOptions(
      config.ads.options.map((o, i) => ({
        label: o.label,
        description: `${o.description} — ${getOptionPrice(i)}`,
        value: o.id,
      }))
    );

  const row = new ActionRowBuilder().addComponents(select);

  return { embeds: [embed], components: [row] };
}

/**
 * Builds the final public ad embed posted in the ads channel after payment is confirmed.
 */
function buildAdPostEmbed({ option, price, serverName, serverInfo, inviteLink, gifUrl, postedBy }) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(serverName || 'إعلان سيرفر')
    .setDescription(serverInfo || 'ما فيه وصف.')
    .addFields(
      { name: 'الباقة', value: option.label, inline: true },
      { name: 'السعر', value: price, inline: true },
      { name: 'المدة', value: option.days > 0 ? `${option.days} أيام` : 'فوري', inline: true }
    )
    .setFooter({ text: `${config.ads.signature} • ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` });

  if (gifUrl) embed.setImage(gifUrl);
  if (inviteLink) embed.addFields({ name: 'رابط الدعوة', value: inviteLink });

  const mentionText = option.mention === 'everyone' ? '@everyone' : option.mention === 'here' ? '@here' : '';

  return { embed, mentionText, option, postedBy };
}

module.exports = {
  buildAdsPanel,
  buildAdPostEmbed,
  getOptionPrice,
  getOptionPriceNumeric,
  getOptionByIndex,
  findOptionWithPrice,
};
