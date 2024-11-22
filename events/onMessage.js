import { Events } from 'discord.js';
import { userActions } from '../actions/user.js';
import { guildActions } from '../actions/guild.js';

export const name = Events.MessageCreate;
export const once = false;
export async function execute(client, message) {
    if (message.author.bot) return;

    const guild = message.guild.id;
    const user = message.author.id;
    const serverData = await guildActions.getServerRate(guild.id);
    const server = serverData[0];
    await userActions.incrementUserMessageCount(String(guild), String(user));
    await userActions.updateUserEcon(
        String(guild),
        String(user),
        Number((await userActions.getUserEcon(guild, String(user))) + 1 * server)
    );
}
