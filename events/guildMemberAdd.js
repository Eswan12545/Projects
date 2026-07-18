const { handleMemberJoin } = require('../utils/welcomeManager');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      await handleMemberJoin(member);
    } catch (err) {
      console.error('[GuildMemberAdd] Error handling welcome:', err.message);
    }
  },
};
