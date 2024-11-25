import { SlashCommandBuilder } from 'discord.js'

export default {
	data: new SlashCommandBuilder().setName('cf').setDescription('Flip a coin'),
	async execute(interaction) {
		try {
			await interaction.reply({ content: `Coming Soon...`, ephemeral: true })
		} catch (e) {
			console.log(`Error occurred in command coinflip: ${e}`)
		}
	},
}
