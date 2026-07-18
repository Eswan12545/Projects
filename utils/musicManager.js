const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require('@discordjs/voice');
const play = require('play-dl');

// guildId -> { connection, player, queue: [track], volume, textChannel, voiceChannel, playing }
const guildQueues = new Map();

function getQueue(guildId) {
  return guildQueues.get(guildId) || null;
}

function ensureQueue(guildId, voiceChannel, textChannel) {
  let q = guildQueues.get(guildId);
  if (q) return q;

  const player = createAudioPlayer();
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: guildId,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });

  connection.subscribe(player);

  q = {
    connection,
    player,
    queue: [],
    volume: 100,
    textChannel,
    voiceChannel,
    current: null,
  };
  guildQueues.set(guildId, q);

  player.on(AudioPlayerStatus.Idle, () => {
    playNext(guildId);
  });

  player.on('error', (err) => {
    console.error(`[Music] Player error: ${err.message}`);
    playNext(guildId);
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5000),
      ]);
    } catch {
      destroyQueue(guildId);
    }
  });

  return q;
}

function destroyQueue(guildId) {
  const q = guildQueues.get(guildId);
  if (!q) return;
  try {
    q.player.stop();
    q.connection.destroy();
  } catch {
    // already destroyed
  }
  guildQueues.delete(guildId);
}

/**
 * Resolves a search term or URL (YouTube/Spotify/iTunes) into a playable
 * { title, url, thumbnail, durationText, requestedBy } track object.
 * Spotify/iTunes links are resolved by extracting the track title and
 * searching YouTube for the closest match (actual audio streams from YouTube).
 */
async function resolveTrack(query, requestedBy) {
  let searchTerm = query;

  if (play.sp_validate && play.sp_validate(query)) {
    try {
      const spInfo = await play.spotify(query);
      if (spInfo && spInfo.name) {
        const artists = spInfo.artists ? spInfo.artists.map((a) => a.name).join(', ') : '';
        searchTerm = `${spInfo.name} ${artists}`.trim();
      }
    } catch {
      // fall through, try raw query as search term
    }
  } else if (/music\.apple\.com/i.test(query)) {
    // iTunes/Apple Music: no public metadata API here, fall back to using
    // the URL slug as a search hint (best-effort).
    const slugMatch = /\/album\/([^/]+)/i.exec(query);
    if (slugMatch) {
      searchTerm = decodeURIComponent(slugMatch[1]).replace(/-/g, ' ');
    }
  }

  let ytUrl = null;
  let info = null;

  if (play.yt_validate && play.yt_validate(searchTerm) === 'video') {
    ytUrl = searchTerm;
    info = await play.video_basic_info(ytUrl);
    info = info.video_details;
  } else {
    const results = await play.search(searchTerm, { limit: 1, source: { youtube: 'video' } });
    if (!results || results.length === 0) return null;
    info = results[0];
    ytUrl = info.url;
  }

  return {
    title: info.title,
    url: ytUrl,
    thumbnail: info.thumbnails?.[0]?.url || null,
    durationText: info.durationRaw || 'مباشر',
    requestedBy,
  };
}

async function playNext(guildId) {
  const q = guildQueues.get(guildId);
  if (!q) return;

  if (q.queue.length === 0) {
    q.current = null;
    return;
  }

  const track = q.queue.shift();
  q.current = track;

  try {
    const stream = await play.stream(track.url);
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true,
    });
    resource.volume?.setVolume(q.volume / 100);
    q.player.play(resource);
    q.resource = resource;

    if (q.textChannel) {
      q.textChannel.send({ content: `🎶 دابا كنشغل: **${track.title}**` }).catch(() => {});
    }
  } catch (err) {
    console.error(`[Music] Stream error: ${err.message}`);
    if (q.textChannel) {
      q.textChannel.send({ content: `⚠️ ما قدرتش نشغل **${track.title}**، كنقفز للي بعدها.` }).catch(() => {});
    }
    playNext(guildId);
  }
}

function addToQueue(guildId, track) {
  const q = guildQueues.get(guildId);
  if (!q) return;
  q.queue.push(track);
  if (!q.current && q.player.state.status !== AudioPlayerStatus.Playing) {
    playNext(guildId);
  }
}

function skip(guildId) {
  const q = guildQueues.get(guildId);
  if (!q) return false;
  q.player.stop(); // triggers Idle -> playNext
  return true;
}

function stop(guildId) {
  const q = guildQueues.get(guildId);
  if (!q) return false;
  q.queue = [];
  destroyQueue(guildId);
  return true;
}

function pause(guildId) {
  const q = guildQueues.get(guildId);
  if (!q || !q.current) return false;
  return q.player.pause();
}

function resume(guildId) {
  const q = guildQueues.get(guildId);
  if (!q || !q.current) return false;
  return q.player.unpause();
}

function setVolume(guildId, volume) {
  const q = guildQueues.get(guildId);
  if (!q) return false;
  q.volume = Math.max(0, Math.min(200, volume));
  if (q.resource?.volume) {
    q.resource.volume.setVolume(q.volume / 100);
  }
  return true;
}

module.exports = {
  getQueue,
  ensureQueue,
  destroyQueue,
  resolveTrack,
  addToQueue,
  skip,
  stop,
  pause,
  resume,
  setVolume,
};
