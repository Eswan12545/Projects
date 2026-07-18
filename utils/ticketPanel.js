const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const config = require('../config');
const { resolveEmoji } = require('./ticketManager');

/**
 * Builds the main "Ticket Center" panel embed + select menu (Image 2 style).
 */
function buildTicketPanel() {
  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setAuthor({ name: 'مركز التذاكر' })
    .setDescription(
      Object.values(config.tickets.types)
        .map((t) => `${resolveEmoji(t.emoji)} **${t.label}** - ${t.description}`)
        .join('\n')
    )
    .setFooter({ text: `© ${new Date().getFullYear()} Akatsuki. جميع الحقوق محفوظة.` });

  // Banner image placeholder (the "TICKET GENERAL" banner from Image 2)
  if (config.welcome.bannerImage) {
    embed.setImage(config.welcome.bannerImage);
  }


  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_type_select')
    .setPlaceholder('اختر نوع التذكرة...')
    .addOptions(
      Object.entries(config.tickets.types).map(([key, t]) => ({
        label: t.label,
        description: t.description,
        value: key,
        emoji: resolveEmoji(t.emoji).match(/:(\d+)>/)
          ? { id: resolveEmoji(t.emoji).match(/:(\d+)>/)[1] }
          : undefined,
      }))
    );

  const row = new ActionRowBuilder().addComponents(select);

  return { embeds: [embed], components: [row] };
}

module.exports = { buildTicketPanel };
