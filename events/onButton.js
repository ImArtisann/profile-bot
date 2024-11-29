import { Events } from 'discord.js'
import { buttonRouter } from '../routers/buttonRouter.js'
export const name = Events.InteractionCreate
export const once = false

export async function execute(interaction) {
	try {
		if (
			!interaction.isButton() &&
			!interaction.isStringSelectMenu() &&
			!interaction.isUserSelectMenu()
		)
			return

		await buttonRouter.handle(interaction)
	} catch (e) {
		console.log(`Error occurred in onButton: ${e}`)
	}
}
