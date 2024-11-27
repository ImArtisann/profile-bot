import { roomsActions } from '../actions/roomsActions.js'
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	UserSelectMenuBuilder,
} from 'discord.js'
import { errorHandler } from '../handlers/errorHandler.js'

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
		try {
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
		} catch (e) {
			console.log(`Error creating room actions: ${e}`)
		}
	}

	/**
	 * Creates a set of action components (buttons and menus) for a BlackJack game.
	 *
	 * @param {string} userId - The ID of the user playing the BlackJack game.
	 * @param {boolean} [gameOver=false] - Indicates whether the game is over.
	 * @param {boolean} [firstHand=false] - Indicates whether this is the first hand of the game.
	 * @returns {Array<import(discord.js).ActionRowBuilder>} An array of action row builders containing the created components.
	 */
	createBlackJackActions(userId, gameOver = false, firstHand = false) {
		try {
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
		} catch (e) {
			console.log(`Error creating BlackJack actions: ${e}`)
		}
	}

	/**
	 * Generates the action buttons for a House of Lords game based on the current game state.
	 *
	 * @param {string} userId - The ID of the user playing the game.
	 * @param {boolean} [gameOver=false] - Indicates whether the game is over.
	 * @returns {Array<import(discord.js).ActionRowBuilder>} An array of action row builders containing the created components.
	 */
	createHoLActions(userId, gameOver = false) {
		try {
			let buttons = []
			if (gameOver) {
				buttons.push(
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setCustomId(`HOL:PlayAgain:${userId}`)
							.setLabel('Play Again')
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId(`HOL:Leave:${userId}`)
							.setLabel('Leave')
							.setStyle(ButtonStyle.Danger),
					),
				)
			} else {
				buttons.push(
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setCustomId(`HOL:Lower:${userId}`)
							.setLabel('Lower')
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId(`HOL:Higher:${userId}`)
							.setLabel('Higher')
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId(`HOL:Cash:${userId}`)
							.setLabel('Cash Out')
							.setStyle(ButtonStyle.Primary),
					),
				)
			}
			return buttons
		} catch (e) {
			console.log(`Error creating HoL actions: ${e}`)
		}
	}

	/**
	 * Generates the action buttons for a Minesweeper game based on the current game state.
	 *
	 * @param {string} userId - The ID of the user playing the game.
	 * @param {string[]} revealed - An array of revealed square positions in the format `"x_y"`.
	 * @param {string[]} mines - An array of mine positions in the format `"x_y"`.
	 * @param {Object} numbers - An object mapping revealed square positions to the number of adjacent mines.
	 * @param {boolean} [gameOver=false] - Whether the game is over.
	 * @returns {ActionRowBuilder[]} - An array of action row builders containing the game buttons.
	 */
	createMineSweeperActions(userId, revealed, mines, numbers, gameOver = false) {
		try {
			let buttons = []

			for (let i = 0; i < 5; i++) {
				for (let j = 0; j < 5; j++) {
					const position = `${i}_${j}`
					if (revealed.includes(position)) {
						// Change style and label based on what was revealed
						let style = ButtonStyle.Secondary // Default for revealed safe squares
						let label = numbers[position] || '0' // Show number if it exists

						if (mines.includes(position)) {
							style = ButtonStyle.Danger
							label = '💣'
						} else if (numbers[position] === 0) {
							label = ' ' // Empty space for zero
						}

						buttons.push(
							new ButtonBuilder()
								.setCustomId(`MS:Reveal_${i}_${j}:${userId}`)
								.setLabel(label)
								.setStyle(style)
								.setDisabled(true),
						)
					} else {
						buttons.push(
							new ButtonBuilder()
								.setCustomId(`MS:Reveal_${i}_${j}:${userId}`)
								.setLabel('?')
								.setStyle(ButtonStyle.Primary),
						)
					}
				}
			}

			if (gameOver) {
				buttons.push(
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setCustomId(`MS:PlayAgain:${userId}`)
							.setLabel('Play Again')
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId(`MS:Leave:${userId}`)
							.setLabel('Leave')
							.setStyle(ButtonStyle.Danger),
					),
				)
			}

			// Group buttons into rows of 5
			buttons = Array.from({ length: 5 }, (_, i) =>
				new ActionRowBuilder().addComponents(buttons.slice(i * 5, (i + 1) * 5)),
			)

			return buttons
		} catch (e) {
			console.log(`Error creating minesweeper actions: ${e}`)
		}
	}
}

export const actionHelper = new ActionHelper()
