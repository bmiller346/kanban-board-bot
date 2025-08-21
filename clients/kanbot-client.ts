import { Client, Message, EmbedBuilder, ChannelType, ApplicationCommandData, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, Interaction, ChatInputCommandInteraction, StringSelectMenuInteraction, ButtonInteraction, ApplicationCommandOptionType } from 'discord.js';
import { KanbotCommands, KanbotRequest } from '../application/constants/kanbot-commands';
import { KanbanBoard } from '../application/kanban-board';
import { KanbotConfiguration } from '../application/kanbot-configuration';
import { Task } from '../application/models/task';
import * as help from '../util/commands.json';
import { saveBoardToS3, loadBoardFromS3 } from './aws-client';

export class KanbotClient {
    private signal: string;
    private botName: string;
    private token: string;
    private bucket?: string;
    private key?: string;

    constructor(kanbotConfiguration: KanbotConfiguration,
        private discordClient: Client,
        private board: KanbanBoard = new KanbanBoard()) {

        this.signal = kanbotConfiguration.signal;
        this.botName = kanbotConfiguration.botName;
        this.token = kanbotConfiguration.token;

        this.bucket = process.env.S3_BUCKET;
        this.key = process.env.S3_KEY;
    }

    public async handleLogin(): Promise<void> {
        try {
            const res = await this.discordClient.login(this.token);
            console.log(res);
        } catch (err) {
            console.error('Login failed', err);
            throw err;
        }
    }

    public handleReady(): void {
        this.discordClient.on('ready', async () => {
            console.log(`${this.botName} is online!`);
            try {
                await this.loadPersistedBoard();
                console.log('Loaded persisted board (if configured)');
            } catch (err) {
                console.error('Failed to load persisted board', err);
            }
            try {
                await this.registerSlashCommands();
                console.log('Slash commands registered');
            } catch (err) {
                console.error('Failed to register slash commands', err);
            }
        });

        this.discordClient.on('interactionCreate', async (interaction: Interaction) => {
            try {
                await this.handleInteraction(interaction);
            } catch (err) {
                console.error('Interaction handler error', err);
            }
        });
    }

    public handleMessage(): void {
        this.discordClient.on('messageCreate', (message: Message) => void this.handleRequest(message));
    }

    public async handleRequest(message: Message): Promise<void> {
        const channel = message.channel;
        const caller: string = message.author.username;

        if (message.author.bot) return;
        if (channel.type === ChannelType.DM) return;

        const content = message.content || '';
        if (!content.startsWith(this.signal)) return;

        let rest = content.slice(this.signal.length).trim();
        if (rest.startsWith('-')) rest = rest.slice(1).trim();

        if (!rest) {
            await this.displayBoard(message, caller);
            return;
        }

        let request: KanbotRequest;
        try {
            request = KanbotRequest.parseString(rest);
        } catch (err) {
            await message.channel.send({ embeds: [new EmbedBuilder().setColor(3447003).setDescription(`Unable to parse command.`)] });
            return;
        }

        try {
            switch (request.command) {
                case KanbotCommands.ADD:
                    await this.addToBacklog(message, request.taskName);
                    break;
                case KanbotCommands.HELP:
                    await message.channel.send({ embeds: [this.helpList(message)] });
                    break;
                case KanbotCommands.REMOVE:
                    await this.removeItem(message, request.taskName);
                    break;
                case KanbotCommands.START:
                    await this.startItem(message, request.taskName);
                    break;
                case KanbotCommands.COMPLETE:
                    await this.completeItem(message, request.taskName);
                    break;
                case KanbotCommands.CLEAR:
                    this.board.clearBoard();
                    try { await this.saveBoard(); } catch (err) { console.error('Failed to persist after clear', err); }
                    await channel.send({ embeds: [new EmbedBuilder().setColor(3447003).setDescription(`Board cleared by: ${message.author.username}`)] });
                    break;
                default:
                    await channel.send({ embeds: [new EmbedBuilder().setColor(3447003).setDescription(`Invalid request: ${request.command} ${request.taskName}`)] });
                    break;
            }
        } catch (err) {
            console.error('Error handling request', err);
            await message.channel.send({ embeds: [new EmbedBuilder().setColor(3447003).setDescription('An error occurred while processing your request.')] });
        }
    }

