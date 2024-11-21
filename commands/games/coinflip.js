import {SlashCommandBuilder} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('cf')
        .setDescription('Flip a coin')
    ,
    async execute(interaction) {
        await interaction.reply({content: `Coming Soon...`, ephemeral: true});

    }
}