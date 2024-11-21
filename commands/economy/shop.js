import {SlashCommandBuilder} from "discord.js";


export const data = new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Buy items from the shop')


export async function execute(interaction) {
    await interaction.reply({content: `Coming Soon...`, ephemeral: true});
}