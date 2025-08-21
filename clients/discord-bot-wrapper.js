"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KanbanBot = void 0;
const kanbot_client_1 = require("./kanbot-client");
class KanbanBot {
    constructor(configuration, discordClient) {
        this.kanbotClient = new kanbot_client_1.KanbotClient(configuration, discordClient);
    }
    setupBot() {
        this.kanbotClient.handleReady();
        this.kanbotClient.handleMessage();
    }
    login() {
        this.kanbotClient.handleLogin();
    }
}
exports.KanbanBot = KanbanBot;