    private async registerSlashCommands(): Promise<void> {
        const commands: ApplicationCommandData[] = [
            {
                name: 'kanban',
                description: 'Kanban board commands',
                options: [
                    { name: 'view', type: ApplicationCommandOptionType.Subcommand, description: 'View the board' },
                    { name: 'add', type: ApplicationCommandOptionType.Subcommand, description: 'Add a task', options: [{ name: 'name', type: ApplicationCommandOptionType.String, description: 'Task name', required: true }] },
                    { name: 'remove', type: ApplicationCommandOptionType.Subcommand, description: 'Remove a task', options: [{ name: 'id', type: ApplicationCommandOptionType.String, description: 'Task id or name', required: true }] },
                    { name: 'start', type: ApplicationCommandOptionType.Subcommand, description: 'Start a task (move to In Progress)', options: [{ name: 'id', type: ApplicationCommandOptionType.String, description: 'Task id or name', required: true }] },
                    { name: 'complete', type: ApplicationCommandOptionType.Subcommand, description: 'Complete a task (move to Complete)', options: [{ name: 'id', type: ApplicationCommandOptionType.String, description: 'Task id or name', required: true }] },
                    { name: 'clear', type: ApplicationCommandOptionType.Subcommand, description: 'Clear the board' }
                ]
            }
        ];

        if (!this.discordClient.application) throw new Error('Client application not available');
        await this.discordClient.application.commands.set(commands);
    }

