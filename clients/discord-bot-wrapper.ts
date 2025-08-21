
//discord-bot-wrapper.ts 
import { Client, Intents, MessageEmbed, TextChannel, WebhookClient, ButtonInteraction, SelectMenuInteraction } from 'discord.js';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.once('ready', () => {
  console.log('Ready!');
});

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!createTask')) {
    const taskDetails = message.content.slice('!createTask'.length).trim().split('|');
    const taskEmbed = new MessageEmbed()
      .setTitle(taskDetails[0])
      .setDescription(taskDetails[1])
      .addField('Due Date', taskDetails[2])
      .addField('Status', taskDetails[3])
      .setColor(getColor(taskDetails[3]));

    const taskChannel = message.guild?.channels.cache.find((channel) => channel.name === 'tasks') as TextChannel;
    const sentMessage = await taskChannel.send({ embeds: [taskEmbed] });

    const webhook = new WebhookClient({ url: 'your-webhook-url' });
    await webhook.send({
      content: `New task created by ${message.author.username}`,
      embeds: [taskEmbed],
    });

    await sentMessage.react('✅');
    await sentMessage.react('❌');
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const { message } = interaction;
  if (!message) return;

  if (interaction.customId === 'taskComplete') {
    message.delete();

    const updatedEmbed = (message.embeds[0] as MessageEmbed).setColor('GREEN').setFooter('Completed');
    await message.edit({ embeds: [updatedEmbed] });
  }
});

function getColor(status: string): string {
  // Implement logic to determine color based on task status
  return status === 'Completed' ? 'GREEN' : status === 'In Progress' ? 'YELLOW' : 'RED';
}

client.login('your-bot-token');
