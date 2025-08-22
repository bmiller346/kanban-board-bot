
//bot-configurations.ts

import { EmbedBuilder } from 'discord.js';

export class BotConfiguration {
  constructor(
    readonly botName: string,
    readonly token: string,
  ) {}

  sendEmbedMessage(title: string, description: string): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description);

    return embed;
  }
}

