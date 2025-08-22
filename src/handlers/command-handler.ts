// Modern Command Handler with Zustand and Zod
import { 
  Client, 
  REST, 
  Routes, 
  ChatInputCommandInteraction, 
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonInteraction,
  SelectMenuInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';
import { useKanbanStore } from '../store/kanban-store';
import { validateTask, validateBoard, Task, Board, TaskStatus, TaskPriority } from '../schemas';
import { validateEnvironment } from '../utils/env-validator';

export class CommandHandler {
  private client: Client;
  private rest: REST;
  private commands: Map<string, any> = new Map();

  constructor(client: Client, rest: REST) {
    this.client = client;
    this.rest = rest;
    this.initializeCommands();
  }

  private initializeCommands(): void {
    // Create Board Command
    const createBoard = new SlashCommandBuilder()
      .setName('create-board')
      .setDescription('Create a new Kanban board')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the board')
          .setRequired(true)
          .setMaxLength(50)
      )
      .addStringOption(option =>
        option.setName('description')
          .setDescription('Description of the board')
          .setRequired(false)
          .setMaxLength(200)
      )
      .addBooleanOption(option =>
        option.setName('private')
          .setDescription('Make this board private (only you can see it)')
          .setRequired(false)
      );

    // List Boards Command
    const listBoards = new SlashCommandBuilder()
      .setName('boards')
      .setDescription('List all boards you have access to');

    // Create Task Command
    const createTask = new SlashCommandBuilder()
      .setName('create-task')
      .setDescription('Create a new task')
      .addStringOption(option =>
        option.setName('title')
          .setDescription('Title of the task')
          .setRequired(true)
          .setMaxLength(100)
      )
      .addStringOption(option =>
        option.setName('board')
          .setDescription('Board to add the task to')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('description')
          .setDescription('Description of the task')
          .setRequired(false)
          .setMaxLength(500)
      )
      .addStringOption(option =>
        option.setName('priority')
          .setDescription('Priority of the task')
          .addChoices(
            { name: '🔴 High', value: 'High' },
            { name: '🟡 Medium', value: 'Medium' },
            { name: '🟢 Low', value: 'Low' }
          )
          .setRequired(false)
      )
      .addUserOption(option =>
        option.setName('assignee')
          .setDescription('Assign the task to a user')
          .setRequired(false)
      );

    // View Board Command
    const viewBoard = new SlashCommandBuilder()
      .setName('board')
      .setDescription('View a specific board')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the board to view')
          .setRequired(true)
      );

    // Move Task Command
    const moveTask = new SlashCommandBuilder()
      .setName('move-task')
      .setDescription('Move a task to a different column')
      .addStringOption(option =>
        option.setName('task')
          .setDescription('Task to move (use task ID or title)')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('column')
          .setDescription('Column to move to')
          .addChoices(
            { name: '📋 To Do', value: 'todo' },
            { name: '⚡ In Progress', value: 'inprogress' },
            { name: '✅ Done', value: 'done' }
          )
          .setRequired(true)
      );

    // My Tasks Command
    const myTasks = new SlashCommandBuilder()
      .setName('my-tasks')
      .setDescription('View all tasks assigned to you');

    // Stats Command
    const stats = new SlashCommandBuilder()
      .setName('stats')
      .setDescription('View statistics about your boards and tasks');

    // Store commands
    this.commands.set('create-board', createBoard);
    this.commands.set('boards', listBoards);
    this.commands.set('create-task', createTask);
    this.commands.set('board', viewBoard);
    this.commands.set('move-task', moveTask);
    this.commands.set('my-tasks', myTasks);
    this.commands.set('stats', stats);
  }

  public async registerCommands(): Promise<void> {
    try {
      const env = validateEnvironment();
      const commandData = Array.from(this.commands.values()).map(cmd => cmd.toJSON());
      
      console.log('🔄 Registering slash commands...');
      
      await this.rest.put(
        Routes.applicationCommands(env.DISCORD_CLIENT_ID),
        { body: commandData }
      );
      
      console.log(`✅ Registered ${commandData.length} slash commands globally`);
    } catch (error) {
      console.error('❌ Failed to register commands:', error);
      throw error;
    }
  }

  public async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const { commandName } = interaction;
    const store = useKanbanStore.getState();

    // Add user to store if not exists
    const user = {
      id: interaction.user.id,
      username: interaction.user.username,
      discriminator: interaction.user.discriminator,
      avatar: interaction.user.avatar || undefined,
      role: 'Member' as const,
      permissions: { canCreateBoards: true, canEditTasks: true, canDeleteTasks: false, canManageUsers: false },
      preferences: { theme: 'auto' as const, notifications: true, timezone: 'UTC' },
    };
    store.addUser(user);

    switch (commandName) {
      case 'create-board':
        await this.handleCreateBoard(interaction);
        break;
      case 'boards':
        await this.handleListBoards(interaction);
        break;
      case 'create-task':
        await this.handleCreateTask(interaction);
        break;
      case 'board':
        await this.handleViewBoard(interaction);
        break;
      case 'move-task':
        await this.handleMoveTask(interaction);
        break;
      case 'my-tasks':
        await this.handleMyTasks(interaction);
        break;
      case 'stats':
        await this.handleStats(interaction);
        break;
      default:
        await interaction.reply({ 
          content: '❌ Unknown command!', 
          ephemeral: true 
        });
    }
  }

  private async handleCreateBoard(interaction: ChatInputCommandInteraction): Promise<void> {
    const name = interaction.options.getString('name', true);
    const description = interaction.options.getString('description') || undefined;
    const isPrivate = interaction.options.getBoolean('private') ?? false;

    const store = useKanbanStore.getState();
    
    // Check if board name already exists for this user
    const existingBoards = store.getBoardsByUser(interaction.user.id);
    const nameExists = existingBoards.some(board => 
      board.name.toLowerCase() === name.toLowerCase() && 
      board.guildId === interaction.guildId
    );

    if (nameExists) {
      await interaction.reply({
        content: `❌ A board named "${name}" already exists in this server!`,
        ephemeral: true
      });
      return;
    }

    const boardId = `board_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newBoard: Board = {
      id: boardId,
      name,
      description,
      guildId: interaction.guildId!,
      ownerId: interaction.user.id,
      memberIds: [],
      isPrivate,
      columns: [
        { id: 'todo', name: '📋 To Do', position: 0, boardId, taskIds: [] },
        { id: 'inprogress', name: '⚡ In Progress', position: 1, boardId, taskIds: [] },
        { id: 'done', name: '✅ Done', position: 2, boardId, taskIds: [] },
      ],
      settings: {
        autoArchiveDone: false,
        notificationsEnabled: true,
        allowComments: true,
        dueReminders: true,
      },
      createdAt: now,
      updatedAt: now,
    };

    const validation = validateBoard(newBoard);
    if (!validation.success) {
      await interaction.reply({
        content: '❌ Invalid board data. Please try again.',
        ephemeral: true
      });
      return;
    }

    store.addBoard(newBoard);

    const embed = new EmbedBuilder()
      .setTitle('🎉 Board Created!')
      .setDescription(`**${name}** has been created successfully!`)
      .addFields(
        { name: '👤 Owner', value: `<@${interaction.user.id}>`, inline: true },
        { name: '🔒 Privacy', value: isPrivate ? 'Private' : 'Public', inline: true },
        { name: '📊 Columns', value: '3 (To Do, In Progress, Done)', inline: true }
      )
      .setColor('#00ff00')
      .setTimestamp();

    if (description) {
      embed.addFields({ name: '📝 Description', value: description });
    }

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`view_board_${boardId}`)
          .setLabel('View Board')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('👁️')
      );

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  private async handleListBoards(interaction: ChatInputCommandInteraction): Promise<void> {
    const store = useKanbanStore.getState();
    const userBoards = store.getBoardsByUser(interaction.user.id)
      .filter(board => board.guildId === interaction.guildId);

    if (userBoards.length === 0) {
      await interaction.reply({
        content: '📋 You don\'t have any boards yet! Use `/create-board` to create your first one.',
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 Your Boards')
      .setDescription(`You have access to ${userBoards.length} board(s) in this server`)
      .setColor('#0099ff')
      .setTimestamp();

    userBoards.forEach(board => {
      const taskCount = store.getTasksByBoard(board.id).length;
      const privacy = board.isPrivate ? '🔒 Private' : '🌐 Public';
      const ownership = board.ownerId === interaction.user.id ? '👑 Owner' : '👤 Member';
      
      embed.addFields({
        name: `${board.name}`,
        value: `${board.description || 'No description'}\n${privacy} • ${ownership} • ${taskCount} tasks`,
        inline: true
      });
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async handleCreateTask(interaction: ChatInputCommandInteraction): Promise<void> {
    const title = interaction.options.getString('title', true);
    const boardName = interaction.options.getString('board', true);
    const description = interaction.options.getString('description') || undefined;
    const priority = (interaction.options.getString('priority') as TaskPriority) || 'Medium';
    const assignee = interaction.options.getUser('assignee');

    const store = useKanbanStore.getState();
    
    // Find the board
    const userBoards = store.getBoardsByUser(interaction.user.id)
      .filter(board => board.guildId === interaction.guildId);
    
    const board = userBoards.find(b => 
      b.name.toLowerCase() === boardName.toLowerCase()
    );

    if (!board) {
      await interaction.reply({
        content: `❌ Board "${boardName}" not found! Use \`/boards\` to see available boards.`,
        ephemeral: true
      });
      return;
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newTask: Task = {
      id: taskId,
      name: title,
      description,
      status: 'Todo',
      priority,
      boardId: board.id,
      columnId: 'todo',
      assigneeId: assignee?.id,
      tags: [],
      subtasks: [],
      createdAt: now,
      updatedAt: now,
    };

    const validation = validateTask(newTask);
    if (!validation.success) {
      await interaction.reply({
        content: '❌ Invalid task data. Please try again.',
        ephemeral: true
      });
      return;
    }

    store.addTask(newTask);

    const priorityEmoji = { High: '🔴', Medium: '🟡', Low: '🟢' }[priority];
    
    const embed = new EmbedBuilder()
      .setTitle('✅ Task Created!')
      .setDescription(`**${title}** has been added to **${board.name}**`)
      .addFields(
        { name: '📋 Board', value: board.name, inline: true },
        { name: '📊 Column', value: '📋 To Do', inline: true },
        { name: '⭐ Priority', value: `${priorityEmoji} ${priority}`, inline: true }
      )
      .setColor('#00ff00')
      .setTimestamp();

    if (description) {
      embed.addFields({ name: '📝 Description', value: description });
    }

    if (assignee) {
      embed.addFields({ name: '👤 Assignee', value: `<@${assignee.id}>`, inline: true });
    }

    await interaction.reply({ embeds: [embed] });
  }

  private async handleViewBoard(interaction: ChatInputCommandInteraction): Promise<void> {
    // Implementation for viewing board details
    await interaction.reply({ content: 'Board view functionality coming soon!', ephemeral: true });
  }

  private async handleMoveTask(interaction: ChatInputCommandInteraction): Promise<void> {
    // Implementation for moving tasks
    await interaction.reply({ content: 'Move task functionality coming soon!', ephemeral: true });
  }

  private async handleMyTasks(interaction: ChatInputCommandInteraction): Promise<void> {
    const store = useKanbanStore.getState();
    const myTasks = store.getTasksByUser(interaction.user.id);

    if (myTasks.length === 0) {
      await interaction.reply({
        content: '📋 You don\'t have any assigned tasks!',
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 My Tasks')
      .setDescription(`You have ${myTasks.length} assigned task(s)`)
      .setColor('#0099ff')
      .setTimestamp();

    myTasks.slice(0, 10).forEach(task => {
      const board = store.boards.get(task.boardId);
      const priorityEmoji = { High: '🔴', Medium: '🟡', Low: '🟢' }[task.priority];
      const statusEmoji = { Todo: '📋', InProgress: '⚡', Done: '✅' }[task.status];
      
      embed.addFields({
        name: `${statusEmoji} ${task.name}`,
        value: `${priorityEmoji} ${task.priority} • Board: ${board?.name || 'Unknown'}`,
        inline: false
      });
    });

    if (myTasks.length > 10) {
      embed.setFooter({ text: `Showing first 10 of ${myTasks.length} tasks` });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async handleStats(interaction: ChatInputCommandInteraction): Promise<void> {
    const store = useKanbanStore.getState();
    const stats = store.getStats();
    const userBoards = store.getBoardsByUser(interaction.user.id);
    const userTasks = store.getTasksByUser(interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle('📊 Your Kanban Statistics')
      .addFields(
        { name: '📋 Your Boards', value: userBoards.length.toString(), inline: true },
        { name: '📝 Your Tasks', value: userTasks.length.toString(), inline: true },
        { name: '🏆 Total Boards', value: stats.totalBoards.toString(), inline: true },
        { name: '📊 Total Tasks', value: stats.totalTasks.toString(), inline: true },
        { name: '👥 Total Users', value: stats.totalUsers.toString(), inline: true },
        { name: '🔄 Bot Uptime', value: `${Math.floor(process.uptime() / 3600)}h`, inline: true }
      )
      .setColor('#ff6b6b')
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  public async handleComponent(interaction: ButtonInteraction | SelectMenuInteraction): Promise<void> {
    if (interaction.isButton()) {
      const [action, ...params] = interaction.customId.split('_');
      
      switch (action) {
        case 'view':
          if (params[0] === 'board') {
            await this.handleViewBoardButton(interaction, params[1]);
          }
          break;
        default:
          await interaction.reply({ content: 'Unknown action!', ephemeral: true });
      }
    }
  }

  private async handleViewBoardButton(interaction: ButtonInteraction, boardId: string): Promise<void> {
    const store = useKanbanStore.getState();
    const board = store.boards.get(boardId);

    if (!board) {
      await interaction.reply({ content: '❌ Board not found!', ephemeral: true });
      return;
    }

    // Check permissions
    if (board.isPrivate && board.ownerId !== interaction.user.id && !board.memberIds.includes(interaction.user.id)) {
      await interaction.reply({ content: '❌ You don\'t have access to this board!', ephemeral: true });
      return;
    }

    const tasks = store.getTasksByBoard(boardId);
    const todoTasks = store.getTasksByColumn(boardId, 'todo');
    const inProgressTasks = store.getTasksByColumn(boardId, 'inprogress');
    const doneTasks = store.getTasksByColumn(boardId, 'done');

    const embed = new EmbedBuilder()
      .setTitle(`📋 ${board.name}`)
      .setDescription(board.description || 'No description')
      .addFields(
        { name: '📋 To Do', value: `${todoTasks.length} tasks`, inline: true },
        { name: '⚡ In Progress', value: `${inProgressTasks.length} tasks`, inline: true },
        { name: '✅ Done', value: `${doneTasks.length} tasks`, inline: true }
      )
      .setColor('#0099ff')
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}