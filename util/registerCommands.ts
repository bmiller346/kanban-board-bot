// src/utils/registerCommands.ts
import { Client } from 'discord.js';
import fs from 'fs';
import path from 'path';

export const registerCommands = (client: Client, commandsPath: string) => {
  client.commands = new Map();
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')); // Adjusted for JS files

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    import(filePath).then(commandModule => {
      const command = commandModule.default; // Assuming export default is used
      client.commands.set(command.data.name, command);
    }).catch(err => console.error(err));
  }
};
