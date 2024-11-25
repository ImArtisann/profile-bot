import { SlashCommandBuilder } from 'discord.js'
import { userActions } from '../../actions/userActions.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('send')
		.setDescription('Send a user money')
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription('The user you want to send money to')
				.setRequired(true),
		)
		.addIntegerOption((option) =>
			option
				.setName('amount')
				.setDescription('The amount of money you want to send')
				.setRequired(true),
		),
	execute: errorHandler('Command Send')(async (interaction) => {
		await commandRouter.handle(interaction)
	}),
}
