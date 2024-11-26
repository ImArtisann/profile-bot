import { parentPort } from 'worker_threads'
import { blackJack } from '../handlers/blackJackHandler.js'
import { userActions } from '../actions/userActions.js'

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
		const { guildId, user, memeber } = data
		const imageData = await userActions.createProfilePic(guildId, user, memeber)
		const buffer = Array.from(imageData.buffer)
		return {
			type: data.type,
			image: {
				buffer: buffer,
				name: 'profile.png',
			},
		}
	}catch(error) {
		console.error('Error in worker for profile image:', error)
	}
}

parentPort.on('message', async (message) => {
	try {
		const { data } = message

		if (data.type.includes('blackjack')) {
			const result = await handleBlackJackGame(data)
			parentPort.postMessage(result)
		}else if(data.type.includes('profile')){
			const result = await handleProfileImage(data)
			parentPort.postMessage(result)
		}
	} catch (error) {
		parentPort.postMessage({
			type: 'error',
			error: error.message,
		})
	}
})
