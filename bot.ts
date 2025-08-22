// Modern Discord bot implementation with proper architecture
import { 
  Client, 
  GatewayIntentBits, 
  Events, 
  REST, 
  Routes,
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  ActivityType
} from 'discord.js';
import { config } from 'dotenv';
import { useKanbanStore } from './application/store/kanban-store';
import { validateTask, validateBoard } from './application/schemas';
import { z } from 'zod';

// Load environment variables
config();

// Bot configuration schema
const BotConfigSchema = z.object({
  token: z.string().min(1, 'DISCORD_TOKEN is required'),
  clientId: z.string().min(1, 'DISCORD_CLIENT_ID is required'),
  guildId: z.string().optional(),
});

// Validate environment
const botConfig = BotConfigSchema.parse({
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID,
});

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Command definitions
const commands = [
  new SlashCommandBuilder()
    .setName('create-board')
    .setDescription('Create a new Kanban board')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Board name')
        .setRequired(true)
        .setMaxLength(100)
    )
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Board description')
        .setRequired(false)
        .setMaxLength(500)
    )
    .addBooleanOption(option =>
      option.setName('private')
        .setDescription('Make this board private')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('create-task')
    .setDescription('Create a new task')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Task title')
        .setRequired(true)
        .setMaxLength(200)
    )
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Task description')
        .setRequired(false)
        .setMaxLength(2000)
    )
    .addStringOption(option =>
      option.setName('priority')
        .setDescription('Task priority')
        .setRequired(false)
        .addChoices(
          { name: 'Low', value: 'Low' },
          { name: 'Medium', value: 'Medium' },
          { name: 'High', value: 'High' }
        )
    )
    .addStringOption(option =>
      option.setName('board')
        .setDescription('Board ID (leave empty for active board)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('move-task')
    .setDescription('Move a task to a different status')
    .addStringOption(option =>
      option.setName('task-id')
        .setDescription('Task ID')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('status')
        .setDescription('New status')
        .setRequired(true)
        .addChoices(
          { name: 'Todo', value: 'Todo' },
          { name: 'In Progress', value: 'InProgress' },
          { name: 'Done', value: 'Done' }
        )
    ),

  new SlashCommandBuilder()
    .setName('list-boards')
    .setDescription('List your Kanban boards'),

  new SlashCommandBuilder()
    .setName('view-board')
    .setDescription('View a Kanban board')
    .addStringOption(option =>
      option.setName('board-id')
        .setDescription('Board ID (leave empty for active board)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('set-active-board')
    .setDescription('Set your active board')
    .addStringOption(option =>
      option.setName('board-id')
        .setDescription('Board ID')
        .setRequired(true)
    ),
];

// Command handlers
const commandHandlers = {
  'create-board': async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    
    const name = interaction.options.getString('name', true);
    const description = interaction.options.getString('description');
    const isPrivate = interaction.options.getBoolean('private') ?? false;

    try {
      const board = useKanbanStore.getState().createBoard({
        name,
        description: description || undefined,
        ownerId: interaction.user.id,
        memberIds: [interaction.user.id],
        isPrivate,
        columns: ['Todo', 'InProgress', 'Done'],
      });

      const embed = new EmbedBuilder()
        .setTitle('✅ Board Created Successfully!')
        .setDescription(`Created board: **${board.name}**`)
        .addFields(
          { name: 'Board ID', value: board.id, inline: true },
          { name: 'Private', value: isPrivate ? 'Yes' : 'No', inline: true },
          { name: 'Members', value: '1 (you)', inline: true }
        )
        .setColor('#00ff88')
        .setTimestamp();

      if (description) {
        embed.addFields({ name: 'Description', value: description });
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error creating board:', error);
      await interaction.reply({ 
        content: '❌ Failed to create board. Please try again.', 
        ephemeral: true 
      });
    }
  },

  'create-task': async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;

    const title = interaction.options.getString('title', true);
    const description = interaction.options.getString('description');
    const priority = interaction.options.getString('priority') as 'Low' | 'Medium' | 'High' || 'Medium';
    const boardId = interaction.options.getString('board') || useKanbanStore.getState().activeBoard;

    if (!boardId) {
      await interaction.reply({ 
        content: '❌ No board specified and no active board set. Use `/set-active-board` or specify a board ID.', 
        ephemeral: true 
      });
      return;
    }

    const board = useKanbanStore.getState().boards.get(boardId);
    if (!board) {
      await interaction.reply({ 
        content: '❌ Board not found.', 
        ephemeral: true 
      });
      return;
    }

    // Check permissions
    if (!board.memberIds.includes(interaction.user.id) && board.ownerId !== interaction.user.id) {
      await interaction.reply({ 
        content: '❌ You don\'t have permission to create tasks in this board.', 
        ephemeral: true 
      });
      return;
    }

    try {
      const task = useKanbanStore.getState().createTask({
        name: title,
        description: description || undefined,
        status: 'Todo',
        priority,
        boardId,
        assignedTo: [interaction.user.id],
        tags: [],
      });

      const embed = new EmbedBuilder()
        .setTitle('📝 Task Created Successfully!')
        .setDescription(`**${task.name}**`)
        .addFields(
          { name: 'Task ID', value: task.id, inline: true },
          { name: 'Status', value: task.status, inline: true },
          { name: 'Priority', value: task.priority, inline: true },
          { name: 'Board', value: board.name, inline: true },
          { name: 'Assigned to', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setColor('#4285f4')
        .setTimestamp();

      if (description) {
        embed.addFields({ name: 'Description', value: description });
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error creating task:', error);
      await interaction.reply({ 
        content: '❌ Failed to create task. Please try again.', 
        ephemeral: true 
      });
    }
  },

  'move-task': async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;

    const taskId = interaction.options.getString('task-id', true);
    const newStatus = interaction.options.getString('status', true) as 'Todo' | 'InProgress' | 'Done';

    const store = useKanbanStore.getState();
    const task = store.tasks.get(taskId);

    if (!task) {
      await interaction.reply({ 
        content: '❌ Task not found.', 
        ephemeral: true 
      });
      return;
    }

    const board = store.boards.get(task.boardId);
    if (!board) {
      await interaction.reply({ 
        content: '❌ Board not found.', 
        ephemeral: true 
      });
      return;
    }

    // Check permissions
    if (!board.memberIds.includes(interaction.user.id) && board.ownerId !== interaction.user.id) {
      await interaction.reply({ 
        content: '❌ You don\'t have permission to modify tasks in this board.', 
        ephemeral: true 
      });
      return;
    }

    try {
      store.moveTask(taskId, newStatus);

      const embed = new EmbedBuilder()
        .setTitle('🔄 Task Moved Successfully!')
        .setDescription(`**${task.name}**`)
        .addFields(
          { name: 'Old Status', value: task.status, inline: true },
          { name: 'New Status', value: newStatus, inline: true },
          { name: 'Board', value: board.name, inline: true }
        )
        .setColor('#ff9500')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error moving task:', error);
      await interaction.reply({ 
        content: '❌ Failed to move task. Please try again.', 
        ephemeral: true 
      });
    }
  },

  'list-boards': async (interaction: CommandInteraction) => {
    const store = useKanbanStore.getState();
    const userBoards = store.getUserBoards(interaction.user.id);

    if (userBoards.length === 0) {
      await interaction.reply({ 
        content: '📋 You don\'t have any boards yet. Create one with `/create-board`!', 
        ephemeral: true 
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 Your Kanban Boards')
      .setColor('#4285f4')
      .setTimestamp();

    for (const board of userBoards.slice(0, 10)) { // Limit to 10 boards
      const taskCount = store.getTasksByBoard(board.id).length;
      const isOwner = board.ownerId === interaction.user.id;
      const status = store.activeBoard === board.id ? '🟢 Active' : '⚪';
      
      embed.addFields({
        name: `${status} ${board.name} ${isOwner ? '👑' : ''}`,
        value: `ID: \`${board.id}\`\nTasks: ${taskCount}\nMembers: ${board.memberIds.length}${board.description ? `\n${board.description.substring(0, 100)}` : ''}`,
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  },

  'view-board': async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;

    const boardId = interaction.options.getString('board-id') || useKanbanStore.getState().activeBoard;

    if (!boardId) {
      await interaction.reply({ 
        content: '❌ No board specified and no active board set. Use `/set-active-board` or specify a board ID.', 
        ephemeral: true 
      });
      return;
    }

    const store = useKanbanStore.getState();
    const board = store.boards.get(boardId);

    if (!board) {
      await interaction.reply({ 
        content: '❌ Board not found.', 
        ephemeral: true 
      });
      return;
    }

    // Check permissions for private boards
    if (board.isPrivate && !board.memberIds.includes(interaction.user.id) && board.ownerId !== interaction.user.id) {
      await interaction.reply({ 
        content: '❌ This is a private board and you don\'t have access.', 
        ephemeral: true 
      });
      return;
    }

    const todoTasks = store.getTasksByStatus(boardId, 'Todo');
    const inProgressTasks = store.getTasksByStatus(boardId, 'InProgress');
    const doneTasks = store.getTasksByStatus(boardId, 'Done');

    const embed = new EmbedBuilder()
      .setTitle(`📋 ${board.name}`)
      .setColor('#4285f4')
      .setTimestamp();

    if (board.description) {
      embed.setDescription(board.description);
    }

    embed.addFields(
      { 
        name: '📝 Todo', 
        value: todoTasks.length > 0 ? todoTasks.map(t => `• ${t.name}`).slice(0, 5).join('\n') : 'No tasks',
        inline: true 
      },
      { 
        name: '🔄 In Progress', 
        value: inProgressTasks.length > 0 ? inProgressTasks.map(t => `• ${t.name}`).slice(0, 5).join('\n') : 'No tasks',
        inline: true 
      },
      { 
        name: '✅ Done', 
        value: doneTasks.length > 0 ? doneTasks.map(t => `• ${t.name}`).slice(0, 5).join('\n') : 'No tasks',
        inline: true 
      }
    );

    embed.addFields(
      { name: 'Board ID', value: boardId, inline: true },
      { name: 'Total Tasks', value: (todoTasks.length + inProgressTasks.length + doneTasks.length).toString(), inline: true },
      { name: 'Members', value: board.memberIds.length.toString(), inline: true }
    );

    await interaction.reply({ embeds: [embed] });
  },

  'set-active-board': async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;

    const boardId = interaction.options.getString('board-id', true);
    const store = useKanbanStore.getState();
    const board = store.boards.get(boardId);

    if (!board) {
      await interaction.reply({ 
        content: '❌ Board not found.', 
        ephemeral: true 
      });
      return;
    }

    // Check permissions
    if (!board.memberIds.includes(interaction.user.id) && board.ownerId !== interaction.user.id) {
      await interaction.reply({ 
        content: '❌ You don\'t have access to this board.', 
        ephemeral: true 
      });
      return;
    }

    store.setActiveBoard(boardId);

    await interaction.reply({ 
      content: `✅ Active board set to: **${board.name}** (\`${boardId}\`)`, 
      ephemeral: true 
    });
  },
};

// Event handlers
client.once(Events.ClientReady, readyClient => {
  console.log(`🚀 Kanban Bot is ready! Logged in as ${readyClient.user.tag}`);
  
  // Set bot activity
  client.user?.setActivity('Managing Kanban boards', { type: ActivityType.Playing });
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const handler = commandHandlers[interaction.commandName as keyof typeof commandHandlers];
  
  if (!handler) {
    await interaction.reply({ content: '❌ Unknown command.', ephemeral: true });
    return;
  }

  try {
    await handler(interaction);
  } catch (error) {
    console.error('Error executing command:', error);
    
    const errorMessage = '❌ There was an error executing this command!';
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
});

// Error handling
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

// Register commands and start bot
async function deployCommands() {
  if (!botConfig.clientId || !botConfig.token) {
    throw new Error('Missing required environment variables');
  }

  const rest = new REST().setToken(botConfig.token);

  try {
    console.log('🔄 Started refreshing application (/) commands.');

    const commandsData = commands.map(command => command.toJSON());

    if (botConfig.guildId) {
      // Guild commands (faster for development)
      await rest.put(
        Routes.applicationGuildCommands(botConfig.clientId, botConfig.guildId),
        { body: commandsData }
      );
    } else {
      // Global commands (takes up to an hour to deploy)
      await rest.put(
        Routes.applicationCommands(botConfig.clientId),
        { body: commandsData }
      );
    }

    console.log('✅ Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
}

// Start the bot
async function startBot() {
  try {
    await deployCommands();
    await client.login(botConfig.token);
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Only start if this file is run directly
if (require.main === module) {
  startBot();
}

export { client, startBot };