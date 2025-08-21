# Kanbot

:clipboard: A lightweight Kanban board bot, for your Discord! <br /><br />

![logo](https://media.discordapp.net/attachments/449647907772170253/449770623187812362/kanbotcircle.png)

## Getting started

This is a bot for your Discord, so if you dont already have a Discord
register and download [here](https://discordapp.com/) <br />

If you are not familiar with a kanban board [here](https://leankit.com/learn/kanban/kanban-board/) is a great description by _leankit_

### This repository

clone this repository

```
$ https://github.com/bmiller346/kanban-board-bot.git
```

install the necessary node modules

```
$ npm install
```

create a bot through the discord developer portal and add your token in a file labeled `botconfig.json`

start the server!

```
$ npm run watch
```

## Documentation

Type the commands following `$kanbot` into your Discord chat box to launch the app.

| Command            |                        Usage                        |
| ------------------ | :-------------------------------------------------: |
| `$kanbot`          |            displays current kanban board            |
|                    |                                                     |
| `-help`            |             displays possible commands              |
| `-add <"item">`    |             adds "item" into 'backlog'              |
| `-remove <"id">`   |        remove item with "id" from 'backlog'         |
| `-start <"id">`    | move item with "id" from 'backlog' to 'in-progress' |
| `-complete <"id">` | move item with "id" from 'in-progress' to 'backlog' |
| `-clear`           |     clears the current board _use with caution_     |

## Examples

`$kanbot` to display the board <br /><br />
![board](https://i.imgur.com/KkAgFms.png)<br /><br />

`$kanbot -add "Enjoy cookies"` to add to the backlog <br /><br />
![add-to-board](https://i.imgur.com/D7VfZDI.png)<br />

Made with :heart:

eDue to Markdown's limited interactivity, I will provide a guide on how to proceed with the requested tasks.

1. **Migrate from TSLint to ESLint**:

   - Follow the official documentation of typescript-eslint project for guidance on migrating from TSLint to ESLint. You will need to install ESLint and relevant plugins for TypeScript.

2. **Resolve npm and TypeScript Configuration Issues**:

   - Address any conflicting versions by updating dependencies and ensuring compatibility. Delete `node_modules` and `package-lock.json`, then run `npm install` again.
   - If encountering ENOENT Error with Git, ensure Git is installed and added to the PATH environment variable.

3. **Review and Update tsconfig.json**:

   - Modify `target` and `module` in `tsconfig.json` as needed based on your project requirements and environment.

4. **Use .env for Sensitive Configuration**:

   - Utilize environment variables (e.g., via `.env` files) for storing sensitive information instead of hardcoding in `botconfig.json`.

5. **Structure and Documentation**:

   - Maintain clear project structure and documentation with detailed README.md, CONTRIBUTING.md, and other supporting files for ease of understanding and collaboration.

6. **Automate and Scripts**:

   - Implement npm scripts in `package.json` to automate common tasks like linting, building, and starting the project for increased efficiency and consistency.

7. **Regular Maintenance**:
   - Stay updated on the latest stable versions of dependencies and TypeScript features to ensure the project remains secure and up-to-date.

Make sure to execute these steps with care and attention to detail to successfully enhance your project configuration and maintain its quality. If you encounter any specific issues during the process, feel free to seek additional guidance.
