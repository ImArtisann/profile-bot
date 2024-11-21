import {SlashCommandBuilder} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('wheel')
    .setDescription('spin the wheel')


export async function execute(interaction) {
    await interaction.reply({content: `Coming Soon...`, ephemeral: true});
}
