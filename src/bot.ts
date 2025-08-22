// Modern Discord Bot Entry Point
import { Client, GatewayIntentBits, REST } from 'discord.js';
import { config } from 'dotenv';
import { CommandHandler } from './handlers/command-handler';
import { EventHandler } from './handlers/event-handler';
import { useKanbanStore } from './store/kanban-store';
import { validateEnvironment } from './utils/env-validator';

// Load environment variables
config();

class KanbanBot {
  public client: Client;
  private commandHandler: CommandHandler;
  private eventHandler: EventHandler;
  private rest: REST;

  constructor() {
    // Validate environment
    const env = validateEnvironment();
    
    // Initialize Discord client with proper intents
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        // GuildMembers is only needed if we want to access member info beyond interactions
        // GatewayIntentBits.GuildMembers,
      ],
    });

    // Initialize REST API for slash commands
    this.rest = new REST({ version: '10' }).setToken(env.DISCORD_BOT_TOKEN);

    // Initialize handlers
    this.commandHandler = new CommandHandler(this.client, this.rest);
    this.eventHandler = new EventHandler(this.client, this.commandHandler);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Setup all event listeners through the EventHandler
    this.eventHandler.setupEventListeners();

    // Additional graceful shutdown handlers
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('uncaughtException', (error) => {
      console.error('🚨 Uncaught Exception:', error);
      this.shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit on unhandled rejections, just log them
    });
  }

  public async start(): Promise<void> {
    try {
      const env = validateEnvironment();
      console.log('� Starting Kanban Bot...');
      
      await this.client.login(env.DISCORD_BOT_TOKEN);
      
      console.log('✅ Kanban Bot started successfully!');
    } catch (error) {
      console.error('❌ Failed to start bot:', error);
      process.exit(1);
    }
  }

  private async shutdown(signal: string): Promise<void> {
    console.log(`🛑 Received ${signal}, shutting down gracefully...`);
    
    try {
      // Save any pending data from the store
      console.log('💾 Saving data...');
      const store = useKanbanStore.getState();
      // The persist middleware should handle saving automatically
      
      // Destroy client connection
      this.client.destroy();
      console.log('✅ Bot shutdown complete');
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  // Health check endpoint (useful for monitoring)
  public getHealthStatus() {
    return this.eventHandler.getHealthStatus();
  }
}

// Create and start the bot
const bot = new KanbanBot();

// Export for testing or external use
export { KanbanBot };
export default bot;

// Start the bot if this file is run directly
if (require.main === module) {
  bot.start().catch((error) => {
    console.error('❌ Fatal error starting bot:', error);
    process.exit(1);
  });
}