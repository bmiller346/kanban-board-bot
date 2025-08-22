// Modern Event Handler with Zustand and Discord.js v14
import { 
  Client, 
  Events, 
  GuildMember,
  Interaction,
  ActivityType,
  PresenceUpdateStatus
} from 'discord.js';
import { CommandHandler } from './command-handler';
import { useKanbanStore } from '../store/kanban-store';
import { validateEnvironment } from '../utils/env-validator';

export class EventHandler {
  private client: Client;
  private commandHandler: CommandHandler;
  private startTime: Date = new Date();

  constructor(client: Client, commandHandler: CommandHandler) {
    this.client = client;
    this.commandHandler = commandHandler;
  }

  public setupEventListeners(): void {
    // Bot ready event
    this.client.once(Events.ClientReady, (client) => {
      this.onReady(client);
    });

    // Interaction events
    this.client.on(Events.InteractionCreate, (interaction) => {
      this.onInteractionCreate(interaction);
    });

    // Guild events
    this.client.on(Events.GuildCreate, (guild) => {
      this.onGuildJoin(guild);
    });

    this.client.on(Events.GuildDelete, (guild) => {
      this.onGuildLeave(guild);
    });

    // Member events
    this.client.on(Events.GuildMemberAdd, (member) => {
      this.onMemberJoin(member);
    });

    this.client.on(Events.GuildMemberRemove, (member) => {
      this.onMemberLeave(member);
    });

    // Error handling
    this.client.on(Events.Error, (error) => {
      this.onError(error);
    });

    this.client.on(Events.Warn, (warning) => {
      this.onWarning(warning);
    });

    // Rate limit handling
    this.client.rest.on('rateLimited', (rateLimitInfo) => {
      this.onRateLimit(rateLimitInfo);
    });
  }

  private async onReady(client: Client): Promise<void> {
    console.log(`🤖 Bot is ready! Logged in as ${client.user?.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} server(s)`);
    console.log(`👥 Watching ${client.users.cache.size} user(s)`);
    
    // Set bot status
    await this.updateBotPresence();
    
    // Register slash commands
    try {
      await this.commandHandler.registerCommands();
      console.log('✅ Slash commands registered successfully');
    } catch (error) {
      console.error('❌ Failed to register slash commands:', error);
    }

    // Initialize store data if needed
    this.initializeStoreData();
    
    // Start periodic tasks
    this.startPeriodicTasks();
  }

