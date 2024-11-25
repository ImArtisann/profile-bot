import { roomsActions } from '../actions/roomsActions.js'
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	UserSelectMenuBuilder,
} from 'discord.js'

class ActionHelper {
	constructor() {}

	/**
	 * Creates a set of action components (buttons and menus) for a room in a Discord guild.
	 *
	 * @param {Object} guild - The Discord guild the room belongs to.
	 * @param {string} roomId - The ID of the room.
	 * @returns {Promise<Array<import(discord.js).ActionRowBuilder>>} An array of action row builders containing the created components.
	 */
	async createRoomActions(guild, roomId) {
		let room = await roomsActions.getRoom(guild, roomId)

		const depositButton = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(`Room:Deposit:${roomId}`)
				.setLabel('Deposit')
				.setStyle(ButtonStyle.Primary),
		)

		const inviteMenu = new ActionRowBuilder().addComponents(
			new UserSelectMenuBuilder()
				.setCustomId(`Room:Invite:${roomId}`)
				.setPlaceholder('Select a member')
				.setMinValues(1),
		)

		const kickMenu = new ActionRowBuilder().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId('Kick')
				.setPlaceholder('Remove a member')
				.addOptions(
					room.members.map((userId) => ({
						label: guild.members.cache.get(userId).user.username,
						value: userId,
					})),
				),
		)

		return [depositButton, inviteMenu, kickMenu]
	}

	/**
	 * Creates a set of action components (buttons and menus) for a BlackJack game.
	 *
	 * @param {string} userId - The ID of the user playing the BlackJack game.
	 * @param {boolean} [gameOver=false] - Indicates whether the game is over.
	 * @param {boolean} [firstHand=false] - Indicates whether this is the first hand of the game.
	 * @returns {Promise<Array<import(discord.js).ActionRowBuilder>>} An array of action row builders containing the created components.
	 */
	async createBlackJackActions(userId, gameOver = false, firstHand = false) {
		let buttons = []
		if (gameOver) {
			buttons.push(
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(`BJ:PlayAgain:${userId}`)
						.setLabel('Play Again')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId(`BJ:Leave:${userId}`)
						.setLabel('Leave')
						.setStyle(ButtonStyle.Danger),
				),
			)
		} else {
			buttons.push(
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(`BJ:Hit:${userId}`)
						.setLabel('Hit')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId(`BJ:Stand:${userId}`)
						.setLabel('Stand')
						.setStyle(ButtonStyle.Primary),
				),
			)
			if (firstHand) {
				buttons.push(
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setCustomId(`BJ:DoubleDown:${userId}`)
							.setLabel('Double Down')
							.setStyle(ButtonStyle.Primary),
					),
				)
			}
		}
		return buttons
	}
}

export const actionHelper = new ActionHelper()
