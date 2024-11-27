import { EmbedBuilder } from 'discord.js'

export class CommandError extends Error {
	constructor(message, options = {}) {
		super(message)
		this.name = 'CommandError'
		this.userMessage = options.userMessage || message
		this.severity = options.severity || 'error'
	}
}

export function errorHandler(handlerName) {
	return function (handler) {
		return function (...args) {
			try {
				const result = handler(...args)

				if (result && typeof result.then === 'function') {
					return result
						.then((result) => {
							return result
						})
						.catch((error) => {
							handleError(error, handlerName, args)
						})
				}
			} catch (error) {
				return handleError(error, handlerName, args)
			}
		}
	}
}

function handleError(error, handlerName, args) {
	const interaction = args.find((arg) => arg?.reply && typeof arg.reply === 'function')

	const errorDetails = {
		name: error.name || 'Unknown Error',
		message: error.message || error.toString(),
		handlerName,
		timestamp: new Date().toISOString(),
		userId: interaction?.user?.id || 'Unknown',
		channelId: interaction?.channelId || 'Unknown',
		guildId: interaction?.guildId || 'Unknown',
	}

	console.error('Error Details:', {
		...errorDetails,
		stack: error.stack,
	})
}

function getErrorResponse(error) {
	// Default error message
	const defaultMessage = 'An unexpected error occurred. Please try again later.'

	// Check if it's our custom error
	if (error instanceof CommandError) {
		const embed = new EmbedBuilder()
			.setColor(error.severity === 'warning' ? '#FFA500' : '#FF0000')
			.setTitle('Command Error')
			.setDescription(error.userMessage)
			.setTimestamp()

		return {
			embeds: [embed],
			components: [], // Clear any components
		}
	}

	// Handle common Discord API errors
	if (error.code) {
		switch (error.code) {
			case 50013: // Missing Permissions
				return {
					content: "I don't have the required permissions to perform this action.",
					ephemeral: true,
				}
			case 10008: // Unknown Message
				return {
					content: "The message you're trying to interact with no longer exists.",
					ephemeral: true,
				}
			case 50007: // Cannot send messages to this user
				return {
					content: 'I cannot send messages to this user. They might have DMs disabled.',
					ephemeral: true,
				}
		}
	}

	// Handle rate limits
	if (error.message?.includes('rate limit')) {
		return {
			content: "Please slow down! You're using commands too quickly.",
			ephemeral: true,
		}
	}

	// Default error response
	return {
		content: defaultMessage,
		ephemeral: true,
	}
}

export function createCommandError(message, options = {}) {
	return new CommandError(message, options)
}
