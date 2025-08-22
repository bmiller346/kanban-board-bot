"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Minimal bot entrypoint
require("dotenv/config");
const discord_js_1 = require("discord.js");
const event_handler_1 = require("./application/n-services/event-handler");
const registerCommands_1 = require("./util/registerCommands");
const path_1 = __importDefault(require("path"));
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('DISCORD_TOKEN not set in environment. Set it in .env or your shell.');
    process.exit(1);
}
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.GuildMessageReactions,
    ],
});
client.once('ready', () => {
    console.log(`${client.user?.tag} is online!`);
    // Register commands from the application/commands directory
    (0, registerCommands_1.registerCommands)(client, path_1.default.join(__dirname, 'application', 'commands'));
    (0, event_handler_1.registerEventHandlers)(client);
});
client.login(token).catch(err => {
    console.error('Failed to login:', err);
});
