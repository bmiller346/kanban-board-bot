// src/services/event-handler.ts
import { Client } from 'discord.js';
import { handleInteraction } from './interactionhandler';
import { TaskService } from './TaskService';

export const registerEventHandlers = (client: Client) => {
  client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    TaskService.initialize(client);
  });

  client.on('interactionCreate', handleInteraction);
};