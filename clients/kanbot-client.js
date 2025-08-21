"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KanbotClient = void 0;
const discord_js_1 = __importDefault(require("discord.js"));
const kanbot_commands_1 = require("../application/constants/kanbot-commands");
const kanban_board_1 = require("../application/kanban-board");
const task_1 = require("../application/models/task");
const help = __importStar(require("../util/commands.json"));
class KanbotClient {
    constructor(kanbotConfiguration, discordClient, board = new kanban_board_1.KanbanBoard()) {
        this.discordClient = discordClient;
        this.board = board;
        this.signal = kanbotConfiguration.signal;
        this.botName = kanbotConfiguration.botName;
        this.token = kanbotConfiguration.token;
    }
    /**
     * handleLogin
     */
    handleLogin() {
        this.discordClient.login(this.token).then((value) => console.log(value));
    }
    /**
     * handleReady
     */
    handleReady() {
        this.discordClient.on('ready', () => console.log(`${this.botName} is online!`));
    }
    handleMessage() {
        this.discordClient.on('message', (message) => this.handleRequest(message));
    }
    /**
     * handleRequest
     * @param message DiscordMessage
     */
    handleRequest(message) {
        const channel = message.channel;
        const caller = message.author.username;
        if (message.author.bot)
            return;
        if (channel.type === 'dm')
            return;
        // Parse command, and check.
        const inputs = message.content.split(' -');
        if (inputs[0] !== this.signal)
            return;
        // display board
        if (inputs.length === 1) {
            this.displayBoard(message, caller);
            return;
        }
        console.warn(inputs[1]);
        const request = kanbot_commands_1.KanbotRequest.parseString(inputs[1]);
        switch (request.command) {
            case kanbot_commands_1.KanbotCommands.ADD:
                this.addToBacklog(message, request.taskName);
                break;
            case kanbot_commands_1.KanbotCommands.HELP:
                message.channel.send(this.helpList(message));
                break;
            case kanbot_commands_1.KanbotCommands.REMOVE:
                this.removeItem(message, request.taskName);
                break;
            case kanbot_commands_1.KanbotCommands.START:
                this.startItem(message, request.taskName);
                break;
            case kanbot_commands_1.KanbotCommands.COMPLETE:
                this.completeItem(message, request.taskName);
                break;
            case kanbot_commands_1.KanbotCommands.CLEAR:
                this.board.clearBoard();
                channel.send({
                    embed: {
                        color: 3447003,
                        description: `Board cleared by: ${message.author.username}`,
                    },
                });
                break;
            default:
                channel.send({
                    embed: {
                        color: 3447003,
                        description: `Invalid request: ${request.command} ${request.taskName}`,
                    },
                });
                break;
        }
    }
    displayBoard(message, caller) {
        message.channel.send(new discord_js_1.default.RichEmbed({
            color: 3447003,
            description: `${this.botName}!`,
        })
            .addField('Project Backlog ', `\`\`\`${this.displayColumn(this.board.backlog.getTasks())}\`\`\``)
            .addField('In Progress ', `\`\`\`${this.displayColumn(this.board.inProgress.getTasks())}\`\`\``)
            .addField('Completed Tasks', `\`\`\`${this.displayColumn(this.board.complete.getTasks())}\`\`\``)
            .addField("I've been called by ", caller));
    }
    displayColumn(from) {
        return from.map((task) => task.toString()).join('\n');
    }
    addToBacklog(message, taskName) {
        const author = message.author.username;
        if (this.board.containsTask(taskName)) {
            message.channel.send({
                embed: {
                    color: 3447003,
                    description: `Not adding task ${taskName} because it already exists in the kanban board.`,
                },
            });
            return;
        }
        message.channel.send({
            embed: {
                color: 3447003,
                description: `${taskName} has been added to the Backlog by ${author}`,
            },
        });
        this.board.addToBacklog(new task_1.Task(taskName, author));
    }
    helpList(message) {
        const Help = new discord_js_1.default.RichEmbed()
            .setColor('#0074E7')
            .setTitle('List of Board Commands')
            .addField(`${help.view.command}`, `${help.view.desc}`)
            .addField(`${help.add.command}`, `${help.add.desc}`)
            .addField(`${help.remove.command}`, `${help.remove.desc}`)
            .addField(`${help.clearTask.command}`, `${help.clearTask.desc}`)
            .addField(`${help.startTask.command}`, `${help.startTask.desc}`)
            .addField(`${help.completeTask.command}`, `${help.completeTask.desc}`);
        console.log(message);
        return Help;
    }
    removeItem(message, item) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const match = yield this.board.findMatch(item);
                this.board.remove(match);
                return message.channel.send({
                    embed: {
                        color: 3447003,
                        description: `Removed ${item} by ${message.author.username}`,
                    },
                });
            }
            catch (error) {
                console.log(error);
                return message.channel.send({
                    embed: {
                        color: 3447003,
                        description: 'No matching item found, nothing removed.',
                    },
                });
            }
        });
    }
    startItem(message, item) {
        this.forward(item, this.board.backlog, this.board.inProgress, message);
    }
    completeItem(message, item) {
        this.forward(item, this.board.inProgress, this.board.complete, message);
    }
    forward(item, from, to, message) {
        const task = from.findMatch({ name: item });
        if (task instanceof task_1.Task) {
            from.remove(task);
            to.add(task);
            message.channel.send({
                embed: {
                    color: 3447003,
                    description: `${item} moved from "${from.getName()}" to "${to.getName()}" by: ${message.author.username}`,
                },
            });
        }
    }
}
exports.KanbotClient = KanbotClient;
