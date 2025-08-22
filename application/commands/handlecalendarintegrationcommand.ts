// src/commands/handleCalendarIntegrationCommand.ts
import { CommandInteraction } from 'discord.js';
import { GoogleCalendarService } from '../n-services/googlecalendarservice';

const handleCalendarIntegrationCommand = async (interaction: CommandInteraction) => {
  try {
    // For now, only Google Calendar is supported
    await integrateWithGoogleCalendar(interaction);
  } catch (error) {
    console.error('Error in handleCalendarIntegrationCommand:', error);
    await interaction.reply({ content: 'Failed to integrate with the calendar. Please try again.', ephemeral: true });
  }
};

const integrateWithGoogleCalendar = async (interaction: CommandInteraction) => {
  const googleCalendarService = new GoogleCalendarService();
  const isConfigured = await googleCalendarService.isConfigured();
  
  if (!isConfigured) {
    await interaction.reply({ content: 'Google Calendar integration is not configured yet.', ephemeral: true });
    return;
  }

  await interaction.reply({ content: 'Google Calendar integration successful!', ephemeral: true });
};

export { handleCalendarIntegrationCommand };
