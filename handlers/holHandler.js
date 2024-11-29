import fs from 'fs'
import path from 'node:path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import Canvas from '@napi-rs/canvas'
import { errorHandler } from './errorHandler.js'
import { embedHelper } from '../classes/embedHelper.js'
import { actionHelper } from '../classes/actionsHelper.js'
import { AttachmentBuilder, ChatInputCommandInteraction } from 'discord.js'
import { creatorWorker } from '../images/creator.js'
import { userActions } from '../actions/userActions.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const foldersPath = path.join(__dirname, './../images')

class HighOrLower {
	constructor() {
		this.cards = [...fs.readdirSync(path.join(foldersPath, '/playing_cards'))]
		this.table = path.join(foldersPath, '/blackjack_table/table.jpg')
		this.decks = 4
		this.games = new Map()
	}

	/**
	 * Starts a new game of High or Lower for the specified user.
	 *
	 * @param {string} userId - The ID of the user starting the game.
	 * @param {number} bet - The amount the user is betting on the game.
	 * @param {object} userEcon - The current economic state of the user.
	 * @param {object} interaction - The Discord interaction object.
	 * @returns {Promise<void>} A Promise that resolves when the game has been started and the message updated.
	 */
	async startGame(userId, bet, userEcon, interaction) {
		try {
			let gameDeck = []
			let gameState = {}
			for (let i = 0; i < this.cards.length; i++) {
				for (let j = 0; j < this.decks; j++) {
					gameDeck.push(this.cards[i])
				}
			}
			gameDeck = await this.shuffleDeck(gameDeck)
			gameState.userEcon = userEcon
			gameState.bet = bet
			gameState.previousCard = gameDeck.pop()
			gameState.deck = gameDeck
			gameState.card = gameState.previousCard
			gameState.reward = 1
			gameState.choice = null
			gameState.percent = this.calculatePercentage(gameState.card, gameDeck)
			const result = await this.callWorker(userId, 'hol', {
				gameState,
			})
			gameState.image = result.image
			this.games.set(userId, gameState)
			await this.updateMessage(userId, interaction)
		} catch (e) {
			console.log(`Error handling start game HoL: ${e}`)
		}
	}

