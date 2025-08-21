
//bot-configurations.ts

export class BotConfiguration {
  constructor(
    readonly botName: string,
    readonly token: string,
  ) {}
}


typescript
import { MessageEmbed } from 'discord.js';

export class BotConfiguration {
  constructor(
    readonly botName: string,
    readonly token: string,
  ) {}

  sendEmbedMessage(title: string, description: string): void {
    const embed = new MessageEmbed()
      .setTitle(title)
      .setDescription(description);

    // Send the embed message
    // Replace this with your actual logic to send the embed message
    // For example, message.channel.send({ embeds: [embed] });
  }
}
