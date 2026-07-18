const { ActivityType } = require('discord.js');
const config = require('../config');
const { connectToVoice } = require('../utils/voiceManager');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[${config.botName}] Connecté en tant que ${client.user.tag}`);

    client.user.setPresence({
      activities: [{ name: 'Akatsuki Tickets', type: ActivityType.Watching }],
      status: 'online',
    });

    // 24/7 Voice
    await connectToVoice(client);
  },
};
