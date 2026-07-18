const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const config = require('../config');
const jsonDB = require('./jsonDB');
const { resolveEmoji, toButtonEmoji } = require('./ticketManager');

const DEFAULT_VERIFIED = { users: [] };

function buildVerificationPanel() {
  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`${resolveEmoji(config.emojis.verify)} التحقق`)
    .setDescription(
      `عشان تحصل على وصول كامل للسيرفر، اضغط على الزر تحت عشان تتحقق من حسابك.\n\n` +
      `هذا التحقق موجود عشان نمنع البوتات وحسابات السبام، ونخلي السيرفر آمن ونظيف للجميع.`
    )
    .setFooter({ text: 'Akatsuki • نظام التحقق' });

  if (config.verification.bannerImage) {
    embed.setImage(config.verification.bannerImage);
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('verify_button')
      .setLabel('تحقق الآن')
      .setEmoji(toButtonEmoji(config.emojis.verify))
      .setStyle(ButtonStyle.Success)
  );

  return { embeds: [embed], components: [row] };
}

async function verifyMember(member) {
  const db = jsonDB.read('verified', DEFAULT_VERIFIED);

  if (db.users.includes(member.id)) {
    return { alreadyVerified: true };
  }

  if (config.verification.verifiedRoleId) {
    await member.roles.add(config.verification.verifiedRoleId);
  }
  if (config.verification.unverifiedRoleId) {
    try {
      await member.roles.remove(config.verification.unverifiedRoleId);
    } catch (e) {
      // role might not exist on member, ignore
    }
  }

  db.users.push(member.id);
  jsonDB.write('verified', db);

  return { alreadyVerified: false };
}

module.exports = { buildVerificationPanel, verifyMember };
