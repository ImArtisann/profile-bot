import { SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('cf')
		.setDescription('Flip a coin')
		.addStringOption((option) =>
			option
				.setName('side')
				.setDescription('The side of the coin you want to flip')
				.addChoices({ name: 'Heads', value: 'heads' }, { name: 'Tails', value: 'tails' })
				.setRequired(true),
		)
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
