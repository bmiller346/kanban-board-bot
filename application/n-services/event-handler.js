"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEventHandlers = void 0;
const interactionHandler_1 = require("./interactionHandler");
const TaskService_1 = require("./TaskService");
const registerEventHandlers = (client) => {
    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
        TaskService_1.TaskService.initialize(client);
    });
    client.on('interactionCreate', interactionHandler_1.handleInteraction);
};
exports.registerEventHandlers = registerEventHandlers;
