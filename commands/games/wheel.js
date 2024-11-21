import {SlashCommandBuilder} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('wheel')
        .setDescription('spin the wheel')
    ,
    async execute(interaction) {
        await interaction.reply({content: `Coming Soon...`, ephemeral: true});
    }
}