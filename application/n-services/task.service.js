"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskCommand = exports.Task = exports.TaskPriority = exports.TaskStatus = exports.registerCommands = exports.TaskService = void 0;
const Task_1 = require("../models/Task");
const cron = __importStar(require("node-cron"));
const discord_js_1 = require("discord.js");
// Assume a database service is available for data persistence
const DatabaseService_1 = require("./DatabaseService");
class TaskService {
    static client; // Initialized elsewhere, used to send messages in Discord channels
    /**
     * Creates a new task and schedules a reminder if it has a due date.
     * @param taskDetails Details of the task to create.
     * @returns The created Task instance.
     */
    static async createTask(taskDetails) {
        try {
            const newTask = new Task_1.Task(taskDetails);
            await DatabaseService_1.DatabaseService.saveTask(newTask); // Save to the database
            if (newTask.dueDate) {
                this.scheduleReminder(newTask);
            }
            return newTask;
        }
        catch (error) {
            console.error("Failed to create task:", error);
            throw new Error("Error creating task.");
        }
    }
    /**
     * Schedules a reminder for the task if it has a due date.
     * @param task The task for which to schedule a reminder.
     */
    static scheduleReminder(task) {
        if (!task.dueDate)
            return;
        // Schedule a cron job to send a reminder at 9:00 AM on the due date
        cron.schedule(`0 9 ${task.dueDate.getDate()} ${task.dueDate.getMonth() + 1} *`, async () => {
            try {
                const reminderChannel = this.client.channels.cache.get('CHANNEL_ID');
                if (!reminderChannel) {
                    console.error("Reminder channel not found.");
                    return;
                }
                const embed = new discord_js_1.MessageEmbed()
                    .setTitle('Reminder: Task Due Today')
                    .setDescription(`Task: ${task.title}\nDescription: ${task.description}`)
                    .addField('Due Date', task.dueDate.toDateString(), true)
                    .setColor('#3498db');
                await reminderChannel.send({ embeds: [embed] });
            }
            catch (error) {
                console.error("Failed to send reminder:", error);
            }
        });
    }
    /**
     * Initializes the service with a Discord client instance.
     * @param client The Discord client instance.
     */
    static initialize(client) {
        this.client = client;
    }
}
exports.TaskService = TaskService;
// src/utils/registerCommands.ts
const discord_js_2 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const registerCommands = (client, commandsPath) => {
    client.commands = new discord_js_2.Collection();
    const commandFiles = fs_1.default.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
    for (const file of commandFiles) {
        const filePath = path_1.default.join(commandsPath, file);
        Promise.resolve(`${filePath}`).then(s => __importStar(require(s))).then(command => {
            client.commands.set(command.data.name, command);
        });
    }
};
exports.registerCommands = registerCommands;
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["Todo"] = "Todo";
    TaskStatus["InProgress"] = "In Progress";
    TaskStatus["Done"] = "Done";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["Low"] = "Low";
    TaskPriority["Medium"] = "Medium";
    TaskPriority["High"] = "High";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
class Task {
    name;
    status;
    priority;
    description;
    dueDate;
    constructor(name, status = TaskStatus.Todo, priority = TaskPriority.Low, description, dueDate) {
        this.name = name;
        this.status = status;
        this.priority = priority;
        this.description = description;
        this.dueDate = dueDate;
    }
}
exports.Task = Task;
// src/services/TaskService.ts
class TaskService {
    // Implement CRUD operations for tasks
    static createTask(taskData) {
        const newTask = new Task_1.Task(taskData.name, taskData.status, taskData.priority, taskData.description, taskData.dueDate);
        // Logic to add task to storage
        return newTask;
    }
}
exports.TaskService = TaskService;
// src/index.ts
const discord_js_3 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
const registerCommands_1 = require("./utils/registerCommands");
dotenv_1.default.config();
const commandsPath = path_1.default.join(__dirname, 'commands');
const client = new discord_js_1.Client({
    intents: [discord_js_3.GatewayIntentBits.Guilds, discord_js_3.GatewayIntentBits.GuildMessages, discord_js_3.GatewayIntentBits.MessageContent],
});
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    (0, exports.registerCommands)(client, commandsPath);
});
client.login(process.env.DISCORD_TOKEN);
// src/commands/createTaskCommand.ts
const discord_js_4 = require("discord.js");
const TaskService_1 = require("../services/TaskService");
exports.createTaskCommand = {
    data: new discord_js_4.SlashCommandBuilder()
        .setName('create-task')
        .setDescription('Creates a new task.')
        .addStringOption(option => option.setName('name').setDescription('Name of the task').setRequired(true))
        .addStringOption(option => option.setName('description').setDescription('Description of the task').setRequired(false))
        .addStringOption(option => option.setName('due_date').setDescription('Due date of the task (YYYY-MM-DD)').setRequired(false))
        .addStringOption(option => option.setName('status').setDescription('Status of the task').addChoices({ name: 'Todo', value: 'Todo' }, { name: 'InProgress', value: 'InProgress' }, { name: 'Done', value: 'Done' }).setRequired(true))
        .addStringOption(option => option.setName('priority').setDescription('Priority of the task').addChoices({ name: 'Low', value: 'Low' }, { name: 'Medium', value: 'Medium' }, { name: 'High', value: 'High' }).setRequired(true))
        .toJSON(),
    async execute(interaction) {
        const name = interaction.options.getString('name', true);
        const description = interaction.options.getString('description');
        const dueDateStr = interaction.options.getString('due_date');
        const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;
        const status = interaction.options.getString('status');
        const priority = interaction.options.getString('priority');
        const task = TaskService_1.TaskService.createTask({ name, description, dueDate, status, priority });
        await interaction.reply({ content: `Task '${task.name}' created successfully!`, ephemeral: true });
    }
};
