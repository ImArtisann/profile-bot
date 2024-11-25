import { errorHandler } from '../handlers/errorHandler.js'

class ButtonRouter {
	constructor() {
		this.router = new Map()
	}

	register(type, buttonName, callback) {
		this.router.set(`${type}:${buttonName}`, callback)
	}

	async handle(interaction) {
		const button = interaction.customId
		const type = button.split(':')[0]
		const buttonName = button.split(':')[1]

		if(this.router.has(`${type}:${buttonName}`)) {
			const callback = this.router.get(`${type}:${buttonName}`)
			await callback(interaction)
		} else {
			console.log(`Button ${button} not found`)
		}

	}
}

export const buttonRouter = new ButtonRouter()


buttonRouter.register('bj', 'hit', errorHandler('Blackjack Hit')(async (interaction) => {

}))

buttonRouter.register('bj', 'stand', errorHandler('Blackjack Stand')(async (interaction) => {

}))

buttonRouter.register('bj', 'doubledown', errorHandler('Blackjack Double')(async (interaction) => {

}))

buttonRouter.register('bj', 'split', errorHandler('Blackjack Split')(async (interaction) => {

}))

buttonRouter.register('bj', 'playagain', errorHandler('Blackjack Play Again')(async (interaction) => {

}))

buttonRouter.register('bj', 'leave', errorHandler('Blackjack Leave')(async (interaction) => {

}))