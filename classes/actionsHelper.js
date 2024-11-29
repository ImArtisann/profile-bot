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
	static ButtonConfigs = {
		PLAY_AGAIN: (userId, gameType) => ({
			customId: `${gameType}:PlayAgain:${userId}`,
			label: 'Play Again',
			style: ButtonStyle.Primary,
		}),
		LEAVE: (userId, gameType) => ({
			customId: `${gameType}:Leave:${userId}`,
			label: 'Leave',
			style: ButtonStyle.Danger,
		}),
	}

	/**
	 * Creates a button using the provided configuration
	 * @param {Object} config - Button configuration object
	 * @returns {ButtonBuilder} The created button
	 */
	createButton(config) {
		return new ButtonBuilder()
			.setCustomId(config.customId)
			.setLabel(config.label)
			.setStyle(config.style)
			.setDisabled(config.disabled || false)
	}

	/**
	 * Creates an action row with the provided components
	 * @param {Array} components - Array of components to add to the row
	 * @returns {ActionRowBuilder} The created action row
	 */
	createActionRow(components) {
		return new ActionRowBuilder().addComponents(components)
	}

	/**
	 * Wraps async operations with error handling
	 * @param {Function} operation - The async operation to execute
	 * @param {string} errorMessage - Error message prefix
	 * @returns {Promise} Result of the operation
	 */
	async withErrorHandling(operation, errorMessage) {
		try {
			return await operation()
		} catch (e) {
			console.log(`${errorMessage}: ${e}`)
			return []
		}
	}

	/**
	 * Creates game over buttons common to multiple games
	 * @param {string} userId - The user ID
	 * @param {string} gameType - The type of game (e.g., 'BJ', 'HOL')
	 * @returns {Array<ActionRowBuilder>} Array of action rows with game over buttons
	 */
	createGameOverButtons(userId, gameType) {
		return [
			this.createActionRow([
				this.createButton(ActionHelper.ButtonConfigs.PLAY_AGAIN(userId, gameType)),
				this.createButton(ActionHelper.ButtonConfigs.LEAVE(userId, gameType)),
			]),
		]
	}

	/**
	 * Creates a set of action components (buttons and menus) for a room in a Discord server.
	 *
	 * @param {object} guild - The Discord guild the room belongs to.
	 * @param {string} roomId - The ID of the room.
	 * @returns {Promise<Array<import('discord.js').ActionRowBuilder>>} An array of action row builders containing the created components.
	 */
	async createRoomActions(guild, roomId) {
		return this.withErrorHandling(async () => {
			const room = await roomsActions.getRoom(guild, roomId)

			return [
				this.createActionRow([
					this.createButton({
						customId: `Room:Deposit:${roomId}`,
						label: 'Deposit',
						style: ButtonStyle.Primary,
					}),
				]),
				this.createActionRow([
					new UserSelectMenuBuilder()
						.setCustomId(`Room:Invite:${roomId}`)
						.setPlaceholder('Select a member')
						.setMaxValues(25),
				]),
				this.createActionRow([
					new StringSelectMenuBuilder()
						.setCustomId(`Room:Kick:${roomId}`)
						.setPlaceholder('Remove a member')
						.addOptions(
							room.members.map((userId) => ({
								label: guild.members.cache.get(userId).user.username,
								value: userId,
							})),
						)
						.setMaxValues(room.members.length || 1),
				]),
			]
		}, 'Error creating room actions')
	}

	/**
	 * Generates the action buttons for a BlackJack game based on the current game state.
	 *
	 * @param {string} userId - The ID of the user playing the game.
	 * @param {boolean} [gameOver=false] - Indicates whether the game is over.
	 * @param {boolean} [firstHand=false] - Indicates whether it's the first hand of the game.
	 * @returns {Promise<Array<import(discord.js).ActionRowBuilder>>} An array of action row builders containing the created components.
	 */
	createBlackJackActions(userId, gameOver = false, firstHand = false) {
		return this.withErrorHandling(() => {
			if (gameOver) {
				return this.createGameOverButtons(userId, 'BJ')
			}

			const buttons = [
				this.createActionRow([
					this.createButton({
						customId: `BJ:Hit:${userId}`,
						label: 'Hit',
						style: ButtonStyle.Primary,
					}),
					this.createButton({
						customId: `BJ:Stand:${userId}`,
						label: 'Stand',
						style: ButtonStyle.Primary,
					}),
				]),
			]

			if (firstHand) {
				buttons.push(
					this.createActionRow([
						this.createButton({
							customId: `BJ:DoubleDown:${userId}`,
							label: 'Double Down',
							style: ButtonStyle.Primary,
						}),
					]),
				)
			}

			return buttons
		}, 'Error creating BlackJack actions')
	}

	/**
	 * Generates the action buttons for a "Higher or Lower" (HoL) game based on the current game state.
	 *
	 * @param {string} userId - The ID of the user playing the game.
	 * @param {boolean} [gameOver=false] - Indicates whether the game is over.
	 * @returns {Promise<Array<import(discord.js).ActionRowBuilder>>} An array of action row builders containing the created components.
	 */
	createHoLActions(userId, gameOver = false) {
		return this.withErrorHandling(() => {
			if (gameOver) {
				return this.createGameOverButtons(userId, 'HOL')
			}

			return [
				this.createActionRow([
					this.createButton({
						customId: `HOL:Lower:${userId}`,
						label: 'Lower',
						style: ButtonStyle.Primary,
					}),
					this.createButton({
						customId: `HOL:Higher:${userId}`,
						label: 'Higher',
						style: ButtonStyle.Primary,
					}),
					this.createButton({
						customId: `HOL:Cash:${userId}`,
						label: 'Cash Out',
						style: ButtonStyle.Primary,
					}),
				]),
			]
		}, 'Error creating HoL actions')
	}

	/**
	 * Creates the action buttons for a Minesweeper game based on the current game state.
	 *
	 * @param {string} userId - The ID of the user playing the game.
	 * @param {string[]} revealed - An array of revealed tile positions in the format `"x_y"`.
	 * @param {string[]} mines - An array of mine positions in the format `"x_y"`.
	 * @param {boolean} [gameOver=false] - Indicates whether the game is over.
	 * @returns {Promise<Array<import(discord.js).ActionRowBuilder>>} An array of action row builders containing the Minesweeper buttons.
	 */
	createMineSweeperActions(userId, revealed, mines, gameOver = false) {
		return this.withErrorHandling(() => {
			const buttons = []

			for (let i = 0; i < 5; i++) {
				const rowButtons = []
				for (let j = 0; j < 5; j++) {
					const position = `${i}_${j}`
					const isRevealed = revealed.includes(position)
					const isMine = mines.includes(position)

					rowButtons.push(
						this.createButton({
							customId: `MS:Reveal_${i}_${j}:${userId}`,
							label: isRevealed ? (isMine ? '💣' : '✓') : '?',
							style: isRevealed
								? isMine
									? ButtonStyle.Danger
									: ButtonStyle.Secondary
								: ButtonStyle.Primary,
							disabled: isRevealed || gameOver,
						}),
					)
				}
				buttons.push(this.createActionRow(rowButtons))
			}

			return buttons
		}, 'Error creating minesweeper actions')
	}

	/**
	 * Creates the action buttons for a Race game based on the current game state.
	 *
	 * @param {string} userId - The ID of the user playing the game.
	 * @param {boolean} [gameOver=false] - Indicates whether the game is over.
	 * @returns {Promise<Array<import(discord.js).ActionRowBuilder>>} An array of action row builders containing the Race buttons.
	 */
	async createRaceActions(userId, gameOver = false) {
		return this.withErrorHandling(() => {
			if (gameOver) {
				return this.createGameOverButtons(userId, 'Race')
			}

			return [
				this.createActionRow(
					Array.from({ length: 4 }, (_, i) =>
						this.createButton({
							customId: `Race:Horse_${i + 1}:${userId}`,
							label: `Horse ${i + 1}`,
							style: ButtonStyle.Primary,
						}),
					),
				),
			]
		}, 'Error creating race actions')
	}

	/**
	 * Creates the action buttons for a Video Poker game based on the current game state.
	 *
	 * @param {string} userId - The ID of the user playing the game.
	 * @param {number[]} kept - An array of card indices that the user has chosen to keep.
	 * @param {boolean} [gameOver=false] - Indicates whether the game is over.
	 * @returns {Promise<Array<import(discord.js).ActionRowBuilder>>} An array of action row builders containing the Video Poker buttons.
	 */
	async createVideoPokerActions(userId, kept, gameOver = false) {
		return this.withErrorHandling(() => {
			if (gameOver) {
				return this.createGameOverButtons(userId, 'VP')
			}

			const buttons = Array.from({ length: 5 }, (_, i) =>
				this.createButton({
					customId: `VP:Keep_${i}:${userId}`,
					label: `Keep Card: ${i + 1}`,
					style: ButtonStyle.Primary,
					disabled: kept.includes(i + 1),
				}),
			)

			buttons.push(
				this.createButton({
					customId: `VP:Deal:${userId}`,
					label: 'Deal',
					style: ButtonStyle.Primary,
				}),
			)

			// Group buttons into rows of 5
			return Array.from({ length: Math.ceil(buttons.length / 5) }, (_, i) =>
				this.createActionRow(buttons.slice(i * 5, i + 5)),
			)
		}, 'Error creating video poker actions')
	}
}

export const actionHelper = new ActionHelper()
