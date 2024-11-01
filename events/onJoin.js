import {Client as client, Events} from "discord.js";

export const name = Events.GuildMemberAdd;
export const once = false;
export async function execute(member) {
    const channel = member.guild.channels.cache.find(channel => channel.name === 'spawn_point');
    if (!channel) return;
    const embed = {
        title: '**Are you ready to Gamify your Life?**',
        description: `${member} has spawned into ⚜ • 𝐆𝐚𝐦𝐢𝐟𝐟𝐲𝐧𝐢𝐚 • ⚜
        Please check out these channels to get started!
        <#1252425598240952331> ✨・ roles
        <#1252286880859295811> 💫・ rules
        <#1252286791940046898> ✨・ self-intro
        `,
        color: 0x0099ff,
    };
    channel.send({embeds: [embed]});
    const guild = member.guild;
    const role = guild.roles.cache.find(role => role.name === 'gamiffyer');
    if (!role) return;
    member.roles.add(role);
}