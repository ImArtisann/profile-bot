import { parentPort } from 'worker_threads'
import { blackJack } from '../handlers/blackJackHandler.js'
import { userActions } from '../actions/userActions.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { highOrLower } from '../handlers/holHandler.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const foldersPath = __dirname

async function handleBlackJackGame(data) {
	try {
		const { gameState, dealerShow } = data

		// Create the image using the provided gameState
		const imageData = await blackJack.makeImage(gameState, dealerShow)

		// Convert buffer to array for transfer
		const buffer = Array.from(imageData.buffer)

		return {
			type: data.type,
			image: {
				buffer: buffer,
				name: 'blackJack.png',
			},
		}
	} catch (error) {
		console.error('Error in worker for blackjack image:', error)
	}
}

async function handleProfileImage(data) {
	try {
		const imageData = await userActions.createProfilePic(data)
		const buffer = Array.from(imageData.buffer)
		return {
			type: data.type,
			image: {
				buffer: buffer,
				name: 'profile.png',
			},
		}
	} catch (error) {
		console.error('Error in worker for profile image:', error)
	}
}

async function handleHoLImage(data) {
	try {
		const { gameState } = data

		const imageData = await highOrLower.makeImage(gameState)
		const buffer = Array.from(imageData.buffer)
		return {
			type: data.type,
			image: {
				buffer: buffer,
				name: 'hol.png',
			},
		}
	} catch (error) {
		console.error('Error in worker for profile image:', error)
	}
}

parentPort.on('message', async (message) => {
	try {
		const { data } = message

		if (data.type.includes('blackjack')) {
			const result = await handleBlackJackGame(data)
			parentPort.postMessage(result)
		} else if (data.type.includes('profile')) {
			const result = await handleProfileImage(data)
			parentPort.postMessage(result)
		} else if (data.type.includes('hol')) {
			const result = await handleHoLImage(data)
			parentPort.postMessage(result)
		} else if (data.type.includes('slots')) {
		} else if (data.type.includes('wheel')) {
		} else if (data.type.includes('roulette')) {
		}
	} catch (error) {
		parentPort.postMessage({
			type: `${message.data.type}:error`,
			error: error.message,
		})
	}
})
