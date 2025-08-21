// src/commands/handleSubtaskCommand.ts
import { CommandInteraction } from 'discord.js';
import { SubtaskService } from '../services/SubtaskService';

const handleSubtaskCommand = async (interaction: CommandInteraction) => {
  try {
    // ... (code for getting subtask details and parent task ID) ...

    await SubtaskService.createSubtask(parentTaskId, subtaskDetails);

    await interaction.reply({ content: 'Subtask created successfully!', ephemeral: true });
  } catch (error) {
    console.error('Error in handleSubtaskCommand:', error);
    await interaction.reply({ content: 'Failed to create subtask. Please try again.', ephemeral: true });
  }
};
