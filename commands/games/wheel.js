import { SlashCommandBuilder } from 'discord.js'

export default {
	data: new SlashCommandBuilder().setName('wheel').setDescription('spin the wheel'),
	async execute(interaction) {
		try {
			await interaction.reply({ content: `Coming Soon...`, ephemeral: true })
		} catch (e) {
			console.log(`Error occurred in command wheel: ${e}`)
		}
	},
}
