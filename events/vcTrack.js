import { EmbedBuilder, Events } from "discord.js";
import { databaseActions } from "../database/mongodb.js";

export const name = Events.VoiceStateUpdate;
export const once = false;

export async function execute(oldState, newState) {
    const guild = newState.guild || oldState.guild;
    const member = newState.member || oldState.member;
    const serverData = await databaseActions.getConfig(guild.id);
    const server = serverData[0];
    const trackedChannels = server.tracked;

    // Handle leaving tracked channel
    if (oldState.channel && trackedChannels.includes(oldState.channel.id)) {
        const earned = await addEconomy(member, server);
        await sendMessage(guild, `<@${member.user.id}> left the voice channel: <#${oldState.channel.id}>`, member, false, earned);
    }

    // Handle joining tracked channel
    if (newState.channel && trackedChannels.includes(newState.channel.id)) {
        await databaseActions.updateUser(member.id, {
            timestamp: new Date().toISOString()
        });
        await sendMessage(guild, `<@${member.user.id}> joined the voice channel: <#${newState.channel.id}>`, member, true);
    }
}

async function sendMessage(guild, message, member, join = false, earned = 0) {
    const server = (await databaseActions.getConfig(guild.id))[0];
    const channel = await guild.channels.fetch(server.logs);

    if (channel) {
        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle(join ? 'Member Join Tracked Channel' : 'Member Voice Session Ended')
            .setDescription(message)
            .addFields(
                { name: 'Start', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true },
                join
                    ? { name: 'expires', value: `<t:${Math.floor((Date.now() + (15 * 60 * 60 * 1000)) / 1000)}:f>`, inline: true }
                    : { name: 'Coins Earned', value: earned.toString(), inline: true }
            )
            .setTimestamp();
        channel.send({ embeds: [embed] });
    }
}

async function addEconomy(member, server) {
    const user = (await databaseActions.getUser(member.id))[0];
    const currentTime = new Date().toISOString();
    const timeDifference = Math.floor((new Date(currentTime) - new Date(user.timestamp)) / (1000 * 60));
    const reward = server.rate * timeDifference;

    await databaseActions.updateUser(member.id, {
        econ: user.econ ? Number(user.econ) + Number(reward) : Number(reward),
        timestamp: currentTime
    });
    return reward;
}
