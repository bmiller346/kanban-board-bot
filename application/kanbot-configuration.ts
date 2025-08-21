//kanbot-configuration.ts

import { BotConfiguration } from './bot-configuration';
import { MessageEmbed } from 'discord.js';

export class KanbotConfiguration extends BotConfiguration {
  private commandPrefix: string;
  private commandName: string;

  constructor(botName: string = 'Kanbot', token: string, commandPrefix: string = '$', commandName: string = 'kanbot') {
    super(botName, token);
    this.commandPrefix = commandPrefix;
    this.commandName = commandName;
  }

  public get signal(): string {
    return `${this.commandPrefix}${this.commandName}`;
  }

  public createEmbed(title: string, description: string): MessageEmbed {
    const embed = new MessageEmbed()
      .setTitle(title)
      .setDescription(description);

    return embed;
  }
}