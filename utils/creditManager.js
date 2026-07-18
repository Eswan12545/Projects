const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const jsonDB = require('./jsonDB');

const DEFAULT_PENDING_CREDITS = {};

/**
 * Builds the "Purchase Instructions" embed shown to a buyer (matches the reference image):
 * shows what they get, the cost, the #credit command to copy, and expiry notice.
 */
function buildPurchaseInstructionsEmbed({ getLabel, costAmount, requestId }) {
  const command = `#credit ${config.credit.receiverId} ${costAmount}`;

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('تعليمات الشراء')
    .setDescription(
      `**بتاخذ:** ${getLabel}\n` +
      `**التكلفة:** ${costAmount.toLocaleString('en-US')} ${config.credit.currencyName}\n\n` +
      `انسخ وأرسل هذا الأمر:\n` +
      `\`\`\`${command}\`\`\`\n` +
      `أرسله في قناة الدفع\n\n` +
      `الكريدت بينضاف تلقائيًا بمجرد ما يتأكد.\n\n` +
      `*هذا العرض ينتهي خلال ${config.credit.offerExpiryMinutes} دقايق.*`
    );

  return { embed, command, requestId };
}

/**
 * Registers a pending credit-payment request. Returns the request id.
 * kind: 'ads' | 'seller_room' | any future purchasable feature
 * payload: whatever data is needed to complete the purchase once payment is detected
 */
function registerPendingCredit({ kind, payload, buyerId, amount }) {
  const db = jsonDB.read('pendingCredits', DEFAULT_PENDING_CREDITS);
  const id = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  db[id] = {
    id,
    kind,
    payload,
    buyerId,
    amount,
    createdAt: Date.now(),
    expiresAt: Date.now() + config.credit.offerExpiryMinutes * 60 * 1000,
    fulfilled: false,
  };

  jsonDB.write('pendingCredits', db);
  return id;
}

function getPendingCredit(id) {
  const db = jsonDB.read('pendingCredits', DEFAULT_PENDING_CREDITS);
  return db[id] || null;
}

function markFulfilled(id) {
  const db = jsonDB.read('pendingCredits', DEFAULT_PENDING_CREDITS);
  if (db[id]) {
    db[id].fulfilled = true;
    db[id].fulfilledAt = Date.now();
    jsonDB.write('pendingCredits', db);
  }
}

/**
 * Returns all non-expired, non-fulfilled pending requests for a given buyer.
 */
function getActivePendingForBuyer(buyerId) {
  const db = jsonDB.read('pendingCredits', DEFAULT_PENDING_CREDITS);
  const now = Date.now();
  return Object.values(db).filter(
    (r) => r.buyerId === buyerId && !r.fulfilled && r.expiresAt > now
  );
}

/**
 * Tries to detect a ProBot credit-confirmation message and match it to a pending request.
 * Since ProBot's exact message format can vary, this checks for:
 *  - the message author is ProBot (config.credit.proBotUserId) OR contains "credit"/"ProBot" wording
 *  - the message mentions the buyer
 *  - the message text contains the receiver ID and the expected amount
 * Returns the matched pending request, or null.
 */
function tryMatchProBotMessage(message) {
  if (!config.credit.paymentChannelId || message.channel.id !== config.credit.paymentChannelId) {
    return null;
  }

  // If we know ProBot's user id, only trust messages from it.
  if (config.credit.proBotUserId && message.author.id !== config.credit.proBotUserId) {
    return null;
  }

  const content = message.content || (message.embeds[0]?.description ?? '');
  const mentionedUser = message.mentions?.users?.first();

  const db = jsonDB.read('pendingCredits', DEFAULT_PENDING_CREDITS);
  const now = Date.now();

  for (const request of Object.values(db)) {
    if (request.fulfilled || request.expiresAt <= now) continue;

    const amountStr = String(request.amount);
    const mentionsReceiver = content.includes(config.credit.receiverId);
    const mentionsAmount = content.includes(amountStr) || content.includes(request.amount.toLocaleString('en-US'));
    const mentionsBuyer = mentionedUser ? mentionedUser.id === request.buyerId : true;

    if (mentionsReceiver && mentionsAmount && mentionsBuyer) {
      return request;
    }
  }

  return null;
}

module.exports = {
  buildPurchaseInstructionsEmbed,
  registerPendingCredit,
  getPendingCredit,
  markFulfilled,
  getActivePendingForBuyer,
  tryMatchProBotMessage,
};
