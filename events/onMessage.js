import { Events } from 'discord.js'
import { userActions } from '../actions/userActions.js'
import { guildActions } from '../actions/guildActions.js'
import { errorHandler } from '../handlers/errorHandler.js'

export const name = Events.MessageCreate
export const once = false

export const execute = errorHandler('Event Message Create')(async function (client) {
	// Ignore messages from bots
	if (client.author.bot || client.system) return

	const guild = client.guild.id
	const user = client.author.id
	const serverData = await guildActions.getServerRate(guild)
	const server = serverData[0]
	await userActions.incrementUserMessageCount(String(guild), String(user))
	await userActions.updateUserEcon(
		String(guild),
		String(user),
		Number((await userActions.getUserEcon(guild, String(user))) + 1 * server),
	)
})
