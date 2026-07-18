const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const config = require('./config');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

// ==================== LOAD COMMANDS ====================
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

// ==================== LOAD EVENTS ====================
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

client.once('ready', () => {
  console.log('=== [DEBUG] ROLE ID CHECK ===');
  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) {
    console.log(`[DEBUG] GUILD_ID (${config.guildId}) ma tla9itch f client.guilds.cache! Tcheck GUILD_ID f .env.`);
  } else {
    const checks = [
      ['STAFF_ROLE_ID', config.tickets.staffRoleId],
      ['SELLER_ROLE_ID', config.sellerShop.sellerRoleId],
      ['SELLER_OWNER_ROLE_ID', config.sellerShop.ownerRoleId],
    ];
    for (const [name, id] of checks) {
      if (!id) {
        console.log(`[DEBUG] ${name}: KHAWYA f .env`);
        continue;
      }
      const role = guild.roles.cache.get(id);
      console.log(`[DEBUG] ${name}=${id} -> ${role ? `LQAHA: "${role.name}"` : 'MA LQAHACH! ID ghalt wla role matmsa7t'}`);
    }
  }
  console.log('=== [DEBUG] END ===');
});

client.login(config.token);
