import { SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('wheel')
		.setDescription('spin the wheel')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('play')
				.setDescription('spin the wheel')
				.addNumberOption((option) =>
					option
						.setName('bet')
						.setDescription('The amount of money you want to bet.')
						.setMinValue(1)
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('leave').setDescription('Leave the wheel game'),
		),
	async execute(interaction) {
		await commandRouter.handle(interaction)
	},
}