	/**
	 * Shuffles the provided deck of playing cards.
	 *
	 * @param {string[]} deck - An array of playing card strings in the format "value_suit".
	 * @returns {Promise<string[]>} The shuffled deck of playing cards.
	 */
	async shuffleDeck(deck) {
		try {
			for (let i = deck.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1))
				;[deck[i], deck[j]] = [deck[j], deck[i]]
			}
			return deck
		} catch (e) {
			console.log(`Error handling shuffleDeck HoL: ${e}`)
		}
	}

	/**
	 * Calculates the numeric value of a playing card based on its string representation.
	 *
	 * @param {string} card - The string representation of the playing card, in the format "value_suit".
	 * @returns {number} The numeric value of the playing card.
	 */
	getCardValue(card) {
		try {
			const value = card.split('_')[0]
			const valueMap = {
				10: 10,
				jack: 11,
				queen: 12,
				king: 13,
				ace: 1,
			}
			return valueMap[value] || parseInt(value)
		} catch (e) {
			console.log(`Error handling getCardValue HoL: ${e}`)
		}
	}

	/**
	 * Generates an image of the current game state, including the background and the player's card.
	 *
	 * @param {object} gameState - The current state of the game.
	 * @returns {Promise<Buffer>} A Promise that resolves to a Buffer containing the generated image.
	 */
	async makeImage(gameState) {
		try {
			const canvas = Canvas.createCanvas(1200, 600)
			const ctx = canvas.getContext('2d')
			const background = await Canvas.loadImage(this.table)
			ctx.drawImage(background, 0, 0, canvas.width, canvas.height)

			let card = await Canvas.loadImage(
				path.join(foldersPath, '/playing_cards', gameState.card),
			)
			ctx.drawImage(card, 450, 75, 300, 450)
			const buffer = canvas.toBuffer('image/png')
			return {
				buffer: buffer,
				name: 'blackJack.png',
			}
		} catch (e) {
			console.log(`Error handling makeImage HoL: ${e}`)
		}
	}

	/**
	 * Handles the user's request to hit in the game.
	 *
	 * @param {string} userId - The ID of the user who is hitting.
	 * @param {object} interaction - The Discord interaction object.
	 * @param {string} choice - The user's choice to hit.
	 * @returns {Promise<void>} A Promise that resolves when the game state has been updated and the message has been updated.
	 */
	async handleHit(userId, interaction, choice) {
		try {
			let gameState = this.games.get(userId)
			gameState.previousCard = gameState.card
			gameState.card = gameState.deck.pop()
			gameState.choice = choice
			gameState.percent = this.calculatePercentage(gameState.card, gameState.deck)

			const result = await this.callWorker(userId, 'hol', {
				gameState,
			})

			gameState.image = result.image
			this.games.set(userId, gameState)
			await this.updateMessage(userId, interaction)
		} catch (e) {
			console.log(`Error handling handle hit HoL: ${e}`)
		}
	}

	/**
	 * Handles the user cashing out their winnings from the game.
	 *
	 * @param {string} userId - The ID of the user who is cashing out.
	 * @param {object} interaction - The Discord interaction object.
	 * @returns {Promise<void>} A Promise that resolves when the user has been paid their winnings and the message has been updated.
	 */
	async handleCashOut(userId, interaction) {
		try {
			await this.payUserWin(interaction.guild.id, userId)
			await this.updateMessage(userId, interaction, true)
		} catch (e) {
			console.log(`Error handling handle cash out HoL: ${e}`)
		}
	}

	/**
	 * Handles the user requesting to play the game again by updating the message with the current game state.
	 *
	 * @param {string} userId - The ID of the user who is requesting to play again.
	 * @param {object} interaction - The Discord interaction object.
	 * @returns {Promise<void>} A Promise that resolves when the message has been updated.
	 */
	async handlePlayAgain(userId, interaction) {
		try {
			let userEcon = await userActions.getUserEcon(interaction.guild.id, userId)
			let gameState = this.games.get(userId)
			if (userEcon < gameState.bet) {
				await interaction.reply({
					content: `You don't have enough money to play again!`,
					ephemeral: true,
				})
				return
			}
			await userActions.updateUserEcon(interaction.guild.id, userId, gameState.bet, false)
			await this.startGame(userId, gameState.bet, userEcon - gameState.bet, interaction)
		} catch (e) {
			console.log(`Error handling playAgain HoL: ${e}`)
		}
	}

	/**
	 * Handles the user leaving the game by deleting their game state and the interaction message.
	 *
	 * @param {string} userId - The ID of the user who is leaving the game.
	 * @param {object} interaction - The Discord interaction object.
	 * @returns {Promise<void>} A Promise that resolves when the game state has been deleted and the message has been deleted.
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
			console.log(`Error handling leave HoL: ${e}`)
		}
	}

	/**
	 * Updates the message with the current game state for the user.
	 *
	 * @param {string} userId - The ID of the user whose game state is being updated.
	 * @param {object} interaction - The Discord interaction object.
	 * @param {boolean} [gameOver=null] - Indicates whether the game is over. If null, the function will check if the user has lost.
	 * @returns {Promise<void>} A Promise that resolves when the message has been updated.
	 */
	async updateMessage(userId, interaction, gameOver = null) {
		try {
			let gameState = this.games.get(userId)

			let isGameOver = false
			if (gameOver === null) {
				if (this.checkUserLose(userId)) {
					isGameOver = true
				} else {
					this.updateReward(userId)
				}
			} else {
				isGameOver = gameOver
			}

			if (!isGameOver) {
				gameState.streak = 0
			}

			const embed = await embedHelper.highOrLow(
				userId,
				gameState.userEcon,
				gameState,
				isGameOver,
			)

			const actions = await actionHelper.createHoLActions(userId, isGameOver)

			const attachment = new AttachmentBuilder(Buffer.from(gameState.image.buffer), {
				name: 'hol.png',
			})

			const messageOptions = {
				embeds: [embed],
				files: [attachment],
				components: actions,
			}

			if (interaction instanceof ChatInputCommandInteraction) {
				await interaction.editReply(messageOptions)
			} else {
				await interaction.message.edit(messageOptions)
			}
		} catch (e) {
			console.log(`Error handling update message hoL: ${e}`)
		}
	}

	/**
	 * Calls a worker with the given action and data, and returns a Promise that resolves with the worker's response or rejects with an error.
	 *
	 * @param {string} userId - The ID of the user associated with the worker call.
	 * @param {string} action - The action to be performed by the worker.
	 * @param {object} data - The data to be passed to the worker.
	 * @param {number} [timeout=10000] - The timeout in milliseconds for the worker call.
	 * @returns {Promise<object>} A Promise that resolves with the worker's response or rejects with an error.
	 */
	async callWorker(userId, action, data, timeout = 10000) {
		try {
			return new Promise((resolve, reject) => {
				const timeoutId = setTimeout(() => {
					reject(new Error('Worker timed out'))
				}, timeout)

				const handler = (response) => {
					if (response.type === action) {
						clearTimeout(timeoutId)
						creatorWorker.removeListener('message', handler)
						resolve(response)
					} else if (response.type === `${action}:error`) {
						clearTimeout(timeoutId)
						creatorWorker.removeListener('message', handler)
						reject(new Error(response.message))
					}
				}

				creatorWorker.on('message', handler)

				creatorWorker.postMessage({
					data: {
						...data,
						type: action,
						userId,
					},
				})
			})
		} catch (e) {
			console.log(`Error calling worker HoL: ${e}`)
		}
	}

	/**
	 * Calculates the percentage of cards in the deck that are higher or lower than the current card.
	 *
	 * @param {string} card - The current card being compared.
	 * @param {array} deck - The remaining cards in the deck.
	 * @returns {object} An object containing the percentage for the 'higher' and 'lower' choices.
	 */
	calculatePercentage(card, deck) {
		try {
			const currentValue = this.getCardValue(card)
			const remainingCards = deck.length

			const higherCards = deck.filter((c) => this.getCardValue(c) > currentValue).length
			const lowerCards = deck.filter((c) => this.getCardValue(c) < currentValue).length

			// Calculate true percentages based on remaining cards
			const higher = Math.floor((higherCards / remainingCards) * 100)
			const lower = Math.floor((lowerCards / remainingCards) * 100)

			return { higher, lower }
		} catch (e) {
			console.log(`Error handling calculate percentage HoL: ${e}`)
			return { higher: 50, lower: 50 }
		}
	}

	/**
	 * Updates the user's reward based on their choice of 'higher' or 'lower'.
	 *
	 * @param {string} userId - The ID of the user whose reward is being updated.
	 */
	updateReward(userId) {
		try {
			let gameState = this.games.get(userId)
			const prevReward = gameState.reward || 1

			if (gameState.choice === 'higher') {
				const multiplier = (100 - gameState.percent.higher) / 100 / 2
				gameState.reward = prevReward + multiplier
			} else if (gameState.choice === 'lower') {
				const multiplier = (100 - gameState.percent.lower) / 100 / 2
				gameState.reward = prevReward + multiplier
			}

			this.games.set(userId, gameState)
		} catch (e) {
			console.log(`Error handling update reward HoL: ${e}`)
		}
	}

	/**
	 * Checks if the user has lost the game based on their choice and the current and previous card values.
	 *
	 * @param {string} userId - The ID of the user whose game state is being checked.
	 * @returns {boolean} True if the user has lost the game, false otherwise.
	 */
	checkUserLose(userId) {
		try {
			const gameState = this.games.get(userId)
			if (!gameState || !gameState.choice) return false

			const prevValue = this.getCardValue(gameState.previousCard)
			const currentValue = this.getCardValue(gameState.card)
			console.log(
				`prevValue: ${prevValue}, currentValue: ${currentValue}, choice: ${gameState.choice}`,
			)

			if (gameState.choice === 'higher') {
				return currentValue < prevValue
			} else if (gameState.choice === 'lower') {
				return currentValue > prevValue
			}
			return false
		} catch (e) {
			console.log(`Error handling checkUserLose: ${e}`)
			return false
		}
	}

	/**
	 * Pays the user their winnings based on their game state.
	 *
	 * @param {string} guildId - The ID of the guild the user is playing in.
	 * @param {string} userId - The ID of the user being paid.
	 * @returns {Promise<void>} A Promise that resolves when the user's economy has been updated.
	 */
	async payUserWin(guildId, userId) {
		try {
			let gameState = this.games.get(userId)
			const reward = Math.round(
				Number(gameState.bet * (gameState.reward?.toFixed(2) || 1)),
			)
			await userActions.updateUserEcon(guildId, userId, reward, true)
		} catch (e) {
			console.log(`Error handling pay user win HoL: ${e}`)
		}
	}

	/**
	 * Checks if the user has an active game.
	 *
	 * @param {string} userId - The ID of the user to check.
	 * @returns {Promise<boolean>} True if the user has an active game, false otherwise.
	 */
	async userHasGame(userId) {
		return this.games.has(userId)
	}
}

export const highOrLower = new HighOrLower()
