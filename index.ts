// src/index.ts

import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { registerEventHandlers } from './services/event-handler';
import { registerCommands } from './utils/registerCommands';

dotenv.config();

const client = new Client({
  intents: [
    in
    GatewayIntentBits.Guilds, // Allows the bot to receive information about guilds it's in
    GatewayIntentBits.GuildMessages, // Enables the bot to receive messages sent in guild text channels
    GatewayIntentBits.GuildMessageReactions, // Allows the bot to receive reactions added to messages
    // GatewayIntentBits.GuildMembers, // Provides information about members in a guild (Privileged)
    // GatewayIntentBits.GuildMessageContent, // Provides access to message content (Privileged)
    // GatewayIntentBits.GuildPresences, // Exposes presence information for all guild members (Privileged)
  ]
});

client.once('ready', () => {
  console.log(`${client.user.tag} is online!`);
  registerCommands(client);
  registerEventHandlers(client);
});

client.login(process.env.DISCORD_TOKEN);




// src/index.ts

import { Client, Intents } from 'discord.js';
import sequelize from './utils/database';
import { Guild } from './models/guild';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // Ensure the connection to the database is ready
  try {
    await sequelize.authenticate();
    console.log('Database connected!');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});

client.on('message', async (message) => {
  // Handle your commands and database interactions here
  // Example: adding a guild to the database
  if (message.content === '!addGuild') {
    try {
      const newGuild = await Guild.create({ id: message.guild.id });
      message.reply(`Guild added with ID: ${newGuild.id}`);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return message.reply('This guild already exists.');
      }
      return message.reply('Something went wrong with adding a guild.');
    }
  }

  // Further CRUD operations would go here
});

client.login('YOUR_BOT_TOKEN');
