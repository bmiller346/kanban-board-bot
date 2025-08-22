"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SubtaskService_1 = require("../services/SubtaskService");
const handleSubtaskCommand = async (interaction) => {
    try {
        // ... (code for getting subtask details and parent task ID) ...
        await SubtaskService_1.SubtaskService.createSubtask(parentTaskId, subtaskDetails);
        await interaction.reply({ content: 'Subtask created successfully!', ephemeral: true });
    }
    catch (error) {
        console.error('Error in handleSubtaskCommand:', error);
        await interaction.reply({ content: 'Failed to create subtask. Please try again.', ephemeral: true });
    }
};
