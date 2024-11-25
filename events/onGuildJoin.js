import { Client as client, Events } from 'discord.js'
import { guildActions } from '../actions/guildActions.js'

export const name = Events.GuildCreate
export const once = false

export async function execute(guild) {
	try {
		await guildActions.createServer(guild)
	} catch (err) {
		console.log(`Error occurred in onGuildJoin: ${err}`)
	}
}
