// Minimal bot entrypoint
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { registerEventHandlers } from './application/n-services/event-handler';
import { registerCommands } from './util/registerCommands';
import path from 'path';

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('DISCORD_TOKEN not set in environment. Set it in .env or your shell.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.once('ready', () => {
  console.log(`${client.user?.tag} is online!`);
  // Register commands from the application/commands directory
  registerCommands(client, path.join(__dirname, 'application', 'commands'));
  registerEventHandlers(client);
});

client.login(token).catch(err => {
  console.error('Failed to login:', err);
});
