import { SlashCommandBuilder } from 'discord.js'

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
		try {
			await interaction.reply({
				content: 'This command is not yet implemented',
				ephemeral: true,
			})
		} catch (e) {
			console.log(`Error occurred in schedule command: ${e}`)
		}
	},
}
