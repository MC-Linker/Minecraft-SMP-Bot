const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const fs = require('fs');
const utils = require('../../utils');
const plugin = require('../../api/plugin');

module.exports = {
    name: 'chatchannel',
    aliases: ['setchatchannel', 'logchannel', 'setlogchannel'],
    usage: 'chatchannel <channel>',
    example: 'chatchannel #smp-chat',
    description: 'Set the channel in which the bot will send the minecraft chat messages and logs.',
    data: new SlashCommandBuilder()
            .setName('chatchannel')
            .setDescription('Set the channel in which the bot will send the minecraft chat messages and logs.')
            .addChannelOption(option =>
                option.setName('channel')
                .setDescription('Set the channel.')
                .setRequired(true)
            ),
    async execute(message, args) {
        let channel = args[0];
        if(!channel) {
            console.log(`${message.member.user.tag} executed /chatchannel without args in ${message.guild.name}`);
            message.reply(':warning: Please mention a channel.');
            return;
        } else if(!message.member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) {
            console.log(`${message.member.user.tag} executed /chatchannel ${channel.name} without admin in ${message.guild.name}`);
            message.reply(':warning: You have to be an admin to execute this command.');
            return;
        } else if(!fs.existsSync(`./ftp/${message.guild.id}.json`)) {
            console.log(`${message.member.user.tag} executed /chatchannel ${channel.name} without connection in ${message.guild.name}`);
            message.reply(':warning: You have to connect your server using `/connect plugin` to use the chat feature.');
            return;
        }
        if(message.mentions.channels?.size) channel = message.mentions.channels.first();

        console.log(`${message.member.user.tag} executed /chatchannel ${channel.name} in ${message.guild.name}`);


        const logChooser = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageSelectMenu()
                    .setCustomId('log')
                    .setMinValues(1)
                    .setMaxValues(8)
                    .setPlaceholder('Select up to 8 message types.')
                    .addOptions([
                        {
                            label: 'Chatmessages',
                            description: 'Send a message every time a player chats.',
                            value: '0',
                        },
                        {
                            label: 'Joinmessages',
                            description: 'Send a message every time a player joins the server.',
                            value: '1',
                        },
                        {
                            label: 'Leavemessages',
                            description: 'Send a message every time a player leaves the server.',
                            value: '2',
                        },
                        {
                            label: 'Advancements',
                            description: 'Send a message every time a player completes an advancement.',
                            value: '3',
                        },
                        {
                            label: 'Deathmessages',
                            description: 'Send a message every time a player dies.',
                            value: '4',
                        },
                        {
                            label: 'Commands',
                            description: 'Send a message every time a player executes a command.',
                            value: '5',
                        },
                        {
                            label: 'Startup message',
                            description: 'Send a message every time the server starts up.',
                            value: '6',
                        },
                        {
                            label: 'Shutdown message',
                            description: 'Send a message every time the server shuts down.',
                            value: '7',
                        },
                    ]),
        );

        const logChooserMsg = await message.reply({ content: 'Select all message types you want the bot to send. (You have 20 seconds to select).', components: [logChooser] });
        const collector = logChooserMsg.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 20000, max: 1 });
        collector.on('collect', async menu => {
            if(menu.customId === 'log' && menu.member.user.id === message.member.user.id) {
                const ip = await utils.getIp(message.guild.id, message);
                if(!ip) return;

                const connectPlugin = await plugin.connect(ip, message.guild.id, channel.id, menu.values, message);
                if(!connectPlugin) return;

                const pluginJson = {
                    "ip": connectPlugin.ip + ':21000',
                    "version": connectPlugin.version.split('.')[1],
                    "path": connectPlugin.path,
                    "hash": connectPlugin.hash,
                    "guild": connectPlugin.guild,
                    "chat": true,
                    "types": connectPlugin.types,
                    "channel": connectPlugin.channel,
                    "protocol": "plugin"
                }

                fs.writeFile(`./ftp/${message.guild.id}.json`, JSON.stringify(pluginJson, null, 2), 'utf-8', err => {
                    if(err) {
                        console.log('Error writing pluginFile')
                        menu.reply('<:Error:849215023264169985> Couldnt save channel. Please try again.');
                        return;
                    }
                    console.log('Successfully connected');
                    menu.reply('<:Checkmark:849224496232660992> Successfully set the chat channel');
                });
            } else {
                menu.reply({ content: ':warning: Only the command sender can select message types.', ephemeral: true });
            }
        });
        collector.on('end', collected => {
            if(!collected.size) message.reply('Select all message types you want the bot to send. (Time ran out).');
        });
	}
}