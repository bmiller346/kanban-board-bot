import 'dotenv/config';
import { Client, ClientOptions, GatewayIntentBits } from 'discord.js';
import { KanbanBot } from './clients/discord-bot-wrapper';
import { KanbotConfiguration } from './application/kanbot-configuration';

const botName = process.env.BOT_NAME || 'Kanbot';
const token = process.env.DISCORD_TOKEN || '';
const prefix = process.env.COMMAND_PREFIX || ';
const commandName = process.env.COMMAND_NAME || 'kanbot';

const configuration: KanbotConfiguration = new KanbotConfiguration(botName, token, prefix, commandName);

const clientOptions: ClientOptions = { intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] };
const discordClient: Client = new Client(clientOptions);
const bot: KanbanBot = new KanbanBot(configuration, discordClient);
bot.setupBot();
bot.login().catch(err => console.error('Bot login error', err));
