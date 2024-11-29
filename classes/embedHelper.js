import { EmbedBuilder } from 'discord.js'
import { roomsActions } from '../actions/roomsActions.js'
import { blackJack } from '../handlers/blackJackHandler.js'
import { errorHandler } from '../handlers/errorHandler.js'
import { highOrLower } from '../handlers/holHandler.js'

class EmbedHelper {
	/**
	 * Generates a leaderboard embed for the specified type and data.
	 *
	 * @param {string} [type='econ'] - The type of leaderboard to generate (e.g. 'econ', 'points', etc.).
	 * @param {Object[]} data - An array of user data objects, each with an 'amount' property.
	 * @param {string} data.userId - The ID of the user to highlight in the leaderboard.
	 * @param {number} data.amount - The amount of the specified type for the user.
	 * @returns {EmbedBuilder} - The generated leaderboard embed.
	 */
	makeLeaderboard(type = 'econ', data) {
		try {
			const embed = new EmbedBuilder()
				.setTitle(`${type.toUpperCase()} Leaderboard`)
				.setDescription(`Top 10 ${type} users`)
				.setColor(0x0099ff)
			let rank = 1
			for (const user of data) {
				embed.addFields({
					name: `#${rank} `,
					value: `<@${user.userId}> ${user.amount} coins`,
					inline: false,
				})
				rank++
			}
			return embed
		} catch (e) {
			console.log(`Error creating Leaderboard: ${e}`)
		}
	}

	/**
	 * Generates a quest embed for the specified quest and user.
	 *
	 * @param {Object} quest - The quest object containing the quest details.
	 * @param {string} userId - The ID of the user the quest is for.
	 * @returns {EmbedBuilder} - The generated quest embed.
	 */
	makeQuest(quest, userId) {
		try {
			const embed = new EmbedBuilder()
				.setTitle(`Quest`)
				.setDescription(`<@${userId}> Quest`)
				.setFields([
					{ name: 'Description', value: quest.description, inline: false },
					{ name: 'Name', value: quest.name, inline: false },
					{ name: 'Deadline', value: quest.deadline, inline: false },
					{ name: 'Reward', value: quest.reward, inline: false },
				])
				.setColor(0x0099ff)
			return embed
		} catch (e) {
			console.log(`Error creating Quest: ${e}`)
		}
	}

