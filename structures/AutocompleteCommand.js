const { AutocompleteInteraction, CommandInteraction } = require('discord.js');
const Command = require('./Command');

class AutocompleteCommand extends Command {

    /**
     * @inheritDoc
     * @param {(Message|CommandInteraction) & TranslatedResponses} interaction - The message/slash command interaction.
     * @param {MCLinker} client - The MCLinker client.
     * @param {any[]} args - The command arguments set by the user.
     * @param {?ServerConnection} server - The connection of the server the command was executed in.
     * @returns {Promise<?boolean>|?boolean}
     */
    execute(interaction, client, args, server) {
        return super.execute(interaction, client, args, server);
    }

    /**
     * Handles the autocompletion of a command.
     * @param {AutocompleteInteraction} interaction - The autocomplete interaction.
     * @param {MCLinker} client - The MCLinker client.
     * @returns {void|Promise<void>}
     * @abstract
     */
    autocomplete(interaction, client) {
        throw new Error('Not implemented');
    }

}

module.exports = AutocompleteCommand;
