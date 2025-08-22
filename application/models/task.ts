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
  public readonly id: string;

  constructor(
    public name: string,
    public status: TaskStatus = TaskStatus.Todo,
    public priority: TaskPriority = TaskPriority.Low,
    public description?: string,
    public dueDate?: Date,
  ) {
    this.id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
  }
}


// utils/database.ts

import { Sequelize } from 'sequelize';

// Use SQLite for free user workflow
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false,
});

export default sequelize;

// models/guild.ts

import { DataTypes } from 'sequelize';
import sequelize from '../utils/database';

export const Guild = sequelize.define('guild', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  welcomeChannelID: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  welcomeRoleID: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Additional attributes as needed
});

// Sync Guild model with the database
Guild.sync();

