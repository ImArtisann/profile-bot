import {SlashCommandBuilder} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('spin the slots')
    ,
    async execute(interaction) {
        await interaction.reply({content: `Coming Soon...`, ephemeral: true});
    }
}