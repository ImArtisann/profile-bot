import { SlashCommandBuilder } from 'discord.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('leave a game')
		.addStringOption((option) =>
			option
				.setName('game')
				.setDescription('the game you want to leave')
				.addChoices(
					{ name: 'blackjack', value: 'blackjack' },
					{ name: 'dice', value: 'dice' },
					{name: 'race', value: 'race'},
					{name: 'coinflip', value: 'coinflip'},
					{name: 'slots', value: 'slots'},
					{name: 'roulette', value: 'roulette'},
					{name: 'wheel', value: 'wheel'},
					{name: 'HoL', value: 'hol'},
				)
				.setRequired(true)
		),
	async execute(interaction) {
		await commandRouter.handle(interaction)
	},
}
