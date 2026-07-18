const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
} = require('@discordjs/voice');
const config = require('../config');

let currentConnection = null;

/**
 * Joins the configured voice channel and stays connected 24/7.
 * Auto-reconnects on disconnect (unless the bot was manually disconnected/kicked repeatedly).
 */
async function connectToVoice(client) {
  if (!config.voice.channelId) {
    console.warn('[Voice] VOICE_CHANNEL_ID not set, skipping 24/7 voice join.');
    return;
  }

  try {
    const channel = await client.channels.fetch(config.voice.channelId);
    if (!channel || !channel.isVoiceBased()) {
      console.warn('[Voice] Configured VOICE_CHANNEL_ID is not a valid voice channel.');
      return;
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: true,
    });

    currentConnection = connection;

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5000),
        ]);
        // Seems to be reconnecting to a new channel - do nothing, discordjs/voice will handle it
      } catch (err) {
        // Real disconnect - try to rejoin after a delay
        console.warn('[Voice] Disconnected, attempting to reconnect...');
        setTimeout(() => connectToVoice(client), config.voice.reconnectDelayMs);
        try {
          connection.destroy();
        } catch (e) {}
      }
    });

    connection.on('error', (err) => {
      console.error('[Voice] Connection error:', err.message);
    });

    console.log(`[Voice] Joined voice channel: ${channel.name} (24/7 mode active)`);
  } catch (err) {
    console.error('[Voice] Failed to join voice channel:', err.message);
    setTimeout(() => connectToVoice(client), config.voice.reconnectDelayMs);
  }
}

function getCurrentConnection() {
  return currentConnection;
}

module.exports = { connectToVoice, getCurrentConnection };
