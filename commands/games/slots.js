import { SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('slots')
		.setDescription('spin the slots')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('play')
				.setDescription('Play a game of slots')
				.addNumberOption((option) =>
					option
						.setName('bet')
						.setDescription('The amount of money you want to bet.')
						.setMinValue(1)
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('leave').setDescription('Leave the slots game'),
		),
	async execute(interaction) {
		await commandRouter.handle(interaction)
	},
}
