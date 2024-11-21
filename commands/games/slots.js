import {SlashCommandBuilder} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('slots')
    .setDescription('spin the slots')


export async function execute(interaction) {
    await interaction.reply({content: `Coming Soon...`, ephemeral: true});
}
