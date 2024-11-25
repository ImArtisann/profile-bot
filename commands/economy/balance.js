import { SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription(`Displays your current balance.`)
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription('The user to check the balance of.')
				.setRequired(false)
		),

	execute: errorHandler('Command Balance')(async (interaction) => {
		await commandRouter.handle(interaction)
	}),
}
