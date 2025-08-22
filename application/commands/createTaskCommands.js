"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskCommand = void 0;
// src/commands/createTaskCommand.ts
const builders_1 = require("@discordjs/builders");
exports.createTaskCommand = {
    data: new builders_1.SlashCommandBuilder()
        .setName('create-task')
        .setDescription('Creates a new task.')
        // Add options here
        .toJSON(),
    async execute(interaction) {
        // Implementation as shown previously
    },
};
exports.default = exports.createTaskCommand; // Ensure default export if using dynamic imports
