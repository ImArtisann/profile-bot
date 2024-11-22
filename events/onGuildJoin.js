import { Client as client, Events } from 'discord.js';
import { guildActions } from '../actions/guild.js';

export const name = Events.GuildCreate;
export const once = false;
export async function execute(guild) {
    await guildActions.createServer(guild);
    console.log(`Guild joined ${guild} (${guild.id})`);
}
