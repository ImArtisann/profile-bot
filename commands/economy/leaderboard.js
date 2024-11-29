import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'
import { Command } from 'ioredis'

export default {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('View the leaderboard econ is default')
		.addStringOption((option) =>
			option
				.setName('leaderboard')
				.setDescription('The leaderboard you want to view')
				.addChoices(
					{ name: 'Econ', value: 'econ' },
					{ name: 'VC Hours', value: 'hoursVC' },
					{ name: 'Messages', value: 'messages' },
				),
		),
	execute: async (interaction) => {
		await commandRouter.handle(interaction)
	},
}
