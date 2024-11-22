import { SlashCommandBuilder } from 'discord.js';
import { timerManager } from '../../classes/timerManager.js';

const timers = new Map();

export default {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder')
        .addStringOption(option =>
            option.setName('reminder').setDescription('The reminder you want to set').setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('time').setDescription('How long you want the reminder to be in minutes').setRequired(true)
        ),
    async execute(interaction) {
        const userId = interaction.user.id;
        const reminder = interaction.options.getString('reminder');
        const time = interaction.options.getInteger('time');
        const timeInMs = time * 60 * 1000;
        timerManager.createTimer({
            name: reminder,
            userId: userId,
            duration: timeInMs,
            callback: () => {
                interaction.channel.send(`Reminder for <@${userId}> : ${reminder}`);
            },
        });
        await interaction.reply({
            content: `Reminder ${reminder} set for ${time} ${time === 1 ? 'minute' : 'minutes'}`,
            ephemeral: true,
        });
    },
};
