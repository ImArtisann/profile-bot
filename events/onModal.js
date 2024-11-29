import { Events } from 'discord.js'
import { roomsActions } from '../actions/roomsActions.js'

export const name = Events.InteractionCreate
export const once = false
export async function execute(interaction) {
	try {
		if (!interaction.isModalSubmit()) return
		const modal = interaction.customId
		const modalName = modal.split(':')[0]
		const modalAction = modal.split(':')[1]
		if (modalName === 'depositModal') {
			const modalData = interaction.fields.getTextInputValue('depositInput')
			const depositAmount = parseInt(modalData)
			if (isNaN(depositAmount)) {
				return interaction.reply({
					content: 'Please enter a valid number',
					ephemeral: true,
				})
			} else {
				const success = await roomsActions.deposit(
					interaction.guild.id,
					modalAction,
					interaction.user.id,
					depositAmount,
				)
				if (!success) {
					return interaction.reply({
						content: 'You do not have enough funds to deposit that amount',
						ephemeral: true,
					})
				} else {
					return interaction.reply({
						content: 'You have deposited ' + depositAmount + ' coins into the room',
						ephemeral: true,
					})
				}
			}
		}
	} catch (error) {
		console.log(`Error occurred in onModal: ${error}`)
	}
}
