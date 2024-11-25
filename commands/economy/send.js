import { SlashCommandBuilder } from 'discord.js'
import { userActions } from '../../actions/userActions.js'

export default {
	data: new SlashCommandBuilder()
		.setName('send')
		.setDescription('Send a user money')
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription('The user you want to send money to')
				.setRequired(true),
		)
		.addIntegerOption((option) =>
			option
				.setName('amount')
				.setDescription('The amount of money you want to send')
				.setRequired(true),
		),
	async execute(interaction) {
		try {
			const user = interaction.user.id
			const receivingUser = interaction.options.getUser('user')
			const amount = interaction.options.getInteger('amount')
			if (
				await userActions.sendEcon(interaction.guild.id, user, receivingUser.id, amount)
			) {
				await interaction.reply({
					content: `You sent ${amount} coins to ${receivingUser.username}`,
					ephemeral: true,
				})
			} else {
				await interaction.reply({
					content: `You do not have enough money to send ${amount} coins`,
					ephemeral: true,
				})
			}
		} catch (e) {
			console.log(`Error occurred in command send: ${e}`)
		}
	},
}
