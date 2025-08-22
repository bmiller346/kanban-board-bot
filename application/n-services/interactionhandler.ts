// src/services/interactionHandler.ts
import { CommandInteraction, Interaction } from 'discord.js';
import { handleCalendarIntegrationCommand } from '../commands/handlecalendarintegrationcommand';

export const handleInteraction = async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  try {
    const { commandName } = interaction;

    switch (commandName) {
      case 'calendar-integration':
        await handleCalendarIntegrationCommand(interaction);
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