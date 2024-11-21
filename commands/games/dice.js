import {SlashCommandBuilder} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('roll some dice')
    ,
    async execute(interaction) {
        await interaction.reply({content: `Coming Soon...`, ephemeral: true});
    }
}