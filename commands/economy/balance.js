import { SlashCommandBuilder } from 'discord.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription(`Displays your current balance.`)
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription('The user to check the balance of.')
				.setRequired(false),
		),

	async execute(interaction) {
		await commandRouter.handle(interaction)
	},
}
