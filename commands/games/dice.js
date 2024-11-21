import {SlashCommandBuilder} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('dice')
    .setDescription('roll some dice')


export async function execute(interaction) {
    await interaction.reply({content: `Coming Soon...`, ephemeral: true});
}
