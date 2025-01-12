import { CommandInteraction, Message } from 'discord.js';
import keys from '../utilities/keys.js';

export default class Command {

    /**
     * @typedef {object} CommandOptions
     * @property {string} name - The name of this command.
     * @property {boolean} [defer=true] - Indicates whether to defer this command.
     * @property {boolean} [ephemeral=false] - Indicates whether to defer this command as ephemeral.
     * @property {boolean} [requiresConnectedServer=true] - Indicates whether this command requires a connected server.
     * @property {int} [userIndex=null] - The index of the argument that takes a user.
     * @property {int} [serverIndex=null] - The index of the argument that takes a server.
     * @property {boolean} [requiresConnectedPlugin=false] - Indicates whether this command requires a connected plugin.
     * @property {boolean} [ownerOnly=false] - Indicates whether this command is only available to the bot owner.
     * @property {string} [category] - The category of this command.
     * @property {boolean} [allowPrefix=false] - Whether this command can be executed with the prefix.
     */

    /**
     * Creates a new Command instance.
     * @param {CommandOptions} options - The options for this command.
     */
    constructor(options) {

        /**
         * The name of this command.
         * @type {string}
         */
        this.name = options.name;

        /**
         * Indicates whether to defer this command.
         * @type {boolean}
         */
        this.defer = options.defer ?? true;

        /**
         * Indicates whether to defer this command as ephemeral.
         * @type {boolean}
         */
        this.ephemeral = options.ephemeral ?? false;

        /**
         * Indicates whether this command requires a connected server.
         * @type {boolean}
         */
        this.requiresConnectedServer = options.requiresConnectedServer ?? true;

        /**
         * The index of the argument that takes a user.
         * @type {?int}
         */
        this.userIndex = options.userIndex ?? null;

        /**
         * The index of the argument that takes a server.
         * @type {?int}
         */
        this.serverIndex = options.serverIndex ?? null;

        /**
         * Indicates whether this command requires a connected plugin.
         * @type {boolean}
         */
        this.requiresConnectedPlugin = options.requiresConnectedPlugin ?? false;

        /**
         * Indicates whether this command is only available to the bot owner.
         * @type {boolean}
         */
        this.ownerOnly = options.ownerOnly ?? false;

        /**
         * The category of this command.
         * @type {?string}
         */
        this.category = options.category ?? null;

        /**
         * Whether this command can be executed with the prefix.
         * @type {boolean}
         */
        this.allowPrefix = options.allowPrefix ?? false;
    }

    /**
     * Handles the execution of a command.
     * @param {(Message|CommandInteraction) & TranslatedResponses} interaction - The message/slash command interaction.
     * @param {MCLinker} client - The MCLinker client.
     * @param {any[]} args - The command arguments set by the user.
     * @param {requiresConnectedPlugin extends true ? ServerConnection<PluginProtocol> : ServerConnection<Protocol>} serverConnection - The connection of the server the command was executed in.
     * @returns {Promise<?boolean>|?boolean}
     * @abstract
     */
    async execute(interaction, client, args, serverConnection) {
        await interaction.replyTl(keys.api.command.executed, { args: args.join(' ') });
        if(this.defer) await interaction.deferReply?.({ ephemeral: this.ephemeral });

        if(this.ownerOnly) return interaction.user.id === process.env.OWNER_ID;

        const server = serverConnection.findServer(args?.[this.serverIndex]);

        if(this.requiresConnectedServer && !server) {
            await interaction.replyTl(keys.api.command.errors.server_not_connected);
            return false;
        }
        if(this.requiresConnectedPlugin && !server.protocol.isPluginProtocol()) {
            await interaction.replyTl(keys.api.command.errors.server_not_connected_plugin);
            return false;
        }

        if(this.userIndex !== null && args[this.userIndex] !== undefined) {
            const user = await client.userConnections.userFromArgument(args[this.userIndex], server, interaction);
            if(!user || user.error) return false;

            args[this.userIndex] = user;
        }

        if(this.serverIndex !== null && args[this.serverIndex] !== undefined) {
            if(!server) return false;
            args[this.serverIndex] = server;
        }

        return true;
    }
}
