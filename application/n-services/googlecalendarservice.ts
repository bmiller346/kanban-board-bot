
// src/services/GoogleCalendarService.ts
export class GoogleCalendarService {
  // ... (implementation of Google Calendar integration logic) ...
}
import { google } from 'googleapis';

// Initialize the Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  YOUR_CLIENT_ID,
  YOUR_CLIENT_SECRET,
  YOUR_REDIRECT_URL
);

// Set credentials
oauth2Client.setCredentials({
  access_token: YOUR_ACCESS_TOKEN,
  // Optionally, refresh_token, expiry_date
});

// Initialize Google Calendar API client
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Example: List the next 10 events on the user's primary calendar
calendar.events.list({
  calendarId: 'primary',
  timeMin: (new Date()).toISOString(),
  maxResults: 10,
  singleEvents: true,
  orderBy: 'startTime',
}, (err, res) => {
  if (err) return console.error('The API returned an error: ' + err);
  const events = res.data.items;
  if (events.length) {
    console.log('Upcoming 10 events:');
    events.map((event, i) => {
      const start = event.start.dateTime || event.start.date;
      console.log(`${start} - ${event.summary}`);
    });
  } else {
    console.log('No upcoming events found.');
  }
});
import { Client } from '@microsoft/microsoft-graph-client';


// Initialize Microsoft Graph client
const client = Client.init({
  authProvider: (done) => {
    done(null, accessToken); // First parameter takes an error if you can't get an access token
  },
});

// Example: Get events from the user's calendar
client
  .api('/me/events')
  .select('subject,organizer,start,end')
  .orderby('createdDateTime DESC')
  .get()
  .then((res) => {
    console.log(res.value);
  })
  .catch((error) => {
    console.error(error);
  });
