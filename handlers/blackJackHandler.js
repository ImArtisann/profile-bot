import { fileURLToPath } from 'url'
import { dirname } from 'path'
import path from 'node:path'
import fs from 'fs'
import Canvas from '@napi-rs/canvas'
import { embedHelper } from '../classes/embedHelper.js'
import { actionHelper } from '../classes/actionsHelper.js'
import { userActions } from '../actions/userActions.js'
import { creatorWorker } from '../images/creator.js'
import { AttachmentBuilder } from 'discord.js'

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

			const result = await this.callWorker(userId, 'blackjack', {
				gameState,
				dealerShow: false,
			})
			gameState.image = result.image

			// Set initial game state before getting image
			this.games.set(userId, gameState)

			await this.updateMessage(userId, interaction)
		} catch (error) {
			console.error('Error starting game:', error)
			throw error
		}
	}

	async shuffleDeck(deck) {
		for (let i = deck.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[deck[i], deck[j]] = [deck[j], deck[i]]
		}
		return deck
	}

	dealCards(deck) {
		const playerHand = []
		const dealerHand = []
		for (let i = 0; i < 2; i++) {
			playerHand.push(this.dealCard(deck))
			dealerHand.push(this.dealCard(deck))
		}
		return { playerHand: playerHand, dealerHand: dealerHand, deck: deck }
	}

	async makeImage(gameState, dealerShow = false) {
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
	}

	dealCard(deck) {
		return deck.pop()
	}

	getCardValue(card) {
		const cardValue = card.split('_')[0]
		if (cardValue === 'ace') return 11
		if (cardValue === 'jack' || cardValue === 'queen' || cardValue === 'king') return 10
		return parseInt(cardValue)
	}

	getHandValue(hand) {
		let value = 0
		let aces = 0
		for (let i = 0; i < hand.length; i++) {
			if (this.checkForAce([hand[i]])) {
				aces++
			}
			value += this.getCardValue(hand[i])
		}
		return { value: value, aces: aces }
	}

	async handleHit(userId, interaction) {
		try {
			let gameState = this.getGameState(userId)
			gameState.playerHand.push(this.dealCard(gameState.deck))

			// Check if player busted immediately after hit
			const playerBust = this.checkForBust(gameState.playerHand)

			const result = await this.callWorker(userId, 'blackjack', {
				gameState,
				dealerShow: playerBust, // Show dealer cards if player busted
			})

			gameState.image = result.image
			this.games.set(userId, gameState)

			// Pass true for gameOver if player busted
			await this.updateMessage(userId, interaction, playerBust)
		} catch (error) {
			console.error('Error in handleHit:', error)
			throw error
		}
	}

	async handleStand(userId, interaction) {
		try {
			let gameState = this.getGameState(userId)

			// Store player's value before dealer draws
			const playerValue = this.getBestHandValue(gameState.playerHand)

			// Dealer draws
			gameState = await this.dealerDraw(userId)
			const dealerValue = this.getBestHandValue(gameState.dealerHand)

			const result = await this.callWorker(userId, 'blackjack', {
				gameState,
				dealerShow: true,
			})

			gameState.image = result.image
			this.games.set(userId, gameState)

			// Only end game if dealer busted or reached final value
			const gameOver = dealerValue >= 17 || dealerValue > 21
			await this.updateMessage(userId, interaction, gameOver)
		} catch (error) {
			console.error('Error in handleStand:', error)
			throw error
		}
	}

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
		} catch (error) {
			console.error('Error in handleDoubleDown:', error)
			throw error
		}
	}

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
		} catch (error) {
			console.error('Error in handlePlayAgain:', error)
			throw error
		}
	}

	async handleLeave(userId, interaction) {
		try {
			this.games.delete(userId)
			await interaction.message.delete()
		} catch (error) {
			console.error('Error in handleLeave:', error)
			throw error
		}
	}

	async callWorker(userId, action, data, timeout = 10000) {
		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				reject(new Error('Worker timeout'))
			}, timeout)

			const handler = (response) => {
				if (response.type === action) {
					clearTimeout(timeoutId)
					creatorWorker.removeListener('message', handler)
					resolve(response)
				} else if (response.type === 'error') {
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

			// Update game state based on game over condition
			let isGameOver = gameOver
			if (gameOver === null) {
				isGameOver = this.checkForGameEnd(gameState)
				if (isGameOver) {
					gameState = await this.checkUserWin(userId, gameState, interaction)
					this.games.set(userId, gameState) // Save updated game state
				}
			} else {
				gameState = await this.checkUserWin(userId, gameState, interaction)
				this.games.set(userId, gameState) // Save updated game state
			}

			// Create embed and actions
			const embed = await embedHelper.blackJack(
				userId,
				gameState.userEcon,
				gameState,
				isGameOver, // Pass the actual game over state
			)
			const actions = await actionHelper.createBlackJackActions(
				userId,
				isGameOver, // Pass the actual game over state
				gameState.playerHand.length === 2,
			)

			// Create proper attachment from buffer
			const attachment = new AttachmentBuilder(Buffer.from(gameState.image.buffer), {
				name: 'blackJack.png',
			})

			// Handle both deferred replies and button updates
			const messageOptions = {
				embeds: [embed],
				files: [attachment],
				components: actions,
			}

			if (interaction.deferred) {
				await interaction.editReply(messageOptions)
			} else {
				await interaction.message.edit(messageOptions)
			}
		} catch (error) {
			console.error('Error updating message:', error)
			throw error
		}
	}

	checkForGameEnd(gameState) {
		const playerValue = this.getBestHandValue(gameState.playerHand)
		const dealerValue = this.getBestHandValue(gameState.dealerHand)

		// Game should end if:
		// 1. Player busted
		// 2. Dealer busted
		// 3. Either has blackjack
		// 4. Dealer has reached final value (≥17) after stand
		const gameOver =
			playerValue > 21 ||
			dealerValue > 21 ||
			this.checkForBlackJack(gameState.playerHand) ||
			this.checkForBlackJack(gameState.dealerHand) ||
			(dealerValue >= 17 && gameState.dealerHand.length > 2)

		// Log game end state for debugging
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
	}

	async checkUserWin(userId, gameState, interaction) {
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
			// Game shouldn't end yet if dealer needs to draw more
			return gameState
		} else {
			// Regular value comparison - player needs higher value to win
			if (playerValue > dealerValue) {
				win = true
			} else if (playerValue < dealerValue) {
				win = false
			} else {
				// Push - return bet
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
	}

	getBestHandValue(hand) {
		const handValue = this.getHandValue(hand)
		let value = handValue.value
		let aces = handValue.aces

		// Keep adjusting aces while value is over 21
		while (value > 21 && aces > 0) {
			value -= 10
			aces--
		}

		return value
	}

	async dealerDraw(userId) {
		let gameState = this.getGameState(userId)
		let currentValue = this.getBestHandValue(gameState.dealerHand)

		// Dealer must draw on 16 and stand on 17
		while (currentValue < 17) {
			gameState.dealerHand.push(this.dealCard(gameState.deck))
			currentValue = this.getBestHandValue(gameState.dealerHand)
		}

		this.games.set(userId, gameState)
		return gameState
	}

	getGameState(userId) {
		return this.games.get(userId)
	}

	deleteGame(userId) {
		this.games.delete(userId)
	}

	userHasGame(userId) {
		return this.games.has(userId)
	}

	checkForAce(hand) {
		for (let i = 0; i < hand.length; i++) {
			if (hand[i].split('_')[0] === 'ace') return true
		}
		return false
	}

	checkForBust(hand) {
		return this.getBestHandValue(hand) > 21
	}

	checkForBlackJack(hand) {
		return this.getHandValue(hand).value === 21
	}

	checkForSplit(hand) {
		return hand.length === 2 && hand[0].split('_')[0] === hand[1].split('_')[0]
	}
}

export const blackJack = new BlackJackHandler()
