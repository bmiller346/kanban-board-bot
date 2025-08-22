"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInteraction = void 0;
const createTaskCommand_1 = require("../commands/createTaskCommand");
const handleSubtaskCommand_1 = require("../commands/handleSubtaskCommand");
const handleUserBoardsCommand_1 = require("../commands/handleUserBoardsCommand");
const handleGoogleCalendarIntegrationCommand_1 = require("../commands/handleGoogleCalendarIntegrationCommand");
const handleInteraction = async (interaction) => {
    if (!interaction.isCommand())
        return;
    try {
        const { commandName } = interaction;
        switch (commandName) {
            case 'create-task':
                await createTaskCommand_1.createTaskCommand.execute(interaction);
                break;
            case 'subtask': // Assuming 'subtask' is the command name for subtask management
                await (0, handleSubtaskCommand_1.handleSubtaskCommand)(interaction);
                break;
            case 'user-boards': // Assuming 'user-boards' is the command name for user board management
                await (0, handleUserBoardsCommand_1.handleUserBoardsCommand)(interaction);
                break;
            case 'google-calendar': // Assuming 'google-calendar' is the command name for Google Calendar integration
                await (0, handleGoogleCalendarIntegrationCommand_1.handleGoogleCalendarIntegrationCommand)(interaction);
                break;
            // ... (cases for other commands) ...
            default:
                await interaction.reply({ content: 'Invalid command.', ephemeral: true });
        }
    }
    catch (error) {
        console.error('Unexpected error in handleInteraction:', error);
        await interaction.reply({ content: 'An error occurred while processing the command.', ephemeral: true });
    }
};
exports.handleInteraction = handleInteraction;
// Importing bot configurations from botconfig.json
const botconfig_json_1 = __importDefault(require("./config/botconfig.json"));
// Modify the client's initialization based on botconfig.json
// Assuming botconfig.json contains fields like prefix, token, etc.
const client = new Client({
    intents: botconfig_json_1.default.intents
});
// Login the client using the token from botconfig.json
client.login(botconfig_json_1.default.token);
