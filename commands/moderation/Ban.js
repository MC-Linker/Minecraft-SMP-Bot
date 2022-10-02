const { keys } = require('../../api/messages');
const Command = require('../../structures/Command');

class Ban extends Command {

    constructor() {
        super({
            name: 'ban',
            requiresConnectedPlugin: true,
            requiresConnectedUser: 0,
        });
    }

    async execute(interaction, client, args, server) {
        if(!await super.execute(interaction, client, args, server)) return;

        const user = args[0];
        args.shift(); // Shift user
        let reason = args[0] ? args.join(' ') : 'Banned by an operator.';

        const resp = await server.protocol.execute(`ban ${user.username} ${reason}`);
        if(!resp) {
            return interaction.replyTl(keys.api.plugin.errors.no_response);
        }
        else if(resp.status === 206) {
            return interaction.replyTl(keys.commands.ban.warnings.response_warning, { username: user, reason });
        }

        return interaction.replyTl(keys.commands.ban.success, { username: user, reason });
    }
}

module.exports = Ban;
