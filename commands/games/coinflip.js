import {SlashCommandBuilder} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('cf')
    .setDescription('Flip a coin')


export async function execute(interaction) {
    await interaction.reply({content: `Coming Soon...`, ephemeral: true});
}
