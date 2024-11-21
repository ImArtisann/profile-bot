import {EmbedBuilder, SlashCommandBuilder} from "discord.js";
import {databaseActions} from "../../database/mongodb.js";

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the leaderboard')

export async function execute(interaction) {
    let leaderboard = await getLeaderboard();
    await interaction.reply({embeds: [leaderboard], ephemeral: false});
}

async function getLeaderboard() {
    const users = await databaseActions.getUsers();
    const topUsers = users
        .filter(user => user.econ)
        .sort((a, b) => b.econ - a.econ)
        .slice(0, 5)
        .map((user, index) => ({
            id: user._id,
            value: user.econ
        }));
    const embed = new EmbedBuilder()
        .setTitle('Leaderboard')
        .setColor('#0099ff')
    for(const user of topUsers){
        embed.addFields(
            {name: `#${topUsers.indexOf(user) + 1}`, value: `**<@${user.id}>**`, inline: true},
            {name: 'Balance', value: `**${user.value}**`, inline: true});
    }
    return embed;
}