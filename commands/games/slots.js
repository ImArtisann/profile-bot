import { SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder().setName('slots').setDescription('spin the slots'),
	execute: errorHandler('Command Slots')( async (interaction) => {
		await commandRouter.handle(interaction)
		await interaction.reply({ content: `Coming Soon...`, ephemeral: true })
	}),
}
