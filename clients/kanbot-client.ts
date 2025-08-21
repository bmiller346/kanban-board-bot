kanbot-client.ts
import { Client, GatewayIntentBits, EmbedBuilder, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

const webhookChannelId = 'your_channel_id'; // Specify the channel ID for webhook updates

client.once('ready', () => {
  console.log('Kanbot is online!');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!createTask') {
    const embed = new EmbedBuilder()
      .setTitle('New Task')
      .setDescription('Task description here')
      .addFields(
        { name: 'Due Date', value: 'YYYY-MM-DD' },
        { name: 'Status', value: 'Pending' }
      )
      .setColor('#FFFFFF'); // Customize color based on task priority or status

    const button = new ButtonBuilder()
      .setCustomId('completeTask')
      .setLabel('Complete Task')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    const channel = message.channel as TextChannel;
    await channel.send({ embeds: [embed], components: [row] });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const message = interaction.message;
  const embed = new EmbedBuilder(message.embeds[0].data);

  if (interaction.customId === 'completeTask') {
    // Find the Status field and update it
    const statusField = embed.data.fields?.find(f => f.name === 'Status');
    if (statusField) {
      statusField.value = 'Complete';
    }
    embed.setColor('#00FF00'); // Change color for completed task

    await interaction.update({ embeds: [embed] });
  }
});

client.login('your_token'); // Replace with your bot token
