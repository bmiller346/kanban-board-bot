import { Client } from 'discord.js';
import { KanbotConfiguration } from '../application/kanbot-configuration';
import { KanbotClient } from './kanbot-client';

interface DiscordBot {
    setupBot(): void;
    login(): Promise<void>;
}

export class KanbanBot implements DiscordBot {
    private kanbotClient: KanbotClient;

    constructor(configuration: KanbotConfiguration, discordClient: Client) {
        this.kanbotClient = new KanbotClient(configuration, discordClient);
    }

    setupBot(): void {
        this.kanbotClient.handleReady();
        this.kanbotClient.handleMessage();
    }

    async login(): Promise<void> {
        await this.kanbotClient.handleLogin();
    }
}