  private async onInteractionCreate(interaction: Interaction): Promise<void> {
    try {
      if (interaction.isChatInputCommand()) {
        await this.commandHandler.handleCommand(interaction);
      } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
        await this.commandHandler.handleComponent(interaction);
      } else if (interaction.isAutocomplete()) {
        await this.handleAutocomplete(interaction);
      }
    } catch (error) {
      console.error('❌ Error handling interaction:', error);
      
      // Try to respond with error message
      try {
        const errorMessage = 'An error occurred while processing your request. Please try again later.';
        
        if (interaction.isRepliable()) {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `❌ ${errorMessage}`, ephemeral: true });
          } else {
            await interaction.reply({ content: `❌ ${errorMessage}`, ephemeral: true });
          }
        }
      } catch (replyError) {
        console.error('❌ Failed to send error message to user:', replyError);
      }
    }
  }

  private onGuildJoin(guild: any): void {
    console.log(`🎉 Joined new server: ${guild.name} (${guild.id})`);
    console.log(`👥 Server has ${guild.memberCount} members`);
    
    // Update bot presence
    this.updateBotPresence();
  }

  private onGuildLeave(guild: any): void {
    console.log(`👋 Left server: ${guild.name} (${guild.id})`);
    
    // Clean up guild-specific data
    this.cleanupGuildData(guild.id);
    
    // Update bot presence
    this.updateBotPresence();
  }

  private onMemberJoin(member: GuildMember): void {
    console.log(`👤 ${member.user.tag} joined ${member.guild.name}`);
    
    // Add user to store if they interact with the bot
    const store = useKanbanStore.getState();
    const user = {
      id: member.id,
      username: member.user.username,
      discriminator: member.user.discriminator,
      avatar: member.user.avatar || undefined,
      role: 'Member' as const,
      permissions: { 
        canCreateBoards: true, 
        canEditTasks: true, 
        canDeleteTasks: false, 
        canManageUsers: false 
      },
      preferences: { 
        theme: 'auto' as const, 
        notifications: true, 
        timezone: 'UTC' 
      },
    };
    
    if (!store.users.has(member.id)) {
      store.addUser(user);
    }
  }

  private onMemberLeave(member: GuildMember | any): void {
    console.log(`👤 ${member.user?.tag || 'Unknown User'} left ${member.guild?.name || 'Unknown Server'}`);
    
    // Note: We don't remove users from the store as they might have tasks/boards
    // Instead, we could mark them as inactive or handle cleanup differently
  }

  private onError(error: Error): void {
    console.error('🚨 Discord Client Error:', error);
    
    // Log critical errors
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNRESET')) {
      console.error('🌐 Network connectivity issue detected');
    } else if (error.message.includes('TOKEN')) {
      console.error('🔑 Bot token issue detected');
      process.exit(1); // Exit if token is invalid
    }
  }

  private onWarning(warning: string): void {
    console.warn('⚠️ Discord Client Warning:', warning);
  }

  private onRateLimit(rateLimitInfo: any): void {
    console.warn(`⏱️ Rate limited! Route: ${rateLimitInfo.route}, Timeout: ${rateLimitInfo.timeout}ms`);
  }

  private async updateBotPresence(): Promise<void> {
    try {
      const store = useKanbanStore.getState();
      const stats = store.getStats();
      const serverCount = this.client.guilds.cache.size;
      
      await this.client.user?.setPresence({
        activities: [{
          name: `${stats.totalBoards} boards • ${serverCount} servers`,
          type: ActivityType.Watching
        }],
        status: PresenceUpdateStatus.Online
      });
    } catch (error) {
      console.error('❌ Failed to update bot presence:', error);
    }
  }

  private initializeStoreData(): void {
    const store = useKanbanStore.getState();
    
    // Initialize any default data if needed
    console.log(`📊 Store initialized with ${store.boards.size} boards and ${store.tasks.size} tasks`);
  }

  private startPeriodicTasks(): void {
    // Update bot presence every 5 minutes
    setInterval(() => {
      this.updateBotPresence();
    }, 5 * 60 * 1000);

    // Clean up old data every hour
    setInterval(() => {
      this.performMaintenanceTasks();
    }, 60 * 60 * 1000);

    // Log statistics every 30 minutes
    setInterval(() => {
      this.logStatistics();
    }, 30 * 60 * 1000);
  }

  private async handleAutocomplete(interaction: any): Promise<void> {
    try {
      const { commandName, options } = interaction;
      const focusedOption = options.getFocused(true);
      
      let choices: Array<{ name: string; value: string }> = [];
      
      if (commandName === 'create-task' && focusedOption.name === 'board') {
        // Autocomplete board names for create-task command
        const store = useKanbanStore.getState();
        const userBoards = store.getBoardsByUser(interaction.user.id)
          .filter(board => board.guildId === interaction.guildId);
        
        choices = userBoards
          .filter(board => board.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
          .slice(0, 25) // Discord limit
          .map(board => ({
            name: board.name,
            value: board.name
          }));
      } else if (commandName === 'board' && focusedOption.name === 'name') {
        // Autocomplete board names for board command
        const store = useKanbanStore.getState();
        const userBoards = store.getBoardsByUser(interaction.user.id)
          .filter(board => board.guildId === interaction.guildId);
        
        choices = userBoards
          .filter(board => board.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
          .slice(0, 25)
          .map(board => ({
            name: board.name,
            value: board.name
          }));
      } else if (commandName === 'move-task' && focusedOption.name === 'task') {
        // Autocomplete task names/IDs for move-task command
        const store = useKanbanStore.getState();
        const userTasks = store.getTasksByUser(interaction.user.id);
        
        choices = userTasks
          .filter(task => 
            task.name.toLowerCase().includes(focusedOption.value.toLowerCase()) ||
            task.id.includes(focusedOption.value)
          )
          .slice(0, 25)
          .map(task => ({
            name: `${task.name} (ID: ${task.id.slice(-8)})`,
            value: task.id
          }));
      }
      
      await interaction.respond(choices);
    } catch (error) {
      console.error('❌ Error handling autocomplete:', error);
      try {
        await interaction.respond([]);
      } catch (respondError) {
        console.error('❌ Failed to respond to autocomplete:', respondError);
      }
    }
  }

  private cleanupGuildData(guildId: string): void {
    const store = useKanbanStore.getState();
    
    // Remove boards belonging to this guild
    const guildBoards = Array.from(store.boards.values())
      .filter(board => board.guildId === guildId);
    
    for (const board of guildBoards) {
      // Remove all tasks from this board first
      const boardTasks = store.getTasksByBoard(board.id);
      for (const task of boardTasks) {
        store.deleteTask(task.id);
      }
      
      // Remove the board
      store.deleteBoard(board.id);
    }
    
    console.log(`🧹 Cleaned up ${guildBoards.length} boards and their tasks for guild ${guildId}`);
  }

  private performMaintenanceTasks(): void {
    const store = useKanbanStore.getState();
    const stats = store.getStats();
    
    console.log(`🧹 Performing maintenance tasks...`);
    console.log(`📊 Current stats: ${stats.totalBoards} boards, ${stats.totalTasks} tasks, ${stats.totalUsers} users`);
    
    // Add any cleanup logic here
    // For example: archive old completed tasks, clean up empty boards, etc.
  }

  private logStatistics(): void {
    const store = useKanbanStore.getState();
    const stats = store.getStats();
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    const serverCount = this.client.guilds.cache.size;
    const userCount = this.client.users.cache.size;
    
    console.log('📊 Kanban Bot Statistics:');
    console.log(`   Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`);
    console.log(`   Servers: ${serverCount}`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Boards: ${stats.totalBoards}`);
    console.log(`   Tasks: ${stats.totalTasks}`);
    console.log(`   Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  }

  public getHealthStatus(): { status: string; uptime: number; stats: any } {
    const store = useKanbanStore.getState();
    const stats = store.getStats();
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    
    return {
      status: this.client.isReady() ? 'healthy' : 'unhealthy',
      uptime,
      stats: {
        ...stats,
        servers: this.client.guilds.cache.size,
        users: this.client.users.cache.size,
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      }
    };
  }
}