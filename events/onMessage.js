import { Events } from 'discord.js'
import { userActions } from '../actions/userActions.js'
import { guildActions } from '../actions/guildActions.js'

export const name = Events.MessageCreate
export const once = false

export async function execute(client) {
	try {
		// Ignore messages from bots
		if (client.author.bot) return

		const guild = client.guildId
		const user = client.author.id
		const serverData = await guildActions.getServerRate(guild)
		const server = serverData[0]
		await userActions.incrementUserMessageCount(String(guild), String(user))
		await userActions.updateUserEcon(
			String(guild),
			String(user),
			Number((await userActions.getUserEcon(guild, String(user))) + 1 * server),
		)
	} catch (err) {
		console.log(`Error occurred in onMessage.js: ${err}`)
	}
}
