import {SlashCommandBuilder} from "discord.js";

const timers = new Map();

export const data = new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Set a reminder')
    .addStringOption(option =>
        option
            .setName('reminder')
            .setDescription('The reminder you want to set')
            .setRequired(true)
    )
    .addIntegerOption(option =>
        option
            .setName('time')
            .setDescription('How long you want the reminder to be in minutes')
            .setRequired(true)
    )

export async function execute(interaction) {
    await startTimer(interaction);
}

async function startTimer(interaction) {
    const userId = interaction.user.id;
    const reminder = interaction.options.getString('reminder');
    const time = interaction.options.getInteger('time');
    const timeInMs = time * 60 * 1000;
    if(timers.has(userId)){
        await interaction.reply({content: `You already have a reminder set`, ephemeral: true});
        return;
    }

    await interaction.reply({content: `Reminder ${reminder} set for ${time} ${time === 1 ? 'minute' : 'minutes'}`, ephemeral: true});

    const timer = setTimeout(() => {
        interaction.channel.send(`Reminder for <@${interaction.user.id}> : ${reminder}`);
        timers.delete(userId);
    }, timeInMs);
    timers.set(userId, timer);
}
