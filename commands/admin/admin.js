import {SlashCommandBuilder} from "discord.js";
import {databaseActions} from "../../database/mongodb.js";
import fs from "node:fs";

export default {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Add a raid that a user has completed')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose profile you want to see')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('raid')
                .setDescription('Raid user completed')
                .setRequired(false)
                .addChoices(
                    ...fs.readdirSync('./images/raids')
                        .filter(file => file.endsWith('.png'))
                        .map(file => ({
                            name: file.replace('.png', ''),
                            value: file.replace('.png', '').toLowerCase()
                        }))
                )
        )
        .addBooleanOption(option =>
            option.setName('remove')
                .setDescription('Did you mess up adding an emblem?')
                .setRequired(false)
        ),
    async execute(interaction) {
        const user = interaction.user
        if(interaction.member.roles.cache.has('1252396630339223613') || interaction.member.roles.cache.has('1298317864058617867')) {
            const targetUser = interaction.options.getUser('user');
            const raid = interaction.options.getString('raid');
            const add = interaction.options.getBoolean('remove') ?? true;
            await databaseActions.updateUser(targetUser.id, {
                [raid]: add
            })
            await interaction.reply({content: `Added ${raid} to ${targetUser.username}`, ephemeral: true});
        }else{
            await interaction.reply({content: `You do not have permission to use this command`, ephemeral: true});
        }
    }
}