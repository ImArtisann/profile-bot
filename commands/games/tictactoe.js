import { SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('tictactoe')
		.setDescription('play a game of tictactoe against another player')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('play')
				.setDescription('Play a game of keno')
				.addUserOption((option) =>
					option
						.setName('user')
						.setDescription('The user you want to play against.')
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('leave').setDescription('Leave the keno game'),
		),
	async execute(interaction) {
		await commandRouter.handle(interaction)
	},
}
