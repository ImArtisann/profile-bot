import {SlashCommandBuilder} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('quest')
    .setDescription('Set your quest or look at another users quest')
    .addSubcommand(subcommand =>
        subcommand
            .setName('set')
            .setDescription('Set your quest')
            .addStringOption(option =>
                option
                    .setName('quest')
                    .setDescription('The quest name you want to set')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('description')
                    .setDescription('The description of the quest')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('deadline')
                    .setDescription('The deadline for the quest')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reward')
                    .setDescription('The reward for completing the quest')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('view')
            .setDescription('View your quest or someones quest')
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('The user whose quest you want to view')
                    .setRequired(false)
            )
    )

export async function execute(interaction) {
    await interaction.reply({content: `Coming Soon...`, ephemeral: true});
}