"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Guild = exports.Task = exports.TaskPriority = exports.TaskStatus = void 0;
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["Todo"] = "Todo";
    TaskStatus["InProgress"] = "In Progress";
    TaskStatus["Done"] = "Done";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["Low"] = "Low";
    TaskPriority["Medium"] = "Medium";
    TaskPriority["High"] = "High";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
class Task {
    name;
    status;
    priority;
    description;
    dueDate;
    constructor(name, status = TaskStatus.Todo, priority = TaskPriority.Low, description, dueDate) {
        this.name = name;
        this.status = status;
        this.priority = priority;
        this.description = description;
        this.dueDate = dueDate;
    }
}
exports.Task = Task;
// utils/database.ts
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
