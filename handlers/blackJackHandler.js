import { fileURLToPath } from 'url'
import { dirname } from 'path'
import path from 'node:path'
import fs from 'fs'
import Canvas from '@napi-rs/canvas'
import { AttachmentBuilder } from 'discord.js'
import { embedHelper } from '../classes/embedHelper.js'
import { actionHelper } from '../classes/actionsHelper.js'
import { userActions } from '../actions/userActions.js'

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

	async startGame(userId, bet, userEcon) {
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
		this.games.set(userId, gameState)
		gameState.image = await this.makeImage(userId)
		this.games.set(userId, gameState)
		return gameState
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

	async makeImage(userId, dealerShow = false) {
		const canvas = Canvas.createCanvas(1200, 600)
		const ctx = canvas.getContext('2d')
		const background = await Canvas.loadImage(this.table)
		ctx.drawImage(background, 0, 0, canvas.width, canvas.height)
		let gameState = this.games.get(userId)
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
		// return fs.writeFileSync('test.png', buffer)
		return new AttachmentBuilder(buffer, { name: 'blackJack.png' })
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

	async handleInteraction(userId, interaction, buttonId) {
		const options = buttonId.split(':')
		let gameState = this.getGameState(userId)
		let userEcon = await userActions.getUserEcon(interaction.guild.id, userId)

		switch (options[1]) {
			case 'Hit':
				gameState.playerHand.push(this.dealCard(gameState.deck))
				gameState.image = await this.makeImage(userId)
				break
			case 'Stand':
				await this.dealerDraw(userId)
				gameState.image = await this.makeImage(userId, true)
				break
			case 'DoubleDown':
				if (userEcon < gameState.bet) {
					return interaction.reply({
						content: `You do not have enough money to double down.`,
						ephemeral: true,
					})
				}
				await userActions.updateUserEcon(
					interaction.guild.id,
					userId,
					gameState.bet,
					false,
				)
				gameState.playerHand.push(this.dealCard(gameState.deck))
				gameState.bet *= 2
				await this.dealerDraw(userId)
				gameState.image = await this.makeImage(userId, true)
				break
			case 'PlayAgain':
				this.games.delete(userId)
				if (userEcon < gameState.bet) {
					return interaction.reply({
						content: `You do not have enough money to bet ${gameState.bet}`,
						ephemeral: true,
					})
				}
				await userActions.updateUserEcon(
					interaction.guild.id,
					userId,
					gameState.bet,
					false,
				)
				gameState = await this.startGame(userId, gameState.bet, userEcon - gameState.bet)
				break
			case 'Leave':
				this.games.delete(userId)
				return interaction.update({
					content: `You have left the game.`,
					ephemeral: true,
				})
		}
		this.games.set(userId, gameState)
		const embed = await embedHelper.blackJack(
			userId,
			gameState.userEcon,
			gameState,
			options[1] === 'Stand' || options[1] === 'DoubleDown',
		)
		const gameOver =
			blackJack.checkForBust(gameState.playerHand) === true ||
			blackJack.checkForBust(gameState.dealerHand) === true ||
			blackJack.checkForBlackJack(gameState.playerHand) === true ||
			blackJack.checkForBlackJack(gameState.dealerHand) === true ||
			options[1] === 'Stand' ||
			options[1] === 'DoubleDown'
		if (gameOver) {
			gameState = await this.checkUserWin(userId, gameState, interaction)
		}
		const actions = await actionHelper.createBlackJackActions(
			userId,
			gameOver,
			gameState.playerHand.length === 2,
		)

		await interaction.message.edit({
			embeds: [embed],
			files: [gameState.image],
			components: actions,
		})
	}

	async checkUserWin(userId, gameState, interaction) {
		let win
		if (blackJack.checkForBust(gameState.playerHand) === true) {
			win = false
		} else if (blackJack.checkForBust(gameState.dealerHand) === true) {
			win = true
		} else if (blackJack.checkForBlackJack(gameState.playerHand) === true) {
			win = true
		} else if (blackJack.checkForBlackJack(gameState.dealerHand) === true) {
			win = false
		} else {
			if (this.getHandValue(gameState.dealerHand) > 21) {
				win = true
			} else if (this.getHandValue(gameState.playerHand) > 21) {
				win = false
			} else if (
				this.getHandValue(gameState.playerHand).value >
				this.getHandValue(gameState.dealerHand).value
			) {
				win = true
			} else if (
				this.getHandValue(gameState.playerHand).value <
				this.getHandValue(gameState.dealerHand).value
			) {
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
			await userActions.updateUserEcon(
				interaction.guild.id,
				userId,
				gameState.bet * 2,
				true,
			)
			gameState.userEcon += gameState.bet * 2
		}
		return gameState
	}

	async dealerDraw(userId) {
		let gameState = this.getGameState(userId)

		const adjustForAces = (handValue) => {
			let value = handValue.value
			let aces = handValue.aces
			while (value > 21 && aces > 0) {
				value -= 10
				aces--
			}
			return value
		}

		let currentValue = adjustForAces(this.getHandValue(gameState.dealerHand))

		while (currentValue < 17) {
			gameState.dealerHand.push(this.dealCard(gameState.deck))
			currentValue = adjustForAces(this.getHandValue(gameState.dealerHand))
		}

		this.games.set(userId, gameState)
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
		return this.getHandValue(hand).value - 10 * this.getHandValue(hand).aces > 21
	}

	checkForBlackJack(hand) {
		return this.getHandValue(hand).value === 21
	}

	checkForSplit(hand) {
		return hand.length === 2 && hand[0].split('_')[0] === hand[1].split('_')[0]
	}
}

export const blackJack = new BlackJackHandler()
