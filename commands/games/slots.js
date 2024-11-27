import { SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('slots')
		.setDescription('spin the slots')
		.addNumberOption((option) =>
			option
				.setName('bet')
				.setDescription('The amount of money you want to bet.')
				.setMinValue(1)
				.setRequired(true),
		),
	async execute(interaction) {
		await commandRouter.handle(interaction)
	},
}
