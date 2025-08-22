"use strict";
// utils/database.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.Guild = void 0;
const sequelize_1 = require("sequelize");
// Use SQLite for free user workflow
const sequelize = new sequelize_1.Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: false,
});
exports.default = sequelize;
// models/guild.ts
const sequelize_2 = require("sequelize");
exports.Guild = sequelize.define('guild', {
    id: {
        type: sequelize_2.DataTypes.STRING,
        primaryKey: true,
    },
    welcomeChannelID: {
        type: sequelize_2.DataTypes.STRING,
        allowNull: true,
    },
    welcomeRoleID: {
        type: sequelize_2.DataTypes.STRING,
        allowNull: true,
    },
    // Additional attributes as needed
});
// Sync Guild model with the database
exports.Guild.sync();
