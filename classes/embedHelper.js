import { EmbedBuilder } from 'discord.js'
import { roomsActions } from '../actions/roomsActions.js'
import { blackJack } from '../handlers/blackJackHandler.js'

class EmbedHelper {
	constructor() {
		this.builder = new EmbedBuilder()
	}

	/**
	 * Generates a leaderboard embed for the specified type and data.
	 *
	 * @param {string} [type='econ'] - The type of leaderboard to generate (e.g. 'econ', 'points', etc.).
	 * @param {Object[]} data - An array of user data objects, each with an 'amount' property.
	 * @param {string} data.userId - The ID of the user to highlight in the leaderboard.
	 * @param {number} data.amount - The amount of the specified type for the user.
	 * @returns {EmbedBuilder} - The generated leaderboard embed.
	 */
	async makeLeaderboard(type = 'econ', data) {
		this.builder.setTitle(`${type.toUpperCase()} Leaderboard`)
		this.builder.setDescription(`Top 10 ${type} users`)
		this.builder.setColor(0x0099ff)
		let rank = 1
		for (const user of data) {
			this.builder.addFields({
				name: `#${rank} <@${user.userId}>`,
				value: user.amount.toString(),
				inline: false,
			})
			rank++
		}
		return this.builder
	}

	/**
	 * Generates a quest embed for the specified quest and user.
	 *
	 * @param {Object} quest - The quest object containing the quest details.
	 * @param {string} userId - The ID of the user the quest is for.
	 * @returns {EmbedBuilder} - The generated quest embed.
	 */
	async makeQuest(quest, userId) {
		this.builder.setTitle(`<@${userId}> Quest`)
		this.builder.setDescription(`${quest.description}`)
		this.builder.setFields([
			{ name: 'Name', value: quest.name, inline: false },
			{ name: 'Deadline', value: quest.deadline, inline: false },
			{ name: 'Reward', value: quest.reward, inline: false },
		])
		this.builder.setColor(0x0099ff)
		return this.builder
	}

	/**
	 * Generates an embed with statistics for the specified room.
	 *
	 * @param {Object} guild - The guild object containing the room.
	 * @param {string} roomId - The ID of the room to generate the statistics for.
	 * @returns {Promise<EmbedBuilder>} - The generated room statistics embed.
	 */
	async roomStats(guild, roomId) {
		const room = await roomsActions.getRoom(guild, roomId)
		this.builder.setTitle(`${room.name} Control Panel`)
		this.builder.setFields(
			{ name: 'Channel', value: `<#${room.channel}>`, inline: true },
			{ name: 'Owner', value: `<@${room.owner}>`, inline: true },
			{ name: 'Room Balance:', value: `${room.balance}`, inline: true },
			{
				name: 'Created At',
				value: `<t:${Math.floor(room.timeStamp / 1000)}:f>`,
				inline: true,
			},
			{
				name: 'Members',
				value: room.members.map((userId) => `<@${userId}>`).join(', '),
				inline: false,
			},
		)
		this.builder.setColor(0x0099ff)
		return this.builder
	}

	/**
	 * Generates a Blackjack game embed for the specified user and game state.
	 *
	 * @param {string} userId - The ID of the user playing the Blackjack game.
	 * @param {number} userEcon - The current balance of the user.
	 * @param {Object} gameState - The current state of the Blackjack game, containing the dealer's and player's hands.
	 * @param {boolean} [userStand=false] - Whether the user has chosen to stand in the game.
	 * @returns {EmbedBuilder} - The generated Blackjack game embed.
	 */
	async blackJack(userId, userEcon, gameState, userStand = false) {
		try {
			this.builder.setTitle(`Blackjack Game`)
			this.builder.setDescription(`<@${userId}> current balance is ${userEcon}`)

			const { dealerHand, playerHand } = gameState
			let dealerValue = blackJack.getHandValue(dealerHand)
			let userValue = blackJack.getHandValue(playerHand)

			const dealerHandBlackJack = blackJack.checkForBlackJack(dealerHand)
			const userHandBlackJack = blackJack.checkForBlackJack(playerHand)
			const dealerBust = blackJack.checkForBust(dealerHand)
			const userBust = blackJack.checkForBust(playerHand)

			let result = ''
			if (dealerHandBlackJack && userHandBlackJack) {
				result = "You and the dealer both have a Blackjack! It's a tie!"
			} else if (dealerHandBlackJack) {
				result = 'You lost! The dealer has a Blackjack!'
			} else if (userHandBlackJack) {
				result = 'You won! You have a Blackjack!'
			} else if (dealerBust) {
				result = 'You won! The dealer busted!'
			} else if (userBust) {
				result = 'You lost! You busted!'
			} else if (userStand) {
				if (dealerValue.value > userValue.value) {
					result = 'You lost! The dealer has a higher hand!'
				} else if (dealerValue.value < userValue.value) {
					result = 'You won! You have a higher hand!'
				} else {
					result = "It's a tie!"
				}
			}

			if (userValue.aces > 0) {
				if (userValue.value > 21) {
					userValue = `${userValue.value - userValue.aces * 10}`
				} else {
					userValue = `${userValue.value - userValue.aces * 10} / ${userValue.value}`
				}
			} else {
				userValue = `${userValue.value}`
			}

			if (!dealerHandBlackJack && !userStand) {
				dealerValue = blackJack.getCardValue(dealerHand[1])
			} else {
				if (dealerValue.aces > 0) {
					if (dealerValue.value > 21) {
						dealerValue = `${dealerValue.value - dealerValue.aces * 10}`
					} else {
						dealerValue = `${dealerValue.value - dealerValue.aces * 10} / ${dealerValue.value}`
					}
				} else {
					dealerValue = `${dealerValue.value}`
				}
			}

			if (userHandBlackJack) {
				userValue = `${userValue.value}`
			}

			this.builder.setFields(
				{
					name: 'Dealer Hand',
					value: `${dealerValue.toString()}`,
					inline: true,
				},
				{
					name: 'Player Hand',
					value: `${userValue.toString()}`,
					inline: true,
				},
			)
			if (result) {
				this.builder.addFields({ name: 'Result', value: result, inline: false })
			}
			this.builder.setImage('attachment://blackJack.png')
			this.builder.setColor(0x0099ff)
			return this.builder
		} catch (e) {
			console.log('EmbedHelper.blackJack', e)
		}
	}
}

export const embedHelper = new EmbedHelper()
