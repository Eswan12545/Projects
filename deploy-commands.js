const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log(`[Deploy] Registering ${commands.length} slash commands...`);

    if (config.guildId) {
      // Instant registration for a single guild (recommended during dev)
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      console.log(`[Deploy] Successfully registered commands for guild ${config.guildId}.`);
    } else {
      // Global registration (takes up to 1h to propagate)
      await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
      console.log('[Deploy] Successfully registered global commands.');
    }
  } catch (error) {
    console.error('[Deploy] Error registering commands:', error);
  }
})();
