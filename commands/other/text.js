const Canvas = require('canvas');
const Discord = require('discord.js');

module.exports = {
    name: 'text',
    aliases: ['texts', 'font', 'fonts'],
    usage: 'font mojang/minecraft/<Any Linux Preinstalled Font> <color> <Your text>',
    example: 'font minecraft red I love this bot!',
    description: 'Create images with text with different fonts and colors. All color ids can be found [here.](https://developer.mozilla.org/de/docs/Web/CSS/color_value#farbschlüsselwörter)\nSpecial fonts: varela_round, minecraft, mojang',
    execute(message, args) {
        let font = args.shift().split('_').join(' ');
        const color = args.shift().toLowerCase();
        const text = args.join(' ');

        if (!font) {
            console.log(message.member.user.tag + ' executed ^text without args.');
            message.reply('Do you want to create a Mojang studios font: `^text mojang`, minecraft font: `^text minecraft` or an image with a different font: `^font <Any Preinstalled Font>');
            return;
        } else if (!color) {
            console.log(message.member.user.tag + ' executed ^text without args.');
            message.reply('Do you want to create a Mojang studios font: `^text mojang`, minecraft font: `^text minecraft` or an image with a different font: `^font <Any Preinstalled Font>');
            return;
        } else if (!text) {
            console.log(message.member.user.tag + ' executed ^text without text.');
            message.reply('Please specify the text you want to create the image with.');
            return;
        }

        console.log(message.member.user.tag + ' executed ^text ' + font + ' ' + color + ' ' + text);

        if (font === 'mojang' || font === 'mojangstudios' || font === 'mojang-studios') font = 'mojangstudiosfont by bapakuy';

        const fontCanvas = Canvas.createCanvas(text.split('').length * 225, 225);
        const ctx = fontCanvas.getContext('2d');
        try {
            ctx.font = `200px ${font}`;
            ctx.fillStyle = color;
            ctx.fillText(text, 0, 200, fontCanvas.width);
        } catch (err) {
            console.log('Error trying to apply text.', err);
            message.reply('<:Error:849215023264169985> Please check if you entered a valid font or color.');
            return;
        }

        const fontImg = new Discord.MessageAttachment(fontCanvas.toBuffer(), 'inventoryImage.png');
        message.reply('<:Checkmark:849224496232660992> Heres your custom text-image.', fontImg);
    }
}