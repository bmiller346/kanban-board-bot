"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskCommandData = void 0;
// src/commands/CommandTypes.ts
const builders_1 = require("@discordjs/builders");
exports.createTaskCommandData = new builders_1.SlashCommandBuilder()
    .setName('create-task')
    .setDescription('Creates a new task.')
    .addStringOption(option => option.setName('title')
    .setDescription('Title of the task')
    .setRequired(true))
    .addStringOption(option => option.setName('description')
    .setDescription('Description of the task')
    .setRequired(false))
    .addStringOption(option => option.setName('due_date')
    .setDescription('Due date of the task')
    .setRequired(false))
    .addStringOption(option => option.setName('status')
    .setDescription('Status of the task')
    .setRequired(true))
    .addStringOption(option => option.setName('priority')
    .setDescription('Priority of the task')
    .setRequired(false))
    .toJSON();
// Add other command data as needed
// Function to get Kanbot Command
function getKanbotCommand(input) {
    switch (input.toLowerCase()) {
        case 'add':
            return KanbotCommands.ADD;
        case 'clear':
            return KanbotCommands.CLEAR;
        case 'complete':
            return KanbotCommands.COMPLETE;
        case 'remove':
            return KanbotCommands.REMOVE;
        case 'start':
            return KanbotCommands.START;
        case 'help':
        default:
            return KanbotCommands.HELP;
    }
}
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const prefix = '!';
client.on('messageCreate', async (message) => {
    if (message.author.bot)
        return;
    if (message.content.startsWith(prefix)) {
        const input = message.content.slice(prefix.length);
        const kanbotRequest = KanbotRequest.parseString(input);
        switch (kanbotRequest.command) {
            case KanbotCommands.ADD:
                // Add task logic
                break;
            case KanbotCommands.CLEAR:
                // Clear board logic
                break;
            case KanbotCommands.COMPLETE:
                // Complete task logic
                break;
            case KanbotCommands.REMOVE:
                // Remove task logic
                break;
            case KanbotCommands.START:
                // Start task logic
                break;
            case KanbotCommands.HELP:
                // Help command logic
                break;
            default:
                break;
        }
    }
});
// Your implementations for buttons, select menus, webhooks, error handling, permissions, external integrations, reminders, multiple boards, task queries, analytics, tutorials, etc. can be added here.
client.login('YOUR_BOT_TOKEN');
