import { Events } from 'discord.js'
import { blackJack } from '../handlers/blackJackHandler.js'
import { userActions } from '../actions/userActions.js'
import { errorHandler } from '../handlers/errorHandler.js'
import { buttonRouter } from '../routers/buttonRouter.js'
export const name = Events.InteractionCreate
export const once = false

export async function execute(interaction) {
	try {
		if (!interaction.isButton()) return

		await buttonRouter.handle(interaction)
	} catch (e) {
		console.log(`Error occurred in onButton: ${e}`)
	}
}