    private async handleInteraction(interaction: Interaction): Promise<void> {
        if (interaction.isChatInputCommand()) {
            const cmd = interaction as ChatInputCommandInteraction;
            if (cmd.commandName === 'kanban') {
                const sub = cmd.options.getSubcommand();
                switch (sub) {
                    case 'view':
                        await cmd.reply({ embeds: [this.buildBoardEmbed()], ephemeral: false });
                        await cmd.followUp({ components: this.buildBoardComponents(), ephemeral: false });
                        break;
                    case 'add': {
                        const name = cmd.options.getString('name', true);
                        if (this.board.containsTask(name)) {
                            await cmd.reply({ content: `Task already exists: ${name}`, ephemeral: true });
                            return;
                        }
                        this.board.addToBacklog(new Task(name, cmd.user.username));
                        try { await this.saveBoard(); } catch (err) { console.error('Failed to persist after add (interaction)', err); }
                        await cmd.reply({ content: `Added task ${name} to Backlog`, ephemeral: false });
                        break;
                    }
                    case 'remove': {
                        const idOrName = cmd.options.getString('id', true);
                        try {
                            const match = await this.resolveTaskByIdOrName(idOrName);
                            this.board.remove(match);
                            try { await this.saveBoard(); } catch (err) { console.error('Failed to persist after remove (interaction)', err); }
                            await cmd.reply({ content: `Removed task ${match.name}`, ephemeral: false });
                        } catch (err) {
                            await cmd.reply({ content: `No matching task found for ${idOrName}`, ephemeral: true });
                        }
                        break;
                    }
                    case 'start': {
                        const idOrName = cmd.options.getString('id', true);
                        try {
                            const match = await this.resolveTaskByIdOrName(idOrName);
                            this.board.remove(match);
                            this.board.addToInProgress(match);
                            try { await this.saveBoard(); } catch (err) { console.error('Failed to persist after start (interaction)', err); }
                            await cmd.reply({ content: `Moved ${match.name} to In Progress`, ephemeral: false });
                        } catch (err) {
                            await cmd.reply({ content: `No matching task found for ${idOrName}`, ephemeral: true });
                        }
                        break;
                    }
                    case 'complete': {
                        const idOrName = cmd.options.getString('id', true);
                        try {
                            const match = await this.resolveTaskByIdOrName(idOrName);
                            this.board.remove(match);
                            this.board.addToComplete(match);
                            try { await this.saveBoard(); } catch (err) { console.error('Failed to persist after complete (interaction)', err); }
                            await cmd.reply({ content: `Moved ${match.name} to Complete`, ephemeral: false });
                        } catch (err) {
                            await cmd.reply({ content: `No matching task found for ${idOrName}`, ephemeral: true });
                        }
                        break;
                    }
                    case 'clear':
                        this.board.clearBoard();
                        try { await this.saveBoard(); } catch (err) { console.error('Failed to persist after clear (interaction)', err); }
                        await cmd.reply({ content: 'Board cleared', ephemeral: false });
                        break;
                }
            }
        } else if (interaction.isStringSelectMenu()) {
            const sel = interaction as StringSelectMenuInteraction;
            const [col] = sel.customId.split(':');
            const val = sel.values[0];
            await sel.reply({ content: `Selected ${val} from ${col}`, ephemeral: true });
            const btnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId(`start:${val}`).setLabel('Start').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`complete:${val}`).setLabel('Complete').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`remove:${val}`).setLabel('Remove').setStyle(ButtonStyle.Danger)
            );
            await sel.followUp({ content: 'Choose action:', components: [btnRow], ephemeral: true });
        } else if (interaction.isButton()) {
            const btn = interaction as ButtonInteraction;
            const [action, val] = btn.customId.split(':');
            try {
                const match = await this.resolveTaskByIdOrName(val);
                switch (action) {
                    case 'start':
                        this.board.remove(match);
                        this.board.addToInProgress(match);
                        try { await this.saveBoard(); } catch (err) { console.error('Failed to persist after start (button)', err); }
                        await btn.reply({ content: `Moved ${match.name} to In Progress`, ephemeral: true });
                        break;
                    case 'complete':
                        this.board.remove(match);
                        this.board.addToComplete(match);
                        try { await this.saveBoard(); } catch (err) { console.error('Failed to persist after complete (button)', err); }
                        await btn.reply({ content: `Moved ${match.name} to Complete`, ephemeral: true });
                        break;
                    case 'remove':
                        this.board.remove(match);
                        try { await this.saveBoard(); } catch (err) { console.error('Failed to persist after remove (button)', err); }
                        await btn.reply({ content: `Removed ${match.name}`, ephemeral: true });
                        break;
                }
            } catch (err) {
                await btn.reply({ content: `Task not found: ${val}`, ephemeral: true });
            }
        }
    }

    private buildBoardEmbed(): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle(`${this.botName} Kanban`)
            .setColor(3447003)
            .addFields({ name: 'Backlog', value: this.displayColumn(this.board.backlog.getTasks()) || 'No tasks' })
            .addFields({ name: 'In Progress', value: this.displayColumn(this.board.inProgress.getTasks()) || 'No tasks' })
            .addFields({ name: 'Complete', value: this.displayColumn(this.board.complete.getTasks()) || 'No tasks' });
        return embed;
    }

    private buildBoardComponents() {
        const rows: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] = [];
        const backlog = this.board.backlog.getTasks();
        if (backlog.length > 0) {
            const menu = new StringSelectMenuBuilder().setCustomId('backlog').setPlaceholder('Select backlog task').addOptions(
                backlog.map(t => ({ label: t.name.slice(0, 100), value: t.taskId ? String(t.taskId) : t.name }))
            );
            rows.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu));
        }
        const inProg = this.board.inProgress.getTasks();
        if (inProg.length > 0) {
            const menu = new StringSelectMenuBuilder().setCustomId('inprogress').setPlaceholder('Select in-progress task').addOptions(
                inProg.map(t => ({ label: t.name.slice(0, 100), value: t.taskId ? String(t.taskId) : t.name }))
            );
            rows.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu));
        }
        return rows;
    }

    private async resolveTaskByIdOrName(idOrName: string): Promise<Task> {
        const asNum = Number(idOrName);
        if (!Number.isNaN(asNum)) {
            const candidate = new Task('', undefined, undefined, asNum);
            return await this.board.findMatch(candidate);
        }
        return await this.board.findMatch(idOrName);
    }

    private async displayBoard(message: Message, caller: string): Promise<void> {
        const embed = new EmbedBuilder()
            .setColor(3447003)
            .setDescription(`${this.botName}!`)
            .addFields({ name: 'Project Backlog', value: `\`\`\`${this.displayColumn(this.board.backlog.getTasks()) || 'No tasks'}\`\`` })
            .addFields({ name: 'In Progress', value: `\`\`\`${this.displayColumn(this.board.inProgress.getTasks()) || 'No tasks'}\`\`` })
            .addFields({ name: 'Completed Tasks', value: `\`\`\`${this.displayColumn(this.board.complete.getTasks()) || 'No tasks'}\`\`` })
            .addFields({ name: "I've been called by", value: caller });

        await message.channel.send({ embeds: [embed] });
    }

    private displayColumn(from: Task[]) {
        return from.map(task => task.toString()).join('\n');
    }

    private async addToBacklog(message: Message, taskName: string): Promise<void> {
        const author: string = message.author.username;
        if (this.board.containsTask(taskName)) {
            await message.channel.send({ embeds: [new EmbedBuilder().setColor(3447003).setDescription(`Not adding task ${taskName} because it already exists in the kanban board.`)] });
            return;
        }

        await message.channel.send({ embeds: [new EmbedBuilder().setColor(3447003).setDescription(`${taskName} has been added to the Backlog by ${author}`)] });
        this.board.addToBacklog(new Task(taskName, author));
        try { await this.saveBoard(); } catch (err) { console.error('Failed to persist after add', err); }
    }

    private helpList(_message: Message): EmbedBuilder {
        const Help = new EmbedBuilder()
            .setColor('#0074E7')
            .setTitle('List of Board Commands')
            .addFields({ name: `${help.view.command}`, value: `${help.view.desc}` })
            .addFields({ name: `${help.add.command}`, value: `${help.add.desc}` })
            .addFields({ name: `${help.remove.command}`, value: `${help.remove.desc}` })
            .addFields({ name: `${help.clearTask.command}`, value: `${help.clearTask.desc}` })
            .addFields({ name: `${help.startTask.command}`, value: `${help.startTask.desc}` })
            .addFields({ name: `${help.completeTask.command}`, value: `${help.completeTask.desc}` });
        return Help;
    }

    private async removeItem(message: Message, item: string): Promise<void> {
        try {
            const match: Task = await this.board.findMatch(item);
            this.board.remove(match);
            await message.channel.send({ embeds: [new EmbedBuilder().setColor(3447003).setDescription(`Removed ${item} by ${message.author.username}`)] });
            try { await this.saveBoard(); } catch (err) { console.error('Failed to persist after remove', err); }
        } catch (error) {
            console.error('removeItem error', error);
            await message.channel.send({ embeds: [new EmbedBuilder().setColor(3447003).setDescription('No matching item found, nothing removed.')] });
        }
    }

    private async startItem(message: Message, item: string): Promise<void> {
        await this.forward(item, this.board.backlog, this.board.inProgress, message);
    }

    private async completeItem(message: Message, item: string): Promise<void> {
        await this.forward(item, this.board.inProgress, this.board.complete, message);
    }

    private async forward(item: string, from: any, to: any, message: Message): Promise<void> {
        const task: Task | undefined = from.findMatch({ name: item } as Task);

        if (!(task instanceof Task)) {
            await message.channel.send({ embeds: [new EmbedBuilder().setColor(3447003).setDescription(`No matching item "${item}" found in "${from.getName()}".`)] });
            return;
        }

        from.remove(task);
        to.add(task);
        try { await this.saveBoard(); } catch (err) { console.error('Failed to persist after move', err); }
        await message.channel.send({ embeds: [new EmbedBuilder().setColor(3447003).setDescription(`${item} moved from "${from.getName()}" to "${to.getName()}" by: ${message.author.username}`)] });
    }

    private async saveBoard(): Promise<void> {
        if (!this.bucket || !this.key) return;
        try {
            await saveBoardToS3(this.bucket, this.key, this.board);
        } catch (err) {
            console.error('saveBoard error', err);
            throw err;
        }
    }

    private async loadPersistedBoard(): Promise<void> {
        if (!this.bucket || !this.key) return;
        try {
            await loadBoardFromS3(this.bucket, this.key, this.board);
        } catch (err) {
            console.error('loadPersistedBoard error', err);
            throw err;
        }
    }
}
