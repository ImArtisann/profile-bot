import { fileURLToPath } from 'url'
import { dirname } from 'path'
import path from 'node:path'
import fs from 'fs'
import Canvas from '@napi-rs/canvas'
import { embedHelper } from '../classes/embedHelper.js'
import { actionHelper } from '../classes/actionsHelper.js'
import { userActions } from '../actions/userActions.js'
import { creatorWorker } from '../images/creator.js'
import { AttachmentBuilder, ChatInputCommandInteraction } from 'discord.js'
import { errorHandler } from './errorHandler.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const foldersPath = path.join(__dirname, './../images')

class BlackJackHandler {
	constructor() {
		this.table = path.join(foldersPath, '/blackjack_table/table.jpg')
		this.downCard = path.join(foldersPath, '/blackjack_table/card_back.png')
		this.cards = [...fs.readdirSync(path.join(foldersPath, '/playing_cards'))]
		this.decks = 4
		this.games = new Map()
	}

	async startGame(userId, bet, userEcon, interaction) {
		try {
			let gameDeck = []
			let gameState = {
				bet: Number(bet),
				userEcon: Number(userEcon),
				double: false,
			}
			for (let i = 0; i < this.cards.length; i++) {
				for (let j = 0; j < this.decks; j++) {
					gameDeck.push(this.cards[i])
				}
			}
			gameDeck = await this.shuffleDeck(gameDeck)
			const dealtCards = await this.dealCards(gameDeck)
			gameState = { ...gameState, ...dealtCards }

			const result = await this.callWorker(userId, 'blackjack', {
				gameState,
				dealerShow: false,
			})
			gameState.image = result.image

			// Set initial game state before getting image
			this.games.set(userId, gameState)

			await this.updateMessage(userId, interaction)
		} catch (e) {
			console.log(`Error starting blackjack game: ${e}`)
		}
	}
	/**
	 * Shuffles the provided deck of cards in-place using the Fisher-Yates shuffle algorithm.
	 * @param {string[]} deck - An array of card names representing the deck to be shuffled.
	 * @returns {string[]} The shuffled deck.
	 */
	async shuffleDeck(deck) {
		try {
			for (let i = deck.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1))
				;[deck[i], deck[j]] = [deck[j], deck[i]]
			}
			return deck
		} catch (e) {
			console.log(`Error shuffling deck: ${e}`)
		}
	}

	/**
	 * Deals the initial cards for a blackjack game.
	 * @param {string[]} deck - The deck of cards to deal from.
	 * @returns {Object} An object containing the player's hand, the dealer's hand, and the remaining deck.
	 */
	dealCards(deck) {
		try {
			const playerHand = []
			const dealerHand = []
			for (let i = 0; i < 2; i++) {
				playerHand.push(this.dealCard(deck))
				dealerHand.push(this.dealCard(deck))
			}
			return { playerHand: playerHand, dealerHand: dealerHand, deck: deck }
		} catch (e) {
			console.log(`Error dealing cards: ${e}`)
		}
	}

	/**
	 * Generates an image of the current state of a blackjack game.
	 * @param {Object} gameState - An object containing the current state of the game, including the player's hand, the dealer's hand, and the remaining deck.
	 * @param {boolean} [dealerShow=false] - Whether to show the dealer's full hand or just the upcard.
	 * @returns {Promise<{ buffer: Buffer, name: string }>} - An object containing the generated image buffer and the file name.
	 */
	async makeImage(gameState, dealerShow = false) {
		try {
			const canvas = Canvas.createCanvas(1200, 600)
			const ctx = canvas.getContext('2d')
			const background = await Canvas.loadImage(this.table)
			ctx.drawImage(background, 0, 0, canvas.width, canvas.height)

			if (this.checkForBlackJack(gameState.dealerHand)) {
				for (let i = 0; i < gameState.dealerHand.length; i++) {
					let card = await Canvas.loadImage(
						path.join(foldersPath, '/playing_cards', gameState.dealerHand[i]),
					)
					ctx.drawImage(card, 500 + i * 35, 100 - i * 22, 100, 150)
				}

				for (let i = 0; i < gameState.playerHand.length; i++) {
					let card = await Canvas.loadImage(
						path.join(foldersPath, '/playing_cards', gameState.playerHand[i]),
					)
					ctx.drawImage(card, 500 + i * 35, 400 - i * 22, 100, 150)
				}
			} else {
				if (!dealerShow) {
					const downCard = await Canvas.loadImage(this.downCard)
					ctx.drawImage(downCard, 500, 100, 100, 150)
					const dealerCard = await Canvas.loadImage(
						path.join(foldersPath, '/playing_cards', gameState.dealerHand[1]),
					)
					ctx.drawImage(dealerCard, 500 + 35, 100 - 22, 100, 150)
				} else {
					for (let i = 0; i < gameState.dealerHand.length; i++) {
						let card = await Canvas.loadImage(
							path.join(foldersPath, '/playing_cards', gameState.dealerHand[i]),
						)
						ctx.drawImage(card, 500 + i * 35, 100 - i * 22, 100, 150)
					}
				}
				for (let i = 0; i < gameState.playerHand.length; i++) {
					let card = await Canvas.loadImage(
						path.join(foldersPath, '/playing_cards', gameState.playerHand[i]),
					)
					ctx.drawImage(card, 500 + i * 35, 400 - i * 22, 100, 150)
				}
			}

			const buffer = canvas.toBuffer('image/png')
			return {
				buffer: buffer,
				name: 'blackJack.png',
			}
		} catch (e) {
			console.log(`Error making black jack image: ${e}`)
		}
	}

	/**
	 * Deals a card from the given deck.
	 * @param {Array} deck - The deck of cards to deal from.
	 * @returns {string} The dealt card.
	 */
	dealCard(deck) {
		try {
			return deck.pop()
		} catch (e) {
			console.log(`Error dealing cards: ${e}`)
		}
	}

	/**
	 * Calculates the value of a given playing card.
	 * @param {string} card - The card to calculate the value for, in the format 'value_suit' (e.g. 'ace_spades', 'king_hearts').
	 * @returns {number} The numeric value of the card, where face cards (Jack, Queen, King) are worth 10, and Aces are worth 11.
	 */
	getCardValue(card) {
		try {
			const cardValue = card.split('_')[0]
			if (cardValue === 'ace') return 11
			if (cardValue === 'jack' || cardValue === 'queen' || cardValue === 'king') return 10
			return parseInt(cardValue)
		} catch (e) {
			console.log(`Error getting card value: ${e}`)
		}
	}

	/**
	 * Calculates the value and number of aces in a given hand of playing cards.
	 * @param {string[]} hand - An array of playing card strings in the format 'value_suit' (e.g. 'ace_spades', 'king_hearts').
	 * @returns {object} An object with two properties: 'value' (the total numeric value of the hand) and 'aces' (the number of aces in the hand).
	 */
	getHandValue(hand) {
		try {
			let value = 0
			let aces = 0
			for (let i = 0; i < hand.length; i++) {
				if (this.checkForAce([hand[i]])) {
					aces++
				}
				value += this.getCardValue(hand[i])
			}
			return { value: value, aces: aces }
		} catch (e) {
			console.log(`Error getting hand value: ${e}`)
		}
	}

	/**
	 * Handles the "hit" action in a Blackjack game for the given user.
	 * @param {string} userId - The ID of the user playing the Blackjack game.
	 * @param {object} interaction - The Discord interaction object for the current game.
	 * @returns {Promise<void>} A Promise that resolves when the hit action is completed.
	 */
	async handleHit(userId, interaction) {
		try {
			let gameState = this.getGameState(userId)
			gameState.playerHand.push(this.dealCard(gameState.deck))

			const playerBust = this.checkForBust(gameState.playerHand)

			const result = await this.callWorker(userId, 'blackjack', {
				gameState,
				dealerShow: playerBust,
			})

			gameState.image = result.image
			this.games.set(userId, gameState)

			await this.updateMessage(userId, interaction, playerBust)
		} catch (e) {
			console.log(`Error handling hit: ${e}`)
		}
	}

	/**
	 * Handles the "stand" action in a Blackjack game for the given user.
	 * @param {string} userId - The ID of the user playing the Blackjack game.
	 * @param {object} interaction - The Discord interaction object for the current game.
	 * @returns {Promise<void>} A Promise that resolves when the stand action is completed.
	 */
	async handleStand(userId, interaction) {
		try {
			let gameState = this.getGameState(userId)

			const playerValue = this.getBestHandValue(gameState.playerHand)

			gameState = await this.dealerDraw(userId)
			const dealerValue = this.getBestHandValue(gameState.dealerHand)

			const result = await this.callWorker(userId, 'blackjack', {
				gameState,
				dealerShow: true,
			})

			gameState.image = result.image
			this.games.set(userId, gameState)

			const gameOver = dealerValue >= 17 || dealerValue > 21
			await this.updateMessage(userId, interaction, gameOver)
		} catch (e) {
			console.log(`Error handling stand: ${e}`)
		}
	}

	/**
	 * Handles the "double down" action in a Blackjack game for the given user.
	 * @param {string} userId - The ID of the user playing the Blackjack game.
	 * @param {object} interaction - The Discord interaction object for the current game.
	 * @returns {Promise<void>} A Promise that resolves when the double down action is completed.
	 */
	async handleDoubleDown(userId, interaction) {
		try {
			let gameState = this.getGameState(userId)
			if (gameState.userEcon < gameState.bet) {
				return interaction.reply({
					content: `You do not have enough money to double down.`,
					ephemeral: true,
				})
			}

			await userActions.updateUserEcon(interaction.guild.id, userId, gameState.bet, false)
			gameState.playerHand.push(this.dealCard(gameState.deck))
			gameState.double = true
			await this.dealerDraw(userId)

			const result = await this.callWorker(userId, 'blackjack', {
				gameState,
				dealerShow: true,
			})

			gameState.image = result.image
			this.games.set(userId, gameState)

			await this.updateMessage(userId, interaction, true)
		} catch (e) {
			console.log(`Error handling double: ${e}`)
		}
	}

	/**
	 * Handles the "play again" action in a Blackjack game for the given user.
	 * @param {string} userId - The ID of the user playing the Blackjack game.
	 * @param {object} interaction - The Discord interaction object for the current game.
	 * @returns {Promise<void>} A Promise that resolves when the play again action is completed.
	 */
	async handlePlayAgain(userId, interaction) {
		try {
			const userEcon = await userActions.getUserEcon(interaction.guild.id, userId)
			let oldGameState = this.getGameState(userId)
			const bet = oldGameState.bet

			if (userEcon < bet) {
				return interaction.reply({
					content: `You do not have enough money to play again.`,
					ephemeral: true,
				})
			}

			// Create new game state
			let gameDeck = []
			for (let i = 0; i < this.cards.length; i++) {
				for (let j = 0; j < this.decks; j++) {
					gameDeck.push(this.cards[i])
				}
			}
			gameDeck = await this.shuffleDeck(gameDeck)
			let gameState = this.dealCards(gameDeck)
			gameState.bet = bet
			gameState.userEcon = userEcon
			gameState.double = false

			await userActions.updateUserEcon(interaction.guild.id, userId, bet, false)

			const result = await this.callWorker(userId, 'blackjack', {
				gameState,
				dealerShow: false,
			})

			gameState.image = result.image
			this.games.set(userId, gameState)

			await this.updateMessage(userId, interaction)
		} catch (e) {
			console.log(`Error handling play again: ${e}`)
		}
	}

	/**
	 * Handles the "leave" action in a Blackjack game for the given user.
	 * @param {string} userId - The ID of the user playing the Blackjack game.
	 * @param {object} interaction - The Discord interaction object for the current game.
	 * @returns {Promise<void>} A Promise that resolves when the leave action is completed.
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
			console.log(`Error handling leave: ${e}`)
		}
	}

	/**
	 * Calls a worker with the specified action and data, and returns a Promise that resolves with the worker's response or rejects with an error.
	 * @param {string} userId - The ID of the user for whom the worker is being called.
	 * @param {string} action - The action to be performed by the worker.
	 * @param {object} data - The data to be passed to the worker.
	 * @param {number} [timeout=10000] - The timeout in milliseconds for the worker to respond.
	 * @returns {Promise<object>} - A Promise that resolves with the worker's response or rejects with an error.
	 */
	async callWorker(userId, action, data, timeout = 10000) {
		try {
			return new Promise((resolve, reject) => {
				const timeoutId = setTimeout(() => {
					reject(new Error('Worker timeout'))
				}, timeout)

				const handler = (response) => {
					if (response.type === action) {
						clearTimeout(timeoutId)
						creatorWorker.removeListener('message', handler)
						resolve(response)
					} else if (response.type === `${action}:error`) {
						clearTimeout(timeoutId)
						creatorWorker.removeListener('message', handler)
						reject(new Error(response.error))
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
			console.log(`Error handling BJ worker: ${e}`)
		}
	}

	/**
	 * Updates the message with the current game state and actions for the user.
	 * @param {string} userId - The ID of the user playing the game.
	 * @param {Object} interaction - The Discord interaction object.
	 * @param {boolean} [gameOver=null] - Indicates whether the game is over.
	 * @returns {Promise<void>} - Resolves when the message has been updated.
	 */
	async updateMessage(userId, interaction, gameOver = null) {
		try {
			let gameState = this.getGameState(userId)

			let isGameOver = gameOver
			if (gameOver === null) {
				isGameOver = this.checkForGameEnd(gameState)
				if (isGameOver) {
					gameState = await this.checkUserWin(userId, gameState, interaction)
					this.games.set(userId, gameState)
				}
			} else {
				gameState = await this.checkUserWin(userId, gameState, interaction)
				this.games.set(userId, gameState)
			}

			// Create embed and actions
			const embed = await embedHelper.blackJack(
				userId,
				gameState.userEcon,
				gameState,
				isGameOver,
			)
			const actions = await actionHelper.createBlackJackActions(
				userId,
				isGameOver,
				gameState.playerHand.length === 2,
			)

			const attachment = new AttachmentBuilder(Buffer.from(gameState.image.buffer), {
				name: 'blackJack.png',
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
			console.log(`Error handling BJ update message: ${e}`)
		}
	}
	/**
	 * Checks if the game has ended based on the current game state.
	 *
	 * The game should end if:
	 * 1. The player has busted (their hand value is greater than 21)
	 * 2. The dealer has busted (their hand value is greater than 21)
	 * 3. Either the player or the dealer has blackjack
	 * 4. The dealer has reached a final value of 17 or greater after standing
	 *
	 * @param {Object} gameState - The current game state object.
	 * @returns {boolean} - `true` if the game has ended, `false` otherwise.
	 */
	checkForGameEnd(gameState) {
		try {
			const playerValue = this.getBestHandValue(gameState.playerHand)
			const dealerValue = this.getBestHandValue(gameState.dealerHand)

			const gameOver =
				playerValue > 21 ||
				dealerValue > 21 ||
				this.checkForBlackJack(gameState.playerHand) ||
				this.checkForBlackJack(gameState.dealerHand) ||
				(dealerValue >= 17 && gameState.dealerHand.length > 2)

			if (gameOver) {
				console.log('Game Over:', {
					playerValue,
					dealerValue,
					playerBust: playerValue > 21,
					dealerBust: dealerValue > 21,
					playerBlackjack: this.checkForBlackJack(gameState.playerHand),
					dealerBlackjack: this.checkForBlackJack(gameState.dealerHand),
				})
			}

			return gameOver
		} catch (e) {
			console.log(`Error handling BJ check game end: ${e}`)
		}
	}

	/**
	 * Checks if the user has won the current Blackjack game based on the game state.
	 *
	 * The function determines the winner by comparing the player's and dealer's hand values, considering factors such as
	 * busts, blackjacks, and the final dealer value.
	 *
	 * @param {string} userId - The ID of the user playing the game.
	 * @param {Object} gameState - The current game state object.
	 * @param {Object} interaction - The Discord interaction object.
	 * @returns {Object} - The updated game state object.
	 */
	async checkUserWin(userId, gameState, interaction) {
		try {
			let win = false
			const playerValue = this.getBestHandValue(gameState.playerHand)
			const dealerValue = this.getBestHandValue(gameState.dealerHand)

			// Log values for debugging
			console.log('Player Value:', playerValue)
			console.log('Dealer Value:', dealerValue)

			if (this.checkForBust(gameState.playerHand)) {
				win = false
			} else if (this.checkForBust(gameState.dealerHand)) {
				win = true
			} else if (
				this.checkForBlackJack(gameState.playerHand) &&
				!this.checkForBlackJack(gameState.dealerHand)
			) {
				win = true
			} else if (
				!this.checkForBlackJack(gameState.playerHand) &&
				this.checkForBlackJack(gameState.dealerHand)
			) {
				win = false
			} else if (dealerValue < 17) {
				return gameState
			} else {
				if (playerValue > dealerValue) {
					win = true
				} else if (playerValue < dealerValue) {
					win = false
				} else {
					await userActions.updateUserEcon(
						interaction.guild.id,
						userId,
						gameState.bet,
						true,
					)
					gameState.userEcon += gameState.bet
					return gameState
				}
			}

			if (win) {
				const winAmount = gameState.double ? gameState.bet * 4 : gameState.bet * 2
				await userActions.updateUserEcon(interaction.guild.id, userId, winAmount, true)
				gameState.userEcon += winAmount
			}

			return gameState
		} catch (e) {
			console.log(`Error handling BJ check user win: ${e}`)
		}
	}

	/**
	 * Calculates the best hand value for the given hand of cards in a Blackjack game.
	 * The function adjusts the value of Aces to keep the hand value under 21.
	 * @param {string[]} hand - The hand of cards to calculate the best value for.
	 * @returns {number} The best hand value for the given hand.
	 */
	getBestHandValue(hand) {
		try {
			const handValue = this.getHandValue(hand)
			let value = handValue.value
			let aces = handValue.aces

			// Keep adjusting aces while value is over 21
			while (value > 21 && aces > 0) {
				value -= 10
				aces--
			}

			return value
		} catch (e) {
			console.log(`Error handling BJ get best hand value: ${e}`)
		}
	}

	/**
	 * Handles the dealer's draw logic in a Blackjack game.
	 * The dealer must draw on 16 and stand on 17.
	 * @param {string} userId - The ID of the user playing the game.
	 * @returns {object} The updated game state after the dealer has drawn.
	 */
	dealerDraw(userId) {
		try {
			let gameState = this.getGameState(userId)
			let currentValue = this.getBestHandValue(gameState.dealerHand)

			// Dealer must draw on 16 and stand on 17
			while (currentValue < 17) {
				gameState.dealerHand.push(this.dealCard(gameState.deck))
				currentValue = this.getBestHandValue(gameState.dealerHand)
			}

			this.games.set(userId, gameState)
			return gameState
		} catch (e) {
			console.log(`Error handling dealer draw: ${e}`)
		}
	}

	/**
	 * Retrieves the current game state for the specified user.
	 * @param {string} userId - The ID of the user playing the game.
	 * @returns {object} The current game state for the specified user.
	 */
	getGameState(userId) {
		return this.games.get(userId)
	}

	/**
	 * Deletes the game state for the specified user.
	 * @param {string} userId - The ID of the user whose game state should be deleted.
	 */
	deleteGame(userId) {
		this.games.delete(userId)
	}

	/**
	 * Checks if the specified user has an active game.
	 * @param {string} userId - The ID of the user to check.
	 * @returns {Promise<boolean>} True if the user has an active game, false otherwise.
	 */
	async userHasGame(userId) {
		return this.games.has(userId)
	}

	/**
	 * Checks if the given hand contains an Ace card.
	 * @param {string[]} hand - The hand of cards to check.
	 * @returns {boolean} True if the hand contains an Ace, false otherwise.
	 */
	checkForAce(hand) {
		try {
			for (let i = 0; i < hand.length; i++) {
				if (hand[i].split('_')[0] === 'ace') return true
			}
			return false
		} catch (e) {
			console.log(`Error handling check for ace: ${e}`)
		}
	}

	/**
	 * Checks if the given hand of cards is a bust (i.e., the total value of the hand exceeds 21).
	 * @param {string[]} hand - The hand of cards to check.
	 * @returns {boolean} True if the hand is a bust, false otherwise.
	 */
	checkForBust(hand) {
		return this.getBestHandValue(hand) > 21
	}

	/**
	 * Checks if the given hand of cards is a Blackjack (i.e., the total value of the hand is 21).
	 * @param {string[]} hand - The hand of cards to check.
	 * @returns {boolean} True if the hand is a Blackjack, false otherwise.
	 */
	checkForBlackJack(hand) {
		return this.getHandValue(hand).value === 21
	}
}

export const blackJack = new BlackJackHandler()
