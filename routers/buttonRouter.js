import { errorHandler } from '../handlers/errorHandler.js'
import { blackJack } from '../handlers/blackJackHandler.js'
import { highOrLower } from '../handlers/holHandler.js'
import { mineSweeper } from '../handlers/mineSweeperHandler.js'
import { roomsActions } from '../actions/roomsActions.js'
import { raceHandler } from '../handlers/raceHandler.js'

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
		let buttonName = button.split(':')[1].toLowerCase()

		if (['bj', 'hol', 'ms', 'race'].includes(type)) {
			const buttonUser = button.split(':')[2]
			if (interaction.user.id !== buttonUser) {
				return interaction.reply({
					content: 'You are not the user who started the game',
					ephemeral: true,
				})
			}
			if (type === 'ms' && buttonName.includes('_')) {
				buttonName = buttonName.split('_')[0]
			} else if (type === 'race' && buttonName.includes('_')) {
				buttonName = 'horse'
			}
		} else {
			if (type === 'room') {
				const roomButton = button.split(':')[2]
				const roomMember = await roomsActions.getRoomMembers(
					interaction.guild.id,
					roomButton,
				)
				if (!roomMember.includes(interaction.user.id)) {
					return interaction.reply({
						content: 'You are not a member of the room',
						ephemeral: true,
					})
				}
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

//Blackjack Buttons
buttonRouter.register('bj', 'hit', async (interaction, userId) => {
	try {
		interaction.deferUpdate()
		await blackJack.handleHit(userId, interaction)
	} catch (e) {
		console.log(`Error in blackjack hit button ${e}`)
	}
})

buttonRouter.register('bj', 'stand', async (interaction, userId) => {
	try {
		interaction.deferUpdate()
		await blackJack.handleStand(userId, interaction)
	} catch (e) {
		console.log(`Error in blackjack stand button ${e}`)
	}
})

buttonRouter.register('bj', 'doubledown', async (interaction, userId) => {
	try {
		interaction.deferUpdate()
		await blackJack.handleDoubleDown(userId, interaction)
	} catch (e) {
		console.log(`Error in blackjack double down button ${e}`)
	}
})

buttonRouter.register('bj', 'playagain', async (interaction, userId) => {
	try {
		interaction.deferUpdate()
		await blackJack.handlePlayAgain(userId, interaction)
	} catch (e) {
		console.log(`Error in blackjack play again button ${e}`)
	}
})

buttonRouter.register('bj', 'leave', async (interaction, userId) => {
	try {
		await blackJack.handleLeave(userId, interaction)
	} catch (e) {
		console.log(`Error in blackjack leave button ${e}`)
	}
})

//High or Low Buttons
buttonRouter.register('hol', 'higher', async (interaction, userId) => {
	try {
		await interaction.deferUpdate()
		await highOrLower.handleHit(userId, interaction, 'higher')
	} catch (e) {
		console.log(`Error in high or low higher button ${e}`)
	}
})

buttonRouter.register('hol', 'lower', async (interaction, userId) => {
	try {
		await interaction.deferUpdate()
		await highOrLower.handleHit(userId, interaction, 'lower')
	} catch (e) {
		console.log(`Error in high or low lower button ${e}`)
	}
})

buttonRouter.register('hol', 'cash', async (interaction, userId) => {
	try {
		await interaction.deferUpdate()
		await highOrLower.handleCashOut(userId, interaction)
	} catch (e) {
		console.log(`Error in high or low cash out button ${e}`)
	}
})

buttonRouter.register('hol', 'playagain', async (interaction, userId) => {
	try {
		interaction.deferUpdate()
		await highOrLower.handlePlayAgain(userId, interaction)
	} catch (e) {
		console.log(`Error in high or low play again button ${e}`)
	}
})

buttonRouter.register('hol', 'leave', async (interaction, userId) => {
	try {
		await highOrLower.handleLeave(userId, interaction)
	} catch (e) {
		console.log(`Error in high or low leave button ${e}`)
	}
})

//Mine Sweeper Buttons
buttonRouter.register('ms', 'reveal', async (interaction, userId) => {
	try {
		await interaction.deferUpdate()
		let choice = interaction.customId.split('_')
		choice = `${choice[1]}_${choice[2].split(':')[0]}`
		await mineSweeper.handleReveal(userId, choice, interaction)
	} catch (e) {
		console.log(`Error in mine sweeper reveal button ${e}`)
	}
})

//Race Buttons
buttonRouter.register('race', 'horse', async (interaction, userId) => {
	try {
		await interaction.deferUpdate()
		let choice = interaction.customId.split('_')[1]
		choice = choice.split(':')[0]
		await raceHandler.handleChoice(userId, choice, interaction)
	} catch (e) {
		console.log(`Error in race horse button ${e}`)
	}
})

buttonRouter.register('race', 'playagain', async (interaction, userId) => {
	try {
		await interaction.deferUpdate()
		await raceHandler.handlePlayAgain(userId, interaction)
	} catch (e) {
		console.log(`Error in race play again button ${e}`)
	}
})

buttonRouter.register('race', 'leave', async (interaction, userId) => {
	try {
		await interaction.deferUpdate()
		await raceHandler.handleLeave(userId, interaction)
	} catch (e) {
		console.log(`Error in race leave button ${e}`)
	}
})
