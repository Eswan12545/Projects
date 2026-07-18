const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const jsonDB = require('./jsonDB');

const DEFAULT_REVIEWS = { list: [], sellerStats: {} };

const STAR_FULL = '⭐';

function starsDisplay(rating) {
  return STAR_FULL.repeat(rating) + '☆'.repeat(5 - rating);
}

/**
 * Records a review, updates the seller's aggregate stats, and returns the saved entry.
 */
function addReview({ sellerId, reviewerId, rating, comment }) {
  const db = jsonDB.read('reviews', DEFAULT_REVIEWS);

  const entry = {
    id: db.list.length + 1,
    sellerId,
    reviewerId,
    rating,
    comment: comment || null,
    createdAt: Date.now(),
  };
  db.list.push(entry);

  if (!db.sellerStats[sellerId]) {
    db.sellerStats[sellerId] = { count: 0, total: 0 };
  }
  db.sellerStats[sellerId].count += 1;
  db.sellerStats[sellerId].total += rating;

  jsonDB.write('reviews', db);
  return entry;
}

function getSellerStats(sellerId) {
  const db = jsonDB.read('reviews', DEFAULT_REVIEWS);
  const stats = db.sellerStats[sellerId];
  if (!stats || stats.count === 0) return { count: 0, average: null };
  return { count: stats.count, average: stats.total / stats.count };
}

function buildReviewEmbed({ reviewer, seller, rating, comment }) {
  const stats = getSellerStats(seller.id);

  const embed = new EmbedBuilder()
    .setColor(config.colors.warning)
    .setAuthor({ name: `تقييم جديد لـ ${seller.tag}`, iconURL: seller.displayAvatarURL?.() })
    .addFields(
      { name: 'التقييم', value: starsDisplay(rating), inline: true },
      { name: 'من طرف', value: `${reviewer}`, inline: true },
      {
        name: 'متوسط تقييمات السيلر',
        value: stats.count ? `${stats.average.toFixed(1)} / 5 ⭐ (${stats.count} تقييم)` : 'لا يوجد',
        inline: false,
      }
    )
    .setTimestamp();

  if (comment) {
    embed.addFields({ name: 'التعليق', value: comment });
  }

  return embed;
}

module.exports = { addReview, getSellerStats, buildReviewEmbed, starsDisplay };
