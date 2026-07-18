const { SlashCommandBuilder } = require('discord.js');
const config = require('../config');
const { addReview, buildReviewEmbed } = require('../utils/reviewManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('review')
    .setDescription('قيّم تجربتك مع سيلر بعد الصفقة')
    .addUserOption((opt) =>
      opt.setName('seller').setDescription('السيلر اللي تعاملت معاه').setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName('rating')
        .setDescription('التقييم من 1 إلى 5 نجوم')
        .setRequired(true)
        .addChoices(
          { name: '⭐ 1', value: 1 },
          { name: '⭐⭐ 2', value: 2 },
          { name: '⭐⭐⭐ 3', value: 3 },
          { name: '⭐⭐⭐⭐ 4', value: 4 },
          { name: '⭐⭐⭐⭐⭐ 5', value: 5 }
        )
    )
    .addStringOption((opt) =>
      opt.setName('comment').setDescription('تعليق (اختياري)').setRequired(false)
    ),

  async execute(interaction) {
    const seller = interaction.options.getUser('seller');
    const rating = interaction.options.getInteger('rating');
    const comment = interaction.options.getString('comment');

    if (seller.id === interaction.user.id) {
      await interaction.reply({
        content: `${config.emojis.error} ما تقدرش تقيم نفسك.`,
        ephemeral: true,
      });
      return;
    }

    if (seller.bot) {
      await interaction.reply({
        content: `${config.emojis.error} ما تقدرش تقيم بوت.`,
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    addReview({
      sellerId: seller.id,
      reviewerId: interaction.user.id,
      rating,
      comment,
    });

    const embed = buildReviewEmbed({
      reviewer: interaction.user,
      seller,
      rating,
      comment,
    });

    // Post publicly in the configured reviews channel (falls back to shop channel)
    const reviewsChannelId = config.sellerShop.reviewsChannelId || config.sellerShop.publishChannelId;
    if (reviewsChannelId) {
      const channel = interaction.guild.channels.cache.get(reviewsChannelId);
      if (channel) {
        await channel.send({ embeds: [embed] }).catch(() => {});
      } else {
        console.warn(`[review] reviewsChannelId (${reviewsChannelId}) ma tla9itch f guild.channels.cache.`);
      }
    }

    // Try to DM the seller
    try {
      await seller.send({ embeds: [embed] });
    } catch (e) {
      // seller might have DMs closed, ignore
    }

    await interaction.editReply({ content: `${config.emojis.success} تم إرسال تقييمك، شكراً لك!` });
  },
};
