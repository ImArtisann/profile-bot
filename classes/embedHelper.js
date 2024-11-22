import { EmbedBuilder } from 'discord.js';
import { roomsActions } from '../actions/rooms.js';

class EmbedHelper {
    constructor() {
        this.builder = new EmbedBuilder();
    }

    /**
     * Generates a leaderboard embed for the specified type and data.
     *
     * @param {string} [type='econ'] - The type of leaderboard to generate (e.g. 'econ', 'points', etc.).
     * @param {Object[]} data - An array of user data objects, each with an 'amount' property.
     * @returns {EmbedBuilder} - The generated leaderboard embed.
     */
    async makeLeaderboard(type = 'econ', data) {
        this.builder.setTitle(`${type.toUpperCase()} Leaderboard`);
        this.builder.setDescription(`Top 10 ${type} users`);
        this.builder.setColor(0x0099ff);
        let rank = 1;
        for (const user of data) {
            this.builder.addFields({ name: `#${rank} <@${userId}>`, value: user.amount.toString(), inline: false });
            rank++;
        }
        return this.builder;
    }

    /**
     * Generates a quest embed for the specified quest and user.
     *
     * @param {Object} quest - The quest object containing the quest details.
     * @param {string} userId - The ID of the user the quest is for.
     * @returns {EmbedBuilder} - The generated quest embed.
     */
    async makeQuest(quest, userId) {
        this.builder.setTitle(`<@${userId}> Quest`);
        this.builder.setDescription(`${quest.description}`);
        this.builder.setFields([
            { name: 'Name', value: quest.name, inline: false },
            { name: 'Deadline', value: quest.deadline, inline: false },
            { name: 'Reward', value: quest.reward, inline: false },
        ]);
        this.builder.setColor(0x0099ff);
        return this.builder;
    }

    async roomStats(guild, roomId) {
        const room = await roomsActions.getRoom(guild.id, roomId);
        this.builder.setTitle(`${room.name} Control Panel`);
        this.builder.setFields(
            { name: 'Channel', value: `<#${room.channel}>`, inline: true },
            { name: 'Owner', value: `<@${room.owner}>`, inline: true },
            { name: 'Room Balance:', value: `${room.balance}`, inline: true },
            { name: 'Created At', value: `<t:${Math.floor(room.timeStamp / 1000)}:f>`, inline: true },
            { name: 'Members', value: room.members.map(userId => `<@${userId}>`).join(', '), inline: false }
        );
        this.builder.setColor(0x0099ff);
        return this.builder;
    }
}

export default EmbedHelper;
