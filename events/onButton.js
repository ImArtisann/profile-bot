import { Events } from 'discord.js'
import { blackJack } from '../handlers/blackJackHandler.js'
import { userActions } from '../actions/userActions.js'

export const name = Events.InteractionCreate
export const once = false

export async function execute(interaction) {
	try {
		if (!interaction.isButton()) return
		const button = interaction.customId
		const type = button.split(':')[0]
		const id = button.split(':')[2]
		const user = interaction.user.id
		const message = interaction.message
		switch (type) {
			case 'BJ':
				if (id !== user) {
					return interaction.reply({
						content: 'You are not the owner of this game',
						ephemeral: true,
					})
				}
				await interaction.deferUpdate()
				await blackJack.handleInteraction(user, interaction, button)
				break
			case 'Room':
				const privateChannel = await userActions.getUserPrivateChannels(
					interaction.guild.id,
					user,
				)
				if (privateChannel.includes(id)) {
					await interaction.reply({
						content: 'You dont have permission to use the options of this room',
						ephemeral: true,
					})
					return
				}
				// await roomsActions.handleInteraction(interaction, button)
				break
			default:
				break
		}
	} catch (e) {
		console.log(`Error occurred in onButton: ${e}`)
	}
}