	/**
	 * Generates an embed with statistics for the specified room.
	 *
	 * @param {Object} guild - The guild object containing the room.
	 * @param {string} roomId - The ID of the room to generate the statistics for.
	 * @returns {Promise<EmbedBuilder>} - The generated room statistics embed.
	 */
	async roomStats(guild, roomId) {
		try {
			const room = await roomsActions.getRoom(guild, roomId)
			const embed = new EmbedBuilder()
				.setTitle(`${room.name} Control Panel`)
				.setFields(
					{ name: 'Channel', value: `<#${room.channel}>`, inline: true },
					{ name: 'Owner', value: `<@${room.owner}>`, inline: true },
					{ name: 'Room Balance:', value: `${room.roomBalance}`, inline: true },
					{
						name: 'Created At',
						value: `<t:${Math.floor(room.createdAt / 1000)}:f>`,
						inline: true,
					},
					{
						name: 'Members',
						value: room.members.map((userId) => `<@${userId}>`).join(', '),
						inline: false,
					},
				)
				.setColor(0x0099ff)
			return embed
		} catch (e) {
			console.log(`Error creating room stats: ${e}`)
		}
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
	blackJack(userId, userEcon, gameState, userStand = false) {
		try {
			const embed = new EmbedBuilder()
				.setTitle(`Blackjack Game`)
				.setDescription(
					`<@${userId}>'s current balance: ${userEcon}\nCurrent bet: ${gameState.bet}`,
				)

			const { dealerHand, playerHand } = gameState
			const dealerHandBlackJack = blackJack.checkForBlackJack(dealerHand)
			const userHandBlackJack = blackJack.checkForBlackJack(playerHand)
			const dealerBust = blackJack.checkForBust(dealerHand)
			const userBust = blackJack.checkForBust(playerHand)

			// Get best values for both hands
			const dealerBestValue = blackJack.getBestHandValue(dealerHand)
			const playerBestValue = blackJack.getBestHandValue(playerHand)

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
				if (dealerBestValue > playerBestValue) {
					result = 'You lost! The dealer has a higher hand!'
				} else if (dealerBestValue < playerBestValue) {
					result = 'You won! You have a higher hand!'
				} else {
					result = "It's a tie!"
				}
			}

			// Format values using best hand value
			let formattedUserValue
			if (userHandBlackJack) {
				formattedUserValue = '21 (Blackjack!)'
			} else {
				const userHand = blackJack.getHandValue(playerHand)
				if (userHand.aces > 0 && playerBestValue < 21) {
					const low = playerBestValue
					const high = userHand.value <= 21 ? userHand.value : playerBestValue
					formattedUserValue = `${low}/${high}`
				} else {
					formattedUserValue = playerBestValue.toString()
				}
			}

			// Format dealer value
			let formattedDealerValue
			if (!dealerHandBlackJack && !userStand) {
				// During gameplay, only show the face-up card
				formattedDealerValue = blackJack.getCardValue(dealerHand[1]).toString()
			} else {
				// When game is over, show best possible value
				if (dealerHandBlackJack) {
					formattedDealerValue = '21 (Blackjack!)'
				} else {
					const dealerHand = blackJack.getHandValue(gameState.dealerHand)
					if (dealerHand.aces > 0 && dealerBestValue < 21) {
						const low = dealerBestValue
						const high = dealerHand.value <= 21 ? dealerHand.value : dealerBestValue
						formattedDealerValue = `${low}/${high}`
					} else {
						formattedDealerValue = dealerBestValue.toString()
					}
				}
			}

			// Log values for debugging
			console.log({
				dealerRawValue: blackJack.getHandValue(dealerHand),
				dealerBestValue,
				formattedDealerValue,
				playerRawValue: blackJack.getHandValue(playerHand),
				playerBestValue,
				formattedUserValue,
			})

			embed.setFields([
				{
					name: 'Dealer Hand',
					value: formattedDealerValue,
					inline: true,
				},
				{
					name: 'Player Hand',
					value: formattedUserValue,
					inline: true,
				},
			])

			if (result) {
				embed.addFields({ name: 'Result', value: result, inline: false })
			}

			embed.setImage('attachment://blackJack.png')
			embed.setColor(0x0099ff)

			return embed
		} catch (e) {
			console.log(`Error creating blackjack EH: ${e}`)
		}
	}

	highOrLow(userId, userEcon, gameState) {
		try {
			const embed = new EmbedBuilder()
				.setTitle(`High or Low Game`)
				.setDescription(
					`<@${userId}>'s current balance: ${userEcon}\nCurrent bet: ${gameState.bet}`,
				)

			// Ensure we have valid numbers for display
			const higherChance = gameState.percent?.higher || 0
			const lowerChance = gameState.percent?.lower || 0

			embed.setFields([
				{
					name: 'Higher Or Same',
					value: higherChance.toString(),
					inline: true,
				},
				{
					name: 'Lower Or Same',
					value: lowerChance.toString(),
					inline: true,
				},
			])

			if (highOrLower.checkUserLose(userId)) {
				embed.addFields({ name: 'Result', value: 'You lost!', inline: false })
			} else {
				embed.addFields(
					{
						name: 'Result',
						value: `You won! Current Bet Multiplier: ${gameState.reward?.toFixed(2) || '1.00'}`,
						inline: false,
					},
					{
						name: 'Cash out Value',
						value: `${Math.round((gameState.reward?.toFixed(2) || 1) * gameState.bet)}`,
						inline: true,
					},
				)
			}
			embed.setImage('attachment://hol.png')
			embed.setColor(0x0099ff)
			return embed
		} catch (e) {
			console.log(`Error creating HoL EH: ${e}`)
		}
	}

