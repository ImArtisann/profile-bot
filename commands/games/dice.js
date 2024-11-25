import { SlashCommandBuilder } from 'discord.js'

export default {
	data: new SlashCommandBuilder().setName('dice').setDescription('roll some dice'),
	async execute(interaction) {
		try {
			await interaction.reply({ content: `Coming Soon...`, ephemeral: true })
		} catch (e) {
			console.log(`Error occurred in command dice: ${e}`)
		}
	},
}
