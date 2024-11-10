import {SlashCommandBuilder} from "discord.js";
import {databaseActions} from "../../database/mongodb.js";

export const data = new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Add a raid that a user has completed')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user whose profile you want to see')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('raid')
            .setDescription('Raid user completed')
            .setRequired(true)
            .addChoices(
                {name: 'Abyssal', value: 'abyssal'},
                {name: 'Wendigo', value: 'wendigo'},
            )
    );

export async function execute(interaction) {
    const user = interaction.user
    if (!interaction.member.permissions.has('ADMINISTRATOR') && !interaction.member.permissions.has('MODERATE_MEMBERS')) {
        return interaction.reply({content: 'You do not have permission to use this command.', ephemeral: true});
    }
    const targetUser = interaction.options.getUser('user');
    const raid = interaction.options.getString('raid');
    await databaseActions.updateUser(targetUser.id, {
        raid: true
    })
    await interaction.reply({content: `Added ${raid} to ${targetUser.username}`, ephemeral: true});
}