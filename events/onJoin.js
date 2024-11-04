import {Client as client, Events} from "discord.js";
import {createImage} from "../commands/utility/profile.js";

export const name = Events.GuildMemberAdd;
export const once = false;
export async function execute(member) {
    const channel = member.guild.channels.cache.get('1253016548080222261');
    const user = member.user;
    const data = {
        hp: 4,
        mood: 4,
        focus: 4,
        mana: 4,
        level: "???",
        class: "???",
    }
    const attachment = await createImage(user, data, member);
    const embed = {
        title: '**Are you ready to Gamify your Life?**',
        description: `${member} has spawned into :fleur_de_lis: • 𝐆𝐚𝐦𝐢𝐟𝐟𝐲𝐧𝐢𝐚 • :fleur_de_lis:
        *Please check out these channels to get started!*
        <#1252425598240952331>
        <#1252286880859295811>
        <#1252286791940046898>
        `,
        color: 0x0099ff,
    };
    channel.send({
        embeds: [embed]
    });
    channel.send({
        files: [attachment]
    });
    member.roles.add('1252692250958237828');
}