import { SlashCommandBuilder } from 'discord.js'
import { userActions } from '../../actions/userActions.js'
import { blackJack } from '../../handlers/blackJackHandler.js'
import { embedHelper } from '../../classes/embedHelper.js'
import { actionHelper } from '../../classes/actionsHelper.js'

export default {
	data: new SlashCommandBuilder()
		.setName('blackjack')
		.setDescription(`Plays a game of blackjack against the bot.`)
		.addNumberOption((option) =>
			option
				.setName('bet')
				.setDescription('The amount of money you want to bet.')
				.setMinValue(1)
				.setRequired(true),
		),

	async execute(interaction) {
		try {
			const user = interaction.user.id
			const bet = interaction.options.getNumber('bet')
			let userEcon = await userActions.getUserEcon(interaction.guild.id, user)
			if (userEcon < bet) {
				return interaction.reply({
					content: `You do not have enough money to bet ${bet}`,
					ephemeral: true,
				})
			}
			if (blackJack.userHasGame(user)) {
				return interaction.reply({
					content: `You already have a game in progress`,
					ephemeral: true,
				})
			}
			await userActions.updateUserEcon(interaction.guild.id, user, bet, false)
			let game = await blackJack.startGame(user, bet, userEcon - bet)
			const embed = await embedHelper.blackJack(user, userEcon - bet, game)
			const gameOver =
				blackJack.checkForBust(game.playerHand) === true ||
				blackJack.checkForBust(game.dealerHand) === true ||
				blackJack.checkForBlackJack(game.playerHand) === true ||
				blackJack.checkForBlackJack(game.dealerHand) === true
			const actions = await actionHelper.createBlackJackActions(
				user,
				gameOver,
				game.playerHand.length === 2,
			)
			await interaction.reply({
				embeds: [embed],
				files: [game.image],
				components: actions,
			})
		} catch (e) {
			console.log(`Error occurred in command blackjack: ${e}`)
		}
	},
}
