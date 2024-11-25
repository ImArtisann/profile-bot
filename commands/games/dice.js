import { SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder().setName('dice').setDescription('roll some dice'),
	execute: errorHandler('Command Dice')(async (interaction) => {
		await commandRouter.handle(interaction)
		await interaction.reply({ content: `Coming Soon...`, ephemeral: true })
	}),
}
