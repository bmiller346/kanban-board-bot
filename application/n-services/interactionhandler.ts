// src/services/interactionHandler.ts
import { Interaction } from 'discord.js';
import { createTaskCommand } from '../commands/createTaskCommand';
import { handleSubtaskCommand } from '../commands/handleSubtaskCommand';
import { handleUserBoardsCommand } from '../commands/handleUserBoardsCommand';
import { handleGoogleCalendarIntegrationCommand } from '../commands/handleGoogleCalendarIntegrationCommand';

export const handleInteraction = async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  try {
    const { commandName } = interaction;

    switch (commandName) {
      case 'create-task':
        await createTaskCommand.execute(interaction);
        break;
      case 'subtask': // Assuming 'subtask' is the command name for subtask management
        await handleSubtaskCommand(interaction);
        break;
      case 'user-boards': // Assuming 'user-boards' is the command name for user board management
        await handleUserBoardsCommand(interaction);
        break;
      case 'google-calendar': // Assuming 'google-calendar' is the command name for Google Calendar integration
        await handleGoogleCalendarIntegrationCommand(interaction);
        break;
      // ... (cases for other commands) ...
      default:
        await interaction.reply({ content: 'Invalid command.', ephemeral: true });
    }
  } catch (error) {
    console.error('Unexpected error in handleInteraction:', error);
    await interaction.reply({ content: 'An error occurred while processing the command.', ephemeral: true });
  }
};

// Importing bot configurations from botconfig.json
import botConfig from './config/botconfig.json';

// Modify the client's initialization based on botconfig.json
// Assuming botconfig.json contains fields like prefix, token, etc.
const client: Client = new Client({
  intents: botConfig.intents
});

// Login the client using the token from botconfig.json
client.login(botConfig.token);