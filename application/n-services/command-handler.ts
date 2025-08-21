

//src/commands/command-handler.ts
import { SlashCommandBuilder, TaskOptions } from '@discordjs/builders';

export const createTaskCommandData = new SlashCommandBuilder()
  .setName('create-task')
  .setDescription('Creates a new task.')
  .addStringOption(option =>
    option.setName('title')
      .setDescription('The title of the task')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('description')
      .setDescription('A description of the task')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('status')
      .setDescription('The initial status of the task (Todo, In Progress, Done)')
      .setRequired(false)
      .addChoices({ name: 'Todo', value: 'Todo' }, { name: 'In Progress', value: 'In Progress' }, { name: 'Done', value: 'Done' }))
  .addStringOption(option =>
    option.setName('priority')
      .setDescription('The priority of the task (Low, Medium, High)')
      .setRequired(false)
      .addChoices({ name: 'Low', value: 'Low' }, { name: 'Medium', value: 'Medium' }, { name: 'High', value: 'High' }))
  .addDateOption(option =>
    option.setName('due_date')
      .setDescription('The due date for the task')
      .setRequired(false))
  .toJSON();

// src/commands/createTaskCommand.ts
import { CommandInteraction } from 'discord.js';
import { TaskService } from '../services/TaskService';

export const createTaskCommand = {
  data: new SlashCommandBuilder()
    .setName('create-task')
    .setDescription('Creates a new task.')
    .addStringOption(option =>
      option.setName('title').setDescription('Title of the task').setRequired(true))
    // Add other options...
    .toJSON(),
  
  async execute(interaction: CommandInteraction) {
    const title = interaction.options.getString('title', true);
    const description = interaction.options.getString('description');
    const dueDateStr = interaction.options.getString('due_date');
    const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;
    const status = interaction.options.getString('status') as 'Todo' | 'InProgress' | 'Done';
    const priority = interaction.options.getString('priority') as 'Low' | 'Medium' | 'High';
    const labels = interaction.options.getString('labels')?.split(',') || [];

    try {
      await TaskService.createTask({ title, description, dueDate, status, priority, labels });
      await interaction.reply({ content: 'Task created successfully!', ephemeral: true });
    } catch (error) {
      console.error('Error in createTaskCommand:', error);
      await interaction.reply({ content: 'Failed to create task. Please try again.', ephemeral: true });
    }
  }
};
