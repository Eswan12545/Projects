const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const music = require('./musicManager');

const PREFIX = '!';

/**
 * Handles a prefix music command. Returns true if the message was a music
 * command (handled or errored), false if it wasn't one at all.
 */
async function handleMusicCommand(message) {
  if (!message.content.startsWith(PREFIX)) return false;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  const musicCommands = ['play', 'skip', 'stop', 'pause', 'resume', 'volume', 'queue', 'leave'];
  if (!musicCommands.includes(cmd)) return false;

  const voiceChannel = message.member?.voice?.channel;

  if (cmd === 'play') {
    if (!voiceChannel) {
      await message.reply(`${config.emojis.error} خاصك تكون في روم صوتي باش تستخدم هذا الأمر.`);
      return true;
    }
    const query = args.join(' ');
    if (!query) {
      await message.reply(`${config.emojis.error} كتب اسم الأغنية أو رابط (يوتيوب/سبوتيفاي/آيتونز). مثال: \`!play اسم الأغنية\``);
      return true;
    }

    const loadingMsg = await message.reply('🔎 كنقلب على الأغنية...');

    let track;
    try {
      track = await music.resolveTrack(query, message.author);
    } catch (err) {
      console.error(`[Music] resolveTrack error: ${err.message}`);
      await loadingMsg.edit(`${config.emojis.error} صار خطأ وأنا كنقلب على الأغنية، جرب مرة ثانية.`);
      return true;
    }

    if (!track) {
      await loadingMsg.edit(`${config.emojis.error} ما لقيتش نتيجة لـ "${query}".`);
      return true;
    }

    music.ensureQueue(message.guild.id, voiceChannel, message.channel);
    music.addToQueue(message.guild.id, track);

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${config.emojis.success} تمت الإضافة للقائمة`)
      .setDescription(`**${track.title}**`)
      .addFields(
        { name: 'المدة', value: track.durationText, inline: true },
        { name: 'طلبها', value: `${message.author}`, inline: true }
      );
    if (track.thumbnail) embed.setThumbnail(track.thumbnail);

    await loadingMsg.edit({ content: null, embeds: [embed] });
    return true;
  }

  const q = music.getQueue(message.guild.id);

  if (cmd === 'skip') {
    if (!q || !q.current) {
      await message.reply(`${config.emojis.error} ماكاين والو كيتشغل دابا.`);
      return true;
    }
    music.skip(message.guild.id);
    await message.reply(`${config.emojis.success} تم تخطي الأغنية.`);
    return true;
  }

  if (cmd === 'stop' || cmd === 'leave') {
    if (!q) {
      await message.reply(`${config.emojis.error} البوت ماشي في روم صوتي.`);
      return true;
    }
    music.stop(message.guild.id);
    await message.reply(`${config.emojis.success} تم إيقاف الموسيقى وخروج البوت من الروم.`);
    return true;
  }

  if (cmd === 'pause') {
    if (!q || !q.current) {
      await message.reply(`${config.emojis.error} ماكاين والو كيتشغل دابا.`);
      return true;
    }
    music.pause(message.guild.id);
    await message.reply(`⏸️ تم إيقاف الأغنية مؤقتًا.`);
    return true;
  }

  if (cmd === 'resume') {
    if (!q || !q.current) {
      await message.reply(`${config.emojis.error} ماكاين والو موقّف.`);
      return true;
    }
    music.resume(message.guild.id);
    await message.reply(`▶️ تم استئناف التشغيل.`);
    return true;
  }

  if (cmd === 'volume') {
    const vol = parseInt(args[0], 10);
    if (!q) {
      await message.reply(`${config.emojis.error} البوت ماشي في روم صوتي.`);
      return true;
    }
    if (isNaN(vol) || vol < 0 || vol > 200) {
      await message.reply(`${config.emojis.error} كتب رقم بين 0 و 200. مثال: \`!volume 80\``);
      return true;
    }
    music.setVolume(message.guild.id, vol);
    await message.reply(`🔊 الصوت دابا: ${vol}%`);
    return true;
  }

  if (cmd === 'queue') {
    if (!q || (!q.current && q.queue.length === 0)) {
      await message.reply(`${config.emojis.error} القائمة فارغة.`);
      return true;
    }
    const lines = [];
    if (q.current) lines.push(`🎶 **دابا كيتشغل:** ${q.current.title}`);
    q.queue.forEach((t, i) => lines.push(`${i + 1}. ${t.title}`));

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('قائمة الانتظار')
      .setDescription(lines.join('\n'));

    await message.reply({ embeds: [embed] });
    return true;
  }

  return false;
}

module.exports = { handleMusicCommand };
