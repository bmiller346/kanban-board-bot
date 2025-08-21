// src/interfaces/ICommandTypes.ts

// Enum for Kanbot Commands
export enum KanbotCommands {
  ADD = 'add',
  CLEAR = 'clear',
  COMPLETE = 'complete',
  REMOVE = 'remove',
  START = 'start',
  HELP = 'help'
}

// Interface for Kanbot Request
export interface IKanbotRequest {
  command: KanbotCommands;
  taskName: string;
  description?: string;
  dueDate?: string;
  status?: string;
  priorityColor?: string;
}
