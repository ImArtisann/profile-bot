import { ChatInputCommandInteraction } from 'discord.js'
import { embedHelper } from '../classes/embedHelper.js'
import { actionHelper } from '../classes/actionsHelper.js'
import { userActions } from '../actions/userActions.js'

class MineSweeperHandler {
	constructor() {
		this.games = new Map()
	}

	/**
	 * Starts a new Minesweeper game for the given user.
	 *
	 * @param {string} userId - The ID of the user starting the game.
	 * @param {number} bet - The amount the user is betting on the game.
	 * @param {number} userEcon - The user's current economic status.
	 * @param {number} mode - The difficulty mode of the game (number of mines).
	 * @param {object} interaction - The interaction object associated with the game start.
	 * @returns {Promise<void>} - A Promise that resolves when the game is started.
	 */
	async startGame(userId, bet, userEcon, mode, interaction) {
		try {
			let gameState = {
				bet: Number(bet),
				userEcon: Number(userEcon),
				mode: mode,
				board: [],
				revealed: [],
				mines: [],
				reward: 0,
				gameOver: false,
			}
			gameState.mines = await this.randomizeMines(mode)
			this.games.set(userId, gameState)
			await this.updateMessage(userId, interaction)
		} catch (e) {
			console.log(`Error in minesweeper start game: ${e}`)
		}
	}

	/**
	 * Generates a list of mine locations for a Minesweeper game.
	 *
	 * @param {number} mode - The number of mines to place on the board.
	 * @returns {Promise<string[]>} - An array of strings representing the row and column coordinates of the mines.
	 */
	async randomizeMines(mode) {
		try {
			let mines = []
			for (let i = 0; i < mode; i++) {
				let row = Math.floor(Math.random() * 5)
				let column = Math.floor(Math.random() * 5)
				while (mines.includes(`${row}_${column}`)) {
					row = Math.floor(Math.random() * 5)
					column = Math.floor(Math.random() * 5)
				}
				mines.push(`${row}_${column}`)
			}
			return mines
		} catch (e) {
			console.log(`Error in minesweeper randomize mines: ${e}`)
		}
	}

	async handleReveal(userId, choice, interaction) {
		try {
			let gameState = this.games.get(userId)
			gameState.revealed.push(choice)
			if (gameState.mines.includes(choice)) {
				gameState.gameOver = true
			} else {
				gameState.reward += 1
			}
			await this.updateMessage(userId, interaction)
		} catch (e) {
			console.log(`Error in minesweeper handleReveal: ${e}`)
		}
	}

	async handleCashOut(userId, interaction) {
		try {
			let gameState = this.games.get(userId)
			if (!gameState.gameOver) {
				gameState.gameOver = true
				let payout =
					(gameState.mines.length / 15) *
					gameState.reward *
					((5 + gameState.reward) * (gameState.mode / 25))
				gameState.userEcon += gameState.bet * payout
				await userActions.updateUserEcon(
					interaction.guild.id,
					userId,
					Math.round(Number(gameState.bet + gameState.bet * payout)),
					true,
				)
				this.games.delete(userId)
				await gameState.message.delete({})
				await interaction.editReply({
					content: `You have cashed out your earnings winning ${Math.round(gameState.bet + gameState.bet * payout)}`,
					ephemeral: true,
				})
			} else {
				await interaction.reply({
					content: `You cant cash out you lost to start a new game either use /minesweeper leave or /minesweeper play`,
				})
			}
		} catch (e) {
			console.log(`Error in minesweeper handleCashOut: ${e}`)
		}
	}

	async userHasGame(userId) {
		try {
			return this.games.has(userId)
		} catch (e) {
			console.log(`Error in minesweeper userHasGame: ${e}`)
		}
	}

	async updateMessage(userId, interaction) {
		try {
			let gameState = this.games.get(userId)

			const embed = await embedHelper.mineSweeper(userId, gameState.userEcon, gameState)
			const actions = actionHelper.createMineSweeperActions(
				userId,
				gameState.revealed,
				gameState.mines,
				gameState.gameOver,
			)

			const message = {
				embeds: [embed],
				components: actions,
			}

			if (interaction instanceof ChatInputCommandInteraction) {
				gameState.message = await interaction.editReply(message)
				this.games.set(userId, gameState)
			} else {
				await interaction.message.edit(message)
			}
			if (gameState.gameOver) {
				setTimeout(() => {
					this.games.delete(userId)
					interaction.message.delete()
				}, 5000)
			}
		} catch (e) {
			console.log(`Error in minesweeper updateMessage: ${e}`)
		}
	}
}

export const mineSweeper = new MineSweeperHandler()
