"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('DISCORD_TOKEN is not set. Create a .env file with DISCORD_TOKEN=your_token');
    process.exit(1);
}
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
});
client.once('ready', () => {
    console.log(`${client.user?.tag} is online (minimal bot)`);
});
client.on('messageCreate', (message) => {
    if (message.author.bot)
        return;
    if (message.content === '!ping') {
        message.reply('pong');
    }
});
client.login(token).catch(err => {
    console.error('Failed to login:', err);
    process.exit(1);
});
