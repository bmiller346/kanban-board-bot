"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskCommand = exports.createTaskCommandData = void 0;
//src/commands/command-handler.ts
const builders_1 = require("@discordjs/builders");
exports.createTaskCommandData = new builders_1.SlashCommandBuilder()
    .setName('create-task')
    .setDescription('Creates a new task.')
    .addStringOption(option => option.setName('title')
    .setDescription('The title of the task')
    .setRequired(true))
    .addStringOption(option => option.setName('description')
    .setDescription('A description of the task')
    .setRequired(false))
    .addStringOption(option => option.setName('status')
    .setDescription('The initial status of the task (Todo, In Progress, Done)')
    .setRequired(false)
    .addChoices({ name: 'Todo', value: 'Todo' }, { name: 'In Progress', value: 'In Progress' }, { name: 'Done', value: 'Done' }))
    .addStringOption(option => option.setName('priority')
    .setDescription('The priority of the task (Low, Medium, High)')
    .setRequired(false)
    .addChoices({ name: 'Low', value: 'Low' }, { name: 'Medium', value: 'Medium' }, { name: 'High', value: 'High' }))
    .addDateOption(option => option.setName('due_date')
    .setDescription('The due date for the task')
    .setRequired(false))
    .toJSON();
const TaskService_1 = require("../services/TaskService");
exports.createTaskCommand = {
    data: new builders_1.SlashCommandBuilder()
        .setName('create-task')
        .setDescription('Creates a new task.')
        .addStringOption(option => option.setName('title').setDescription('Title of the task').setRequired(true))
        // Add other options...
        .toJSON(),
    async execute(interaction) {
        const title = interaction.options.getString('title', true);
        const description = interaction.options.getString('description');
        const dueDateStr = interaction.options.getString('due_date');
        const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;
        const status = interaction.options.getString('status');
        const priority = interaction.options.getString('priority');
        const labels = interaction.options.getString('labels')?.split(',') || [];
        try {
            await TaskService_1.TaskService.createTask({ title, description, dueDate, status, priority, labels });
            await interaction.reply({ content: 'Task created successfully!', ephemeral: true });
        }
        catch (error) {
            console.error('Error in createTaskCommand:', error);
            await interaction.reply({ content: 'Failed to create task. Please try again.', ephemeral: true });
        }
    }
};
