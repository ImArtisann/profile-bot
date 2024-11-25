import { SlashCommandBuilder } from 'discord.js'

export default {
	data: new SlashCommandBuilder()
		.setName('shop')
		.setDescription('Buy items from the shop'),
	async execute(interaction) {
		try {
			await interaction.reply({
				content: `Command will be coming soon`,
				ephemeral: true,
			})
		} catch (e) {
			console.log(`Error occurred in command shop: ${e}`)
		}
	},
}
