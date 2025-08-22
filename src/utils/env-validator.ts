// Environment validation using Zod
import { z } from 'zod';

const EnvironmentSchema = z.object({
  // Discord Configuration
  DISCORD_BOT_TOKEN: z.string().min(1, 'Discord token is required'),
  DISCORD_CLIENT_ID: z.string().min(1, 'Discord client ID is required'),
  
  // Optional Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default(() => 3000),
  
  // Database Configuration (optional for now)
  DATABASE_URL: z.string().optional(),
  MONGODB_URI: z.string().optional(),
  
  // OAuth Configuration (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Logging and Monitoring
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Feature Flags
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default(() => false),
  ENABLE_NOTIFICATIONS: z.string().transform(val => val === 'true').default(() => true),
  ENABLE_WEB_UI: z.string().transform(val => val === 'true').default(() => false),
});

export type Environment = z.infer<typeof EnvironmentSchema>;

let cachedEnv: Environment | null = null;

export function validateEnvironment(): Environment {
  if (cachedEnv) return cachedEnv;
  
  try {
    cachedEnv = EnvironmentSchema.parse(process.env);
    
    // Log configuration (without secrets)
    console.log('🔧 Environment validated successfully');
    console.log(`📱 Node Environment: ${cachedEnv.NODE_ENV}`);
    console.log(`🔌 Port: ${cachedEnv.PORT}`);
    console.log(`📊 Analytics: ${cachedEnv.ENABLE_ANALYTICS ? 'Enabled' : 'Disabled'}`);
    console.log(`🔔 Notifications: ${cachedEnv.ENABLE_NOTIFICATIONS ? 'Enabled' : 'Disabled'}`);
    console.log(`🌐 Web UI: ${cachedEnv.ENABLE_WEB_UI ? 'Enabled' : 'Disabled'}`);
    
    return cachedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.issues.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      
      console.error('\n📝 Required environment variables:');
      console.error('  - DISCORD_TOKEN: Your Discord bot token');
      console.error('  - DISCORD_CLIENT_ID: Your Discord application client ID');
      console.error('\n💡 Create a .env file in the project root with these variables.');
    } else {
      console.error('❌ Unexpected error validating environment:', error);
    }
    
    process.exit(1);
  }
}

// Helper to check if we're in development
export const isDevelopment = () => validateEnvironment().NODE_ENV === 'development';
export const isProduction = () => validateEnvironment().NODE_ENV === 'production';
export const isTest = () => validateEnvironment().NODE_ENV === 'test';