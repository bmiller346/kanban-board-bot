// src/commands/CommandTypes.ts
import { SlashCommandBuilder } from '@discordjs/builders';

export enum KanbotCommands {
  ADD = 'add',
  CLEAR = 'clear',
  COMPLETE = 'complete',
  REMOVE = 'remove',
  START = 'start',
  HELP = 'help'
}

export const createTaskCommandData = new SlashCommandBuilder()
  .setName('create-task')
  .setDescription('Creates a new task.')
  .addStringOption(option => 
    option.setName('title')
      .setDescription('Title of the task')
      .setRequired(true))
  .addStringOption(option => 
    option.setName('description')
      .setDescription('Description of the task')
      .setRequired(false))
  .addStringOption(option => 
    option.setName('due_date')
      .setDescription('Due date of the task')
      .setRequired(false))
  .addStringOption(option => 
    option.setName('status')
      .setDescription('Status of the task')
      .setRequired(true))
  .addStringOption(option => 
    option.setName('priority')
      .setDescription('Priority of the task')
      .setRequired(false));

// Function to get Kanbot Command
export function getKanbotCommand(input: string): KanbotCommands {
  switch (input.toLowerCase()) {
    case 'add':
      return KanbotCommands.ADD;
    case 'clear':
      return KanbotCommands.CLEAR;
    case 'complete':
      return KanbotCommands.COMPLETE;
    case 'remove':
      return KanbotCommands.REMOVE;
    case 'start':
      return KanbotCommands.START;
    case 'help':
    default:
      return KanbotCommands.HELP;
  }
}