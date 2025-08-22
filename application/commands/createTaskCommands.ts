
// src/commands/createTaskCommand.ts
import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, CacheType } from 'discord.js';
import { TaskService } from '../services/TaskService';
import { TaskStatus, TaskPriority } from '../models/task';

export const createTaskCommand = {
  data: new SlashCommandBuilder()
    .setName('create-task')
    .setDescription('Creates a new task.')
    // Add options here
    .toJSON(),

  async execute(interaction: CommandInteraction<CacheType>) {
    // Implementation as shown previously
  },
};

export default createTaskCommand; // Ensure default export if using dynamic imports
