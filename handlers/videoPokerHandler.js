import { dirname } from 'path'
import { fileURLToPath } from 'url'
import path from 'node:path'
import fs from 'fs'
import Canvas, { GlobalFonts } from '@napi-rs/canvas'
import { creatorWorker } from '../images/creator.js'
import { AttachmentBuilder, ChatInputCommandInteraction } from 'discord.js'
import { embedHelper } from '../classes/embedHelper.js'
import { actionHelper } from '../classes/actionsHelper.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const foldersPath = path.join(__dirname, './../images')

class VideoPokerHandler {
	constructor() {
		this.games = new Map()
		this.table = path.join(foldersPath, '/blackjack_table/table.jpg')
		this.cards = [...fs.readdirSync(path.join(foldersPath, '/playing_cards'))]
	}

	/**
	 * Starts a new video poker game for the specified user.
	 *
	 * @param {string} userId - The ID of the user starting the game.
	 * @param {number} bet - The amount the user is betting on the game.
	 * @param {number} userEcon - The user's current economic status.
	 * @param {object} interaction - The interaction object associated with the game start.
	 * @returns {Promise<void>} - A Promise that resolves when the game is started.
	 */
	async startGame(userId, bet, userEcon, interaction) {
		try {
			let gameState = {
				bet: Number(bet),
				userEcon: Number(userEcon),
				gameOver: false,
				deck: [],
				hand: [],
				handValue: '',
				kept: [],
				reward: 0,
			}
			gameState.deck = await this.shuffleDeck(this.cards)
			for (let i = 0; i < 5; i++) {
				gameState.hand.push(gameState.deck.pop())
			}
			const result = await this.callWorker(userId, 'videoPoker', {
				gameState,
			})
			gameState.image = result.image
			this.games.set(userId, gameState)
			await this.updateMessage(userId, interaction)
		} catch (e) {
			console.log(`Error in video poker start game: ${e}`)
		}
	}

	/**
	 * Shuffles the provided deck of cards in-place using the Fisher-Yates shuffle algorithm.
	 *
	 * @param {string[]} deck - An array of card file names representing the deck to be shuffled.
	 * @returns {Promise<string[]>} - The shuffled deck of cards.
	 */
	async shuffleDeck(deck) {
		try {
			for (let i = deck.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1))
				;[deck[i], deck[j]] = [deck[j], deck[i]]
			}
			return deck
		} catch (e) {
			console.log(`Error shuffling deck video poker: ${e}`)
		}
	}

	/**
	 * Generates an image of the current video poker game state.
	 *
	 * @param {object} gameState - The current state of the video poker game.
	 * @returns {Promise<{ buffer: Buffer, name: string }>} - A Promise that resolves to an object containing the generated image buffer and file name.
	 */
	async makeImage(gameState) {
		try {
			const canvas = Canvas.createCanvas(1200, 600)
			const ctx = canvas.getContext('2d')
			const background = await Canvas.loadImage(this.table)
			ctx.drawImage(background, 0, 0, canvas.width, canvas.height)
			GlobalFonts.registerFromPath('images/fonts/Rustic-Printed-Regular.ttf', 'Rustic')

			for (let i = 0; i < gameState.hand.length; i++) {
				const card = await Canvas.loadImage(
					path.join(foldersPath, '/playing_cards', gameState.hand[i]),
				)
				ctx.drawImage(card, 100 + i * 205, 125, 200, 300)
				ctx.font = '38px Rustic'
				ctx.fillStyle = '#000000'
				ctx.fillText('Card: ' + (i + 1), 100 + i * 205, 465)
			}
			const buffer = await canvas.toBuffer('image/png')
			return {
				buffer: buffer,
				name: 'videoPoker.png',
			}
		} catch (e) {
			console.log(`Error making image video poker: ${e}`)
		}
	}

	/**
	 * Calls a worker with the provided user ID and data, with a timeout.
	 *
	 * @param {string} userId - The ID of the user.
	 * @param {object} data - The data to be sent to the worker.
	 * @param {number} [timeout=10000] - The timeout in milliseconds for the worker call.
	 * @returns {Promise<object>} - A Promise that resolves to the worker's response, or rejects with an error if the worker times out or returns an error.
	 */
	async callWorker(userId, data, timeout = 10000) {
		try {
			new Promise((resolve, reject) => {
				const timeoutId = setTimeout(() => {
					reject(new Error('Worker timed out'))
				}, timeout)

				const handler = (response) => {
					if (response.type === 'videoPoker') {
						clearTimeout(timeoutId)
						resolve(response)
					} else if (response.type === 'videoPoker:error') {
						clearTimeout(timeoutId)
						reject(new Error(response.error))
					}
				}

				creatorWorker.on('message', handler)

				creatorWorker.postMessage({
					data: {
						...data,
						type: 'videoPoker',
						userId,
					},
				})
			})
		} catch (e) {
			console.log(`Error in videoPoker callWorker: ${e}`)
		}
	}

	async updateMessage(userId, interaction) {
		try {
			let gameState = this.games.get(userId)

			const embed = await embedHelper.videoPoker(userId, gameState.userEcon, gameState)

			const actions = actionHelper.createVideoPokerActions(
				userId,
				gameState.kept,
				gameState.gameOver,
			)

			const attachment = new AttachmentBuilder(gameState.image.buffer, {
				name: 'poker.png',
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
			console.log(`Error in videoPoker update message: ${e}`)
		}
	}
}

export const videoPoker = new VideoPokerHandler()
