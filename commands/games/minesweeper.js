import { SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('minesweeper')
		.setDescription('play a game of minesweeper')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('play')
				.setDescription('play a game of minesweeper')
				.addNumberOption((option) =>
					option
						.setName('bet')
						.setDescription('the amount of money you want to bet')
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName('difficulty')
						.setDescription('the difficulty of the game')
						.addChoices(
							{ name: 'easy', value: 'easy' },
							{ name: 'medium', value: 'medium' },
							{ name: 'hard', value: 'hard' },
						)
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('cashout').setDescription('cash out your winnings'),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('leave').setDescription('use this command to leave an old game'),
		),
	async execute(interaction) {
		await commandRouter.handle(interaction)
	},
}
