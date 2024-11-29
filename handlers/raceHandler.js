import { ChatInputCommandInteraction } from 'discord.js'
import { embedHelper } from '../classes/embedHelper.js'
import { actionHelper } from '../classes/actionsHelper.js'
import { userActions } from '../actions/userActions.js'

class RaceHandler {
	constructor() {
		this.games = new Map()
	}

	/**
	 * Starts a new game for the specified user.
	 * @param {string} userId - The ID of the user starting the game.
	 * @param {number} bet - The bet amount for the game.
	 * @param {number} userEcon - The user's current economic status.
	 * @param {object} interaction - The interaction object associated with the game.
	 * @returns {void}
	 */
	async startGame(userId, bet, userEcon, interaction) {
		try {
			let gameState = {
				bet: Number(bet),
				userEcon: Number(userEcon),
				gameOver: false,
				choice: 0,
				horse1: 0,
				horse2: 0,
				horse3: 0,
				horse4: 0,
			}
			this.games.set(userId, gameState)
			await this.updateMessage(userId, interaction)
		} catch (e) {
			console.log(`Error in race start game: ${e}`)
		}
	}

	/**
	 * Checks if the specified user has an active game.
	 * @param {string} userId - The ID of the user to check.
	 * @returns {Promise<boolean>} - True if the user has an active game, false otherwise.
	 */
	async userHasGame(userId) {
		try {
			return this.games.has(userId)
		} catch (e) {
			console.log(`Error in race userHasGame: ${e}`)
		}
	}

	/**
	 * Handles the user's choice in the race game.
	 * @param {string} userId - The ID of the user making the choice.
	 * @param {number} choice - The choice made by the user.
	 * @param {object} interaction - The interaction object associated with the game.
	 * @returns {void}
	 */
	async handleChoice(userId, choice, interaction) {
		try {
			let gameState = this.games.get(userId)
			gameState.choice = choice
			this.games.set(userId, gameState)
			await this.emulateRace(userId, interaction)
		} catch (e) {
			console.log(`Error in race handle choice: ${e}`)
		}
	}

	/**
	 * Handles the user's request to play the race game again.
	 * @param {string} userId - The ID of the user requesting to play again.
	 * @param {object} interaction - The interaction object associated with the new game.
	 * @returns {void}
	 */
	async handlePlayAgain(userId, interaction) {
		try {
			let gameState = this.games.get(userId)
			gameState.gameOver = false
			gameState.choice = 0
			await this.startGame(userId, gameState.bet, gameState.userEcon, interaction)
		} catch (e) {
			console.log(`Error in race handlePlayAgain: ${e}`)
		}
	}

	/**
	 * Handles the user's request to leave the race game.
	 * @param {string} userId - The ID of the user requesting to leave.
	 * @param {object} interaction - The interaction object associated with the game.
	 * @returns {void}
	 */
	async handleLeave(userId, interaction) {
		try {
			this.games.delete(userId)
			if (interaction instanceof ChatInputCommandInteraction) {
				await interaction.editReply({
					content: `You have left the game.`,
					ephemeral: true,
				})
			} else {
				await interaction.message.delete()
			}
		} catch (e) {
			console.log(`Error in race handleLeave: ${e}`)
		}
	}

	async emulateRace(userId, interaction) {
		try {
			let gameState = this.games.get(userId)
			let gameOver = false
			while (!gameOver) {
				let randomNumber = this.generateRandomNumber()
				if (randomNumber === 1) {
					gameState.horse1 += 1
				} else if (randomNumber === 2) {
					gameState.horse2 += 1
				} else if (randomNumber === 3) {
					gameState.horse3 += 1
				} else if (randomNumber === 4) {
					gameState.horse4 += 1
				}
				if (
					gameState.horse1 >= 10 ||
					gameState.horse2 >= 10 ||
					gameState.horse3 >= 10 ||
					gameState.horse4 >= 10
				) {
					gameOver = true
				} else {
					let embed = embedHelper.race(userId, gameState.userEcon, gameState)
					await interaction.editReply({
						embeds: [embed],
						components: [],
					})
					await new Promise((resolve) => setTimeout(resolve, 300))
				}
			}
			gameState.gameOver = true
			this.games.set(userId, gameState)
			await this.updateMessage(userId, interaction)
		} catch (e) {
			console.log(`Error in race emulateRace: ${e}`)
		}
	}

	/**
	 * Generates a random number between 1 and 4 (inclusive).
	 * @returns {number} - A random number between 1 and 4.
	 */
	generateRandomNumber() {
		try {
			return Math.floor(Math.random() * 4) + 1
		} catch (e) {
			console.log(`Error in race generateRandomNumber: ${e}`)
		}
	}

	async updateMessage(userId, interaction) {
		try {
			const gameState = this.games.get(userId)
			const embed = embedHelper.race(userId, gameState.userEcon, gameState)
			const actions = await actionHelper.createRaceActions(userId, gameState.gameOver)
			const messageOptions = {
				embeds: [embed],
				components: actions,
			}
			if (gameState.gameOver) {
				const winningHorse = Object.entries(gameState).find(
					([key, value]) => value === 10 && key !== 'bet',
				)[0]
				if (winningHorse === gameState.choice) {
					this.payUserWin(interaction.guild.id, userId, gameState.bet)
				}
			}

			if (interaction instanceof ChatInputCommandInteraction) {
				await interaction.editReply(messageOptions)
			} else {
				await interaction.message.edit(messageOptions)
			}
		} catch (e) {
			console.log(`Error in race updateMessage: ${e}`)
		}
	}

	/**
	 * Checks if the game is over for the specified user.
	 * @param {string} userId - The ID of the user to check.
	 * @returns {boolean} - True if the game is over, false otherwise.
	 */
	async checkGameOver(userId) {
		try {
			const gameState = this.games.get(userId)
			for (const [key, value] of Object.entries(gameState)) {
				if (key.includes('horse')) {
					if (value === 10) {
						return true
					}
				}
			}
			return false
		} catch (e) {
			console.log(`Error in race checkGameOver: ${e}`)
		}
	}

	/**
	 * Checks if the user has won the race game.
	 * @param {string} userId - The ID of the user to check.
	 * @param {object} interaction - The interaction object associated with the game.
	 * @returns {void}
	 */
	async checkWin(userId, interaction) {
		try {
		} catch (e) {
			console.log(`Error in race checkWin: ${e}`)
		}
	}

	/**
	 * Pays the user for winning the race game.
	 * @param {string} guildId - The ID of the guild the user is in.
	 * @param {string} userId - The ID of the user who won the game.
	 * @param {number} bet - The bet amount for the game.
	 * @returns {void}
	 */
	async payUserWin(guildId, userId, bet) {
		try {
			await userActions.updateUserEcon(guildId, userId, bet * 4, true)
		} catch (e) {
			console.log(`Error in race payUserWin: ${e}`)
		}
	}
}

export const raceHandler = new RaceHandler()
