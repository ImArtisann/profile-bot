import { SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('schedule')
		.setDescription('Schedule a study session')
		.addNumberOption((option) =>
			option
				.setName('time')
				.setDescription('The amount of time you want to schedule the study session for')
				.setRequired(true),
		)
		.addNumberOption((option) =>
			option
				.setName('when')
				.setDescription(
					'How many minutes from now do you want to schedule the study session for',
				)
				.setRequired(true),
		),

	async execute(interaction) {
		await commandRouter.handle(interaction)
	},
}
