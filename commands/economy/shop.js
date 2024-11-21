import {SlashCommandBuilder} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Buy items from the shop')
    ,
    async execute(interaction) {
        await interaction.reply({content: `Command will be coming soon`, ephemeral: true})
    }
}