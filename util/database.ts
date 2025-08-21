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