	mineSweeper(userId, userEcon, gameState) {
		try {
			const embed = new EmbedBuilder()
				.setTitle(`Minesweeper Game`)
				.setDescription(
					`<@${userId}>'s current balance: ${userEcon}\nCurrent bet: ${gameState.bet}`,
				)
			let payout =
				(gameState.mines.length / 15) *
				gameState.reward *
				((5 + gameState.reward) * (gameState.mode / 25))
			embed.setFields([
				{
					name: 'Number of Mines',
					value: gameState.mines.length.toString(),
					inline: true,
				},
				{
					name: 'Number Revealed',
					value: gameState.revealed.length.toString(),
					inline: true,
				},
				{
					name: 'Reward (if cashout)',
					value: Math.round(gameState.bet + gameState.bet * payout).toString(),
					inline: true,
				},
			])
			return embed
		} catch (e) {
			console.log(`Error creating Minesweeper EH: ${e}`)
		}
	}

	race(userId, userEcon, gameState) {
		try {
			const embed = new EmbedBuilder()
				.setTitle(`Bet on the horses!`)
				.setDescription(
					`<@${userId}>'s current balance: ${userEcon}\nCurrent bet: ${gameState.bet}
          ${Number(gameState.choice) !== 0 ? `You Have bet on horse ${gameState.choice}` : ``}`,
				)
				.setColor(0x0099ff)

			if (
				gameState.horse1 === 10 ||
				gameState.horse2 === 10 ||
				gameState.horse3 === 10 ||
				gameState.horse4 === 10
			) {
				const winningHorse = Object.entries(gameState).find(
					([key, value]) => value === 10 && key !== 'bet',
				)[0]
				if (winningHorse.slice(-1) === gameState.choice) {
					embed.addFields({
						name: `Winner`,
						value: `You won! ${gameState.bet * 4}`,
						inline: false,
					})
				} else {
					embed.addFields(
						{
							name: `Winner`,
							value: `Horse ${winningHorse.slice(-1)}`,
							inline: false,
						},
						{
							name: `You lost!`,
							value: `Horse ${gameState.choice}`,
							inline: false,
						},
					)
				}
			} else {
				// Add horse positions
				for (const [key, value] of Object.entries(gameState)) {
					if (key.includes('horse')) {
						const string =
							'.'.repeat(Number(value)) + '🐎' + '.'.repeat(9 - Number(value))
						embed.addFields({
							name: `${key.slice(0, -1)} ${key.slice(-1)}`,
							value: string,
							inline: false,
						})
					}
				}
			}

			return embed
		} catch (e) {
			console.log(`Error creating Race EH: ${e}`)
		}
	}

	videoPoker(userId, userEcon, gameState) {
		try {
			const embed = new EmbedBuilder()
				.setTitle(`Video Poker`)
				.setDescription(
					`<@${userId}>'s current balance: ${userEcon}\nCurrent bet: ${gameState.bet}`,
				)
				.setFields([
					{
						name: 'Royal Flush',
						value: '800x',
						inline: true,
					},
					{
						name: 'Straight Flush',
						value: '60x',
						inline: true,
					},
					{
						name: 'Four of a Kind',
						value: '22x',
						inline: true,
					},
					{
						name: 'Full House',
						value: '9x',
						inline: true,
					},
					{
						name: 'Flush',
						value: '6x',
						inline: true,
					},
					{
						name: 'Straight',
						value: '4x',
						inline: true,
					},
					{
						name: 'Three of a Kind',
						value: '3x',
						inline: true,
					},
					{
						name: 'Two Pair',
						value: '2x',
						inline: true,
					},
					{
						name: 'Your Current Hand Value',
						value: `${gameState.handValue}`,
						inline: true,
					},
				])
			embed.setColor(0x0099ff)

			embed.setImage('attachment://poker.png')

			return embed
		} catch (e) {
			console.log(`Error creating Video Poker EH: ${e}`)
		}
	}
}

export const embedHelper = new EmbedHelper()
