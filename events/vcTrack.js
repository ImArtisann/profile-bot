import { EmbedBuilder, Events } from 'discord.js';
import { guildActions } from '../actions/guild.js';
import { userActions } from '../actions/user.js';

export const name = Events.VoiceStateUpdate;
export const once = false;

export async function execute(oldState, newState) {
    const guild = newState.guild || oldState.guild;
    const member = newState.member || oldState.member;
    const serverData = await guildActions.getServerRate(guild.id);
    const server = serverData[1];
    const trackedChannels = server.tracked;

    // Handle leaving tracked channel
    if (oldState.channel && trackedChannels.includes(oldState.channel.id)) {
        const data = await addEconomy(member, server);
        await sendMessage(
            guild,
            `<@${member.user.id}> left the voice channel: <#${oldState.channel.id}>`,
            member,
            false,
            data
        );
    }

    // Handle joining tracked channel
    if (newState.channel && trackedChannels.includes(newState.channel.id)) {
        await userActions.updateUserProfile(guild.id, member.id, {
            vcJoined: new Date().toISOString(),
        });
        await sendMessage(
            guild,
            `<@${member.user.id}> joined the voice channel: <#${newState.channel.id}>`,
            member,
            true
        );
    }
}

async function sendMessage(guild, message, member, join = false, earned = 0) {
    const server = await guildActions.getServerLogChannel(guild.id);
    const channel = await guild.channels.fetch(server);

    if (channel) {
        const embed = new EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle(join ? 'Member Join Tracked Channel' : 'Member Voice Session Ended')
            .setDescription(message)
            .addFields(
                { name: 'Start', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true },
                join
                    ? {
                          name: 'expires',
                          value: `<t:${Math.floor((Date.now() + 15 * 60 * 60 * 1000) / 1000)}:f>`,
                          inline: true,
                      }
                    : { name: 'Coins Earned', value: earned.toString(), inline: true }
            )
            .setTimestamp();
        channel.send({ embeds: [embed] });
    }
}

async function addEconomy(member, guild, rate) {
    const user = await userActions.getUserVCJoined(guild.id, member.id);
    const econ = await userActions.getUserEcon(guild.id, member.id);
    const hours = await userActions.getUserHoursVC(guild.id, member.id);
    const currentTime = new Date().toISOString();
    const timeDifference = Math.floor((new Date(currentTime) - new Date(user)) / (1000 * 60));
    const reward = rate * timeDifference;

    await userActions.updateUserProfile(guild.id, member.id, {
        econ: Number(econ + reward),
        vcJoined: '',
        hoursVC: Number(hours + timeDifference),
    });
    return reward;
}
