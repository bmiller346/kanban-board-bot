"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KanbotConfiguration = void 0;
const bot_configuration_1 = require("./bot-configuration");
class KanbotConfiguration extends bot_configuration_1.BotConfiguration {
    constructor(botName = 'Kanbot', token, commandPrefix = '$', commandName = 'kanbot') {
        super(botName, token);
        this.commandPrefix = commandPrefix;
        this.commandName = commandName;
    }
    get signal() {
        return `${this.commandPrefix}${this.commandName}`;
    }
}
exports.KanbotConfiguration = KanbotConfiguration;
