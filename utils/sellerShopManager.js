const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const jsonDB = require('./jsonDB');
const { createPrivateRoom } = require('./privateRoomManager');

const DEFAULT_SHOP = { counter: 0, pending: {}, approved: {}, rejected: {} };

/**
 * Builds the final embed(s) published in the public shop channel after approval.
 * Returns an array of embeds: an optional lightweight banner embed first,
 * followed by the product embed itself.
 */
function buildPublishedEmbed({ seller, productName, description, price, imageUrl }) {
  const embeds = [];

  if (config.sellerShop.publishBannerUrl) {
    embeds.push(
      new EmbedBuilder()
        .setColor(config.colors.primary)
        .setImage(config.sellerShop.publishBannerUrl)
    );
  }

  const productEmbed = new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle(`${config.emojis.shoppingCart} ${productName}`)
    .setDescription(
      `${description}\n\n` +
      `**السعر:** ${price}\n` +
      `**البائع:** ${seller}`
    )
    .setFooter({ text: 'Akatsuki Shop' })
    .setTimestamp();

  if (imageUrl) productEmbed.setImage(imageUrl);

  embeds.push(productEmbed);
  return embeds;
}

/**
 * Registers a new pending product submission, returns its numeric id.
 */
function submitProduct({ sellerId, sellerTag, productName, description, price, imageUrl }) {
  const db = jsonDB.read('sellerShop', DEFAULT_SHOP);
  db.counter += 1;
  const id = db.counter;

  db.pending[id] = {
    id,
    sellerId,
    sellerTag,
    productName,
    description,
    price,
    imageUrl: imageUrl || null,
    submittedAt: Date.now(),
  };

  jsonDB.write('sellerShop', db);
  return id;
}

function approveProduct(id, approvedBy) {
  const db = jsonDB.read('sellerShop', DEFAULT_SHOP);
  const product = db.pending[id];
  if (!product) return null;

  product.approvedAt = Date.now();
  product.approvedBy = approvedBy;

  delete db.pending[id];
  db.approved[id] = product;
  jsonDB.write('sellerShop', db);
  return product;
}

/**
 * Creates a private room purchase record + the actual Discord channel, named after the seller.
 */
async function purchasePrivateRoom(guild, seller) {
  const channel = await createPrivateRoom(
    guild,
    seller,
    config.sellerShop.privateRoom.categoryId,
    config.sellerShop.ownerRoleId,
    'shop-room'
  );

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`${config.emojis.shoppingCart} روم خاص — ${seller.username}`)
    .setDescription(
      `أهلاً ${seller}! هذا الروم الخاص بيك، استخدمه بحرية لعرض منتجاتك وتنظيم عملياتك.\n\n` +
      `**السعر المدفوع:** ${config.sellerShop.privateRoom.price}`
    )
    .setTimestamp();

  await channel.send({ content: `${seller}`, embeds: [embed] });
  return channel;
}

module.exports = {
  buildPublishedEmbed,
  submitProduct,
  approveProduct,
  purchasePrivateRoom,
};
