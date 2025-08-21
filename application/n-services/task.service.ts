import { Task, ITask } from '../models/Task';
import * as cron from 'node-cron';
import { Client, TextChannel, MessageEmbed } from 'discord.js';

// Assume a database service is available for data persistence
import { DatabaseService } from './DatabaseService';

export class TaskService {
  private static client: Client; // Initialized elsewhere, used to send messages in Discord channels

  /**
   * Creates a new task and schedules a reminder if it has a due date.
   * @param taskDetails Details of the task to create.
   * @returns The created Task instance.
   */
  public static async createTask(taskDetails: ITask): Promise<Task> {
    try {
      const newTask = new Task(taskDetails);
      await DatabaseService.saveTask(newTask); // Save to the database

      if (newTask.dueDate) {
        this.scheduleReminder(newTask);
      }

      return newTask;
    } catch (error) {
      console.error("Failed to create task:", error);
      throw new Error("Error creating task.");
    }
  }

  /**
   * Schedules a reminder for the task if it has a due date.
   * @param task The task for which to schedule a reminder.
   */
  private static scheduleReminder(task: Task): void {
    if (!task.dueDate) return;

    // Schedule a cron job to send a reminder at 9:00 AM on the due date
    cron.schedule(`0 9 ${task.dueDate.getDate()} ${task.dueDate.getMonth() + 1} *`, async () => {
      try {
        const reminderChannel = this.client.channels.cache.get('CHANNEL_ID') as TextChannel;
        if (!reminderChannel) {
          console.error("Reminder channel not found.");
          return;
        }

        const embed = new MessageEmbed()
          .setTitle('Reminder: Task Due Today')
          .setDescription(`Task: ${task.title}\nDescription: ${task.description}`)
          .addField('Due Date', task.dueDate.toDateString(), true)
          .setColor('#3498db');

        await reminderChannel.send({ embeds: [embed] });
      } catch (error) {
        console.error("Failed to send reminder:", error);
      }
    });
  }

  /**
   * Initializes the service with a Discord client instance.
   * @param client The Discord client instance.
   */
  public static initialize(client: Client): void {
    this.client = client;
  }

  // Additional CRUD operations and task management logic...
}





// src/utils/registerCommands.ts
import { Client, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';

export const registerCommands = (client: Client, commandsPath: string) => {
  client.commands = new Collection();
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    import(filePath).then(command => {
      client.commands.set(command.data.name, command);
    });
  }
};

// src/models/Task.ts
export interface ITask {
  name: string;
  description?: string;
  dueDate?: Date;
  status: TaskStatus;
  priority: TaskPriority;
}

export enum TaskStatus {
  Todo = 'Todo',
  InProgress = 'In Progress',
  Done = 'Done',
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export class Task implements ITask {
  constructor(
    public name: string,
    public status: TaskStatus = TaskStatus.Todo,
    public priority: TaskPriority = TaskPriority.Low,
    public description?: string,
    public dueDate?: Date,
  ) {}

  // Additional methods related to Task can be added here
}

// src/services/TaskService.ts
export class TaskService {
  // Implement CRUD operations for tasks
  static createTask(taskData: ITask): Task {
    const newTask = new Task(taskData.name, taskData.status, taskData.priority, taskData.description, taskData.dueDate);
    // Logic to add task to storage
    return newTask;
  }

  // Add methods for read, update, and delete operations
}

// src/index.ts
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { registerCommands } from './utils/registerCommands';

dotenv.config();
const commandsPath = path.join(__dirname, 'commands');
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  registerCommands(client, commandsPath);
});

client.login(process.env.DISCORD_TOKEN);

// src/commands/createTaskCommand.ts
import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { TaskService } from '../services/TaskService';

export const createTaskCommand = {
  data: new SlashCommandBuilder()
    .setName('create-task')
    .setDescription('Creates a new task.')
    .addStringOption(option =>
      option.setName('name').setDescription('Name of the task').setRequired(true))
    .addStringOption(option =>
      option.setName('description').setDescription('Description of the task').setRequired(false))
    .addStringOption(option =>
      option.setName('due_date').setDescription('Due date of the task (YYYY-MM-DD)').setRequired(false))
    .addStringOption(option =>
      option.setName('status').setDescription('Status of the task').addChoices(
        { name: 'Todo', value: 'Todo' },
        { name: 'InProgress', value: 'InProgress' },
        { name: 'Done', value: 'Done' }
      ).setRequired(true))
    .addStringOption(option =>
      option.setName('priority').setDescription('Priority of the task').addChoices(
        { name: 'Low', value: 'Low' },
        { name: 'Medium', value: 'Medium' },
        { name: 'High', value: 'High' }
      ).setRequired(true))
    .toJSON(),

  async execute(interaction: CommandInteraction) {
    const name = interaction.options.getString('name', true);
    const description = interaction.options.getString('description');
    const dueDateStr = interaction.options.getString('due_date');
    const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;
    const status = interaction.options.getString('status') as TaskStatus;
    const priority = interaction.options.getString('priority') as TaskPriority;

    const task = TaskService.createTask({ name, description, dueDate, status, priority });
    await interaction.reply({ content: `Task '${task.name}' created successfully!`, ephemeral: true });
  }
};
