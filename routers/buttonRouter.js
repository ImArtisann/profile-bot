import { errorHandler } from '../handlers/errorHandler.js'
import { blackJack } from '../handlers/blackJackHandler.js'

class ButtonRouter {
	constructor() {
		this.router = new Map()
	}

	register(type, buttonName, callback) {
		this.router.set(`${type}:${buttonName}`, callback)
	}

	async handle(interaction) {
		const button = interaction.customId
		const type = button.split(':')[0].toLowerCase()
		const buttonName = button.split(':')[1].toLowerCase()

		if (type === 'bj') {
			const buttonUser = button.split(':')[2]
			if (interaction.user.id !== buttonUser) {
				return interaction.reply({
					content: 'You are not the user who started the game',
					ephemeral: true,
				})
			}
		}

		if (this.router.has(`${type}:${buttonName}`)) {
			const callback = this.router.get(`${type}:${buttonName}`)
			await callback(interaction, interaction.user.id)
		} else {
			console.log(`Button ${button} not found`)
		}
	}
}

export const buttonRouter = new ButtonRouter()

buttonRouter.register(
	'bj',
	'hit',
	errorHandler('Blackjack Hit')(async (interaction, userId) => {
		interaction.deferUpdate()
		await blackJack.handleHit(userId, interaction)
	}),
)

buttonRouter.register(
	'bj',
	'stand',
	errorHandler('Blackjack Stand')(async (interaction, userId) => {
		interaction.deferUpdate()
		await blackJack.handleStand(userId, interaction)
	}),
)

buttonRouter.register(
	'bj',
	'doubledown',
	errorHandler('Blackjack Double')(async (interaction, userId) => {
		interaction.deferUpdate()
		await blackJack.handleDoubleDown(userId, interaction)
	}),
)

buttonRouter.register(
	'bj',
	'split',
	errorHandler('Blackjack Split')(async (interaction, userId) => {}),
)

buttonRouter.register(
	'bj',
	'playagain',
	errorHandler('Blackjack Play Again')(async (interaction, userId) => {
		interaction.deferUpdate()
		await blackJack.handlePlayAgain(userId, interaction)
	}),
)

buttonRouter.register(
	'bj',
	'leave',
	errorHandler('Blackjack Leave')(async (interaction, userId) => {
		await blackJack.handleLeave(userId, interaction)
	}),
)
