import Canvas, { GlobalFonts, loadImage } from '@napi-rs/canvas'
import path from 'node:path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'node:fs'
import { creatorWorker } from '../images/creator.js'
import { errorHandler } from '../handlers/errorHandler.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const foldersPath = path.join(__dirname, './../images')

class UserClass {
	constructor() {
		this.client = null
		this.variables = {
			width: 236,
			height: 14,
			borderHeight: 16,
			progress: 0,
			fillColor: '#659DCC',
			borderRadius: 10,
			startHP: 448,
			endHP: 389,
			startMood: 448,
			endMood: 437,
			startFocus: 448,
			endFocus: 486,
			startMana: 448,
			endMana: 535,
			nameFont: '60px Rustic',
			levelFont: '22px Artegra',
			timeFont: '14px Rustic',
			nameColor: '#DDFFFF',
			levelColor: '#1F3C68',
		}
		this.profilePhoto = path.join(foldersPath, '/Player_card_1.png')
		this.raidEmblems = [...fs.readdirSync(path.join(foldersPath, '/raids'))]
		this.testPhoto = path.join(foldersPath, '/test-profile.png')
	}

	initialize = errorHandler('Initialize User Actions')(async (client) => {
		this.client = client
	})

	/**
	 * Send the specified amount of econ from the user's account to the recipient's account.
	 * @param {string} guildId - The ID of the guild the user and recipient belong to.
	 * @param {string} userId - The ID of the user sending the econ.
	 * @param {string} recipientId - The ID of the recipient receiving the econ.
	 * @param {number} amount - The amount of econ to send.
	 * @returns {Promise<boolean>} - True if the econ was successfully sent, false if the user does not have enough econ.
	 */
	sendEcon = async (guildId, userId, recipientId, amount) => {
		try {
			const userEcon = await this.getUserEcon(guildId, userId)
			if (userEcon < amount) {
				return false
			} else {
				await this.updateUserEcon(guildId, userId, userEcon - amount)
				await this.updateUserEcon(
					guildId,
					recipientId,
					Number((await this.getUserEcon(guildId, recipientId)) + amount),
				)
				return true
			}
		} catch (e) {
			console.log(`Error while sending econ: ${e}`)
		}
	}

	/**
	 * Get the user profile data for creating the image
	 * @param guildId
	 * @param userId
	 * @returns {Promise<{
	 * badges: ([]|any),
	 * econ: (number),
	 * mood: (number),
	 * mana: (number),
	 * level: (string),
	 * timezone: (string),
	 * hp: (number),
	 * focus: (number),
	 * class: (string)}>}
	 */
	getUserProfile = async (guildId, userId) => {
		try {
			return JSON.parse(await this.client.hget(`${guildId}:users`, userId))
		} catch (e) {
			console.log(`Error while getting user profile: ${e}`)
		}
	}

	/**
	 * Creates a profile picture image for a user.
	 *
	 * This function is responsible for generating a profile picture image for a user. It uses the Canvas API to draw the
	 * user's avatar, name, and various status bars (health, mood, focus, mana) on a background image. The function takes
	 * in the guild ID, user object, and member object, and returns either a buffer of the generated image or writes the
	 * image to a file if the `test` parameter is set to `true`.
	 *
	 * @param {object} data - The data to generate the image from.
	 * @param {string} data.profileData - The user's profile data.
	 * @param {string} data.avatarUrl - The user's avatar URL.
	 * @param {string} data.name - The user's name.
	 * @param {Object} data.serverBadges - The server badges to display.
	 * @param {boolean} [test=false] - Whether this is a test run. If true, the image will be written to a file instead of returned.
	 * @returns {Promise<{buffer: Buffer, name: string}|void>} - If `test` is false, returns an object with the generated image buffer and file name. If `test` is true, the image is written to a file and no value is returned.
	 */
	createProfilePic = async (data, test = false) => {
		try {
			const userData = data.profileData
			GlobalFonts.registerFromPath('images/fonts/Rustic-Printed-Regular.ttf', 'Rustic')
			GlobalFonts.registerFromPath('images/fonts/Artegra-sans-extrabold.otf', 'Artegra')
			const canvas = Canvas.createCanvas(1050, 600)
			const context = canvas.getContext('2d')
			//load background image
			const background = await Canvas.loadImage(this.profilePhoto)
			const avatarUrl = test ? '' : data.avatarUrl
			const avatar = test
				? await Canvas.loadImage(this.testPhoto)
				: await Canvas.loadImage(encodeURI(avatarUrl))
			//draw avatar
			context.drawImage(background, 0, 0, canvas.width, canvas.height)
			context.save()
			context.beginPath()
			context.roundRect(74, 224, 240, 242, 8)
			context.closePath()
			context.clip()
			context.drawImage(avatar, 74, 224, 240, 242)
			context.restore()
			/**
			 * Renders the player's username on the profile image.
			 *
			 * This function is responsible for drawing the player's username on the profile image canvas. It uses the `variables`
			 * object to determine the font style and color to use for the text.
			 */
			const createNameText = () => {
				context.font = this.variables.nameFont
				context.fillStyle = this.variables.nameColor
				data.name = data.name.charAt(0).toUpperCase() + data.name.slice(1)
				context.fillText(data.name, 360, 270)
			}

			/**
			 * Renders the player's health bar on the profile image.
			 *
			 * This function is responsible for drawing the player's health bar on the profile image canvas. It uses the `variables`
			 * object to determine the position, size, and appearance of the health bar.
			 */
			const drawHealthBar = () => {
				try {
					let strokeWidth = 3
					const hpFillWidth = (((userData?.hp || 4) * 10) / 100) * this.variables.width

					// Draw the filled portion
					if (hpFillWidth > 0) {
						context.beginPath()
						context.fillStyle = this.variables.fillColor
						context.rect(
							this.variables.startHP,
							this.variables.endHP,
							hpFillWidth,
							this.variables.height,
						)
						context.fill()
					}

					// Draw outer box
					context.beginPath()
					context.rect(
						this.variables.startHP,
						this.variables.endHP,
						this.variables.width,
						this.variables.borderHeight,
					)
					context.strokeStyle = this.variables.fillColor
					context.lineWidth = strokeWidth
					context.stroke()

					// Draw inner box
					context.strokeStyle = '#DFFAFF'
					strokeWidth = 2
					context.beginPath()
					context.rect(
						this.variables.startHP + strokeWidth / 2,
						this.variables.endHP + strokeWidth / 2,
						this.variables.width - strokeWidth,
						this.variables.borderHeight - strokeWidth,
					)
					context.stroke()
				} catch (e) {
					console.error('Error drawing health bar')
				}
			}

			/**
			 * Renders the player's mood bar on the profile image.
			 *
			 * This function is responsible for drawing the player's mood bar on the profile image canvas. It uses the `variables`
			 * object to determine the position, size, and appearance of the mood bar.
			 */
			const drawMoodBar = () => {
				try {
					let strokeWidth = 3
					const moodFillWidth =
						(((userData?.mood || 4) * 10) / 100) * this.variables.width

					// Draw the filled portion
					if (moodFillWidth > 0) {
						context.beginPath()
						context.fillStyle = this.variables.fillColor
						context.rect(
							this.variables.startMood,
							this.variables.endMood,
							moodFillWidth,
							this.variables.height,
						)
						context.fill()
					}

					// Draw outer box
					context.beginPath()
					context.rect(
						this.variables.startMood,
						this.variables.endMood,
						this.variables.width,
						this.variables.borderHeight,
					)
					context.strokeStyle = this.variables.fillColor
					context.lineWidth = strokeWidth
					context.stroke()

					// Draw inner box
					context.strokeStyle = '#DFFAFF'
					strokeWidth = 2
					context.beginPath()
					context.rect(
						this.variables.startMood + strokeWidth / 2,
						this.variables.endMood + strokeWidth / 2,
						this.variables.width - strokeWidth,
						this.variables.borderHeight - strokeWidth,
					)
					context.stroke()
				} catch (e) {
					console.error('Error drawing health bar')
				}
			}

			/**
			 * Renders the player's focus bar on the profile image.
			 *
			 * This function is responsible for drawing the player's focus bar on the profile image canvas. It uses the `variables`
			 * object to determine the position, size, and appearance of the focus bar.
			 */
			const drawFocusBar = () => {
				try {
					let strokeWidth = 3
					const focusFillWidth =
						(((userData?.focus || 4) * 10) / 100) * this.variables.width

					// Draw the filled portion
					if (focusFillWidth > 0) {
						context.beginPath()
						context.fillStyle = this.variables.fillColor
						context.rect(
							this.variables.startFocus,
							this.variables.endFocus,
							focusFillWidth,
							this.variables.height,
						)
						context.fill()
					}

					// Draw outer box
					context.beginPath()
					context.rect(
						this.variables.startFocus,
						this.variables.endFocus,
						this.variables.width,
						this.variables.borderHeight,
					)
					context.strokeStyle = this.variables.fillColor
					context.lineWidth = strokeWidth
					context.stroke()

					// Draw inner box
					context.strokeStyle = '#DFFAFF'
					strokeWidth = 2
					context.beginPath()
					context.rect(
						this.variables.startFocus + strokeWidth / 2,
						this.variables.endFocus + strokeWidth / 2,
						this.variables.width - strokeWidth,
						this.variables.borderHeight - strokeWidth,
					)
					context.stroke()
				} catch (e) {
					console.error('Error drawing health bar')
				}
			}

			/**
			 * Renders the player's mana bar on the profile image.
			 *
			 * This function is responsible for drawing the player's mana bar on the profile image canvas. It uses the `variables`
			 * object to determine the position, size, and appearance of the mana bar.
			 */
			const drawManaBar = () => {
				try {
					let strokeWidth = 3
					const manaFillWidth =
						(((userData?.mana || 4) * 10) / 100) * this.variables.width

					// Draw the filled portion
					if (manaFillWidth > 0) {
						context.beginPath()
						context.fillStyle = this.variables.fillColor
						context.rect(
							this.variables.startMana,
							this.variables.endMana,
							manaFillWidth,
							this.variables.height,
						)
						context.fill()
					}

					// Draw outer box
					context.beginPath()
					context.rect(
						this.variables.startMana,
						this.variables.endMana,
						this.variables.width,
						this.variables.borderHeight,
					)
					context.strokeStyle = this.variables.fillColor
					context.lineWidth = strokeWidth
					context.stroke()

					// Draw inner box
					context.strokeStyle = '#DFFAFF'
					strokeWidth = 2
					context.beginPath()
					context.rect(
						this.variables.startMana + strokeWidth / 2,
						this.variables.endMana + strokeWidth / 2,
						this.variables.width - strokeWidth,
						this.variables.borderHeight - strokeWidth,
					)
					context.stroke()
				} catch (e) {
					console.error('Error drawing mana bar')
				}
			}

			const addCharacterInfo = () => {
				context.font = this.variables.levelFont
				context.fillStyle = this.variables.levelColor
				context.fillText(userData?.class?.toString() || 'Not Set', 156, 557)
				context.font = this.variables.levelFont
				context.fillStyle = this.variables.levelColor
				context.fillText(userData?.level?.toString() || '???', 156, 523)
			}

			const addTimeStamp = () => {
				context.font = this.variables.timeFont
				context.fillStyle = this.variables.nameColor
				context.fillText(userData?.timestamp || 'Set stats to get a time stamp', 360, 360)
			}

			const addRaidEmblems = async () => {
				let x = 0
				let y = 0
				for (const [key, value] of Object.entries(data.serverBadges)) {
					for (const badge of userData.badges) {
						if (badge === key) {
							context.drawImage(
								await loadImage(encodeURI(String(value))),
								945 - x * 80,
								50 + y * 80,
								80,
								80,
							)
							x++
							if (x >= 3) {
								x = 0
								y++
							}
						}
					}
				}
			}

			createNameText()
			addCharacterInfo()
			drawHealthBar()
			drawMoodBar()
			drawFocusBar()
			drawManaBar()
			addTimeStamp()
			await addRaidEmblems()
			const buffer = await canvas.toBuffer('image/png')
			return test
				? await fs.writeFileSync('profile.png', buffer)
				: {
						buffer: buffer,
						name: 'profile.png',
					}
		} catch (e) {
			console.log(`Error while creating profile pic: ${e}`)
		}
	}

	callWorker = async (data, timeout = 10000) => {
		try {
			return new Promise((resolve, reject) => {
				const timeoutId = setTimeout(() => {
					reject(new Error('Worker timeout'))
				}, timeout)

				const handler = (response) => {
					if (response.type === 'profile') {
						clearTimeout(timeoutId)
						creatorWorker.removeListener('message', handler)
						resolve(response)
					} else if (response.type === 'profile:error') {
						clearTimeout(timeoutId)
						creatorWorker.removeListener('message', handler)
						reject(new Error(response.error))
					}
				}

				creatorWorker.on('message', handler)

				creatorWorker.postMessage({
					data: {
						...data,
						type: 'profile',
					},
				})
			})
		} catch (e) {
			console.log(`Error while calling worker for profile pic generation: ${e}`)
		}
	}

	/**
	 * Set the user's main quest in the guild.
	 * @param {String} guildId - The ID of the guild.
	 * @param {String} userId - The ID of the user.
	 * @param {Object} quest - The quest object to set as the user's main quest.
	 * @returns {Promise<void>}
	 */
	setUserQuest = async (guildId, userId, quest) => {
		try {
			const data = JSON.parse(await this.client.hget(`${guildId}:users`, userId))
			data.mainQuest = quest
			await this.client.hset(`${guildId}:users`, userId, JSON.stringify(data))
		} catch (e) {
			console.log(`Error while setting user quest: ${e}`)
		}
	}

	getUserQuest = async (guildId, userId) => {
		try {
			const data = JSON.parse(await this.client.hget(`${guildId}:users`, userId))
			return data.mainQuest
		} catch (e) {
			console.log(`Error while getting user quest: ${e}`)
			return false
		}
	}

	/**
	 * Get the users econ in the guild
	 * @param {String} guildId - guild id
	 * @param {String} userId - user id
	 * @returns {Promise<number>}
	 */
	getUserEcon = async (guildId, userId) => {
		try {
			const data = JSON.parse(await this.client.hget(`${guildId}:users`, userId))
			return data.econ
		} catch (e) {
			console.log(`Error while getting user econ: ${e}`)
		}
	}

	/**
	 * Get the users private vc they own
	 * @param {String} guildId - guild id
	 * @param {String} userId - user id
	 * @returns {Promise<[]>}
	 */
	getUserPrivateChannels = async (guildId, userId) => {
		try {
			const data = JSON.parse(await this.client.hget(`${guildId}:users`, userId))
			return data.privateChannels
		} catch (e) {
			console.log(`Error while getting user private channels: ${e}`)
		}
	}

	/**
	 * Get the time the user joined the voice channel.
	 * @param {String} guildId - The ID of the guild.
	 * @param {String} userId - The ID of the user.
	 * @returns {Promise<String>} - The time the user joined the voice channel.
	 */
	getUserVCJoined = async (guildId, userId) => {
		try {
			const data = JSON.parse(await this.client.hget(`${guildId}:users`, userId))
			return data.vcJoined
		} catch (e) {
			console.log(`Error while getting user vc joined: ${e}`)
		}
	}

	/**
	 * Get the users vc hours
	 * @param {String} guildId - guild id
	 * @param {String} userId - user id
	 * @returns {Promise<number>} - The number of hours the user has spent in voice channels
	 */
	getUserHoursVC = async (guildId, userId) => {
		try {
			const data = JSON.parse(await this.client.hget(`${guildId}:users`, userId))
			return data.hoursVC
		} catch (e) {
			console.log(`Error while getting user hours vc: ${e}`)
		}
	}

	/**
	 * Increment the users message count
	 * @param {String} guildId - guild id
	 * @param {String} userId - user id
	 * @returns {Promise<void>}
	 */
	incrementUserMessageCount = async (guildId, userId) => {
		try {
			let userData = JSON.parse(await this.client.hget(`${guildId}:users`, userId))
			userData.messages++
			await this.client.hset(`${guildId}:users`, userId, JSON.stringify(userData))
		} catch (e) {
			console.log(`Error while incrementing user message count: ${e}`)
		}
	}

	/**
	 * Update the users profile data
	 * @param {String} guildId - guild id
	 * @param {String} userId - user id
	 * @param {Array} data - data to update
	 * @param {number} [data.hp] - health
	 * @param {number} [data.mood] - mood
	 * @param {number} [data.focus] - focus
	 * @param {number} [data.mana] - mana
	 * @param {number} [data.level] - level
	 * @param {String} [data.class] - class
	 * @param {String} [data.timezone] - user timezone
	 * @param {Object} [data.mainQuest] - main quest
	 * @param {String} [data.vcJoined] - time user joined vc
	 * @param {Array} [data.badges] - user badges earned
	 * @param {number} [data.econ] - user econ
	 * @returns {Promise<void>}
	 */
	updateUserProfile = async (guildId, userId, data) => {
		try {
			let userData = JSON.parse(await this.client.hget(`${guildId}:users`, userId))
			for (const key in data) {
				userData[key] = data[key]
			}
			await this.client.hset(`${guildId}:users`, userId, JSON.stringify(userData))
		} catch (e) {
			console.log(`Error while updating user profile: ${e}`)
		}
	}

	/**
	 * Update the users vc hours
	 * @param {String} guildId - guild id
	 * @param {String} userId - user id
	 * @param {number} hours - amount of hours to add
	 * @returns {Promise<void>}
	 */
	updateUserVCHours = async (guildId, userId, hours) => {
		try {
			let userData = JSON.parse(await this.client.hget(`${guildId}:users`, userId))
			userData.hoursVC += hours
			await this.client.hset(`${guildId}:users`, userId, JSON.stringify(userData))
		} catch (e) {
			console.log(`Error while updating user vc hours: ${e}`)
		}
	}

	/**
	 * Update a users econ either add or remove econ
	 * @param {String} guildId - guild id
	 * @param {String} userId - user id
	 * @param {number} econ - amount of econ to add or remove
	 * @param {Boolean} add - default is true
	 * @returns {Promise<void>}
	 */
	updateUserEcon = async (guildId, userId, econ, add = true) => {
		try {
			let data = JSON.parse(await this.client.hget(`${guildId}:users`, userId))
			data.econ = add ? data.econ + econ : data.econ - econ
			await this.client.hset(`${guildId}:users`, userId, JSON.stringify(data))
		} catch (e) {
			console.log(`Error while updating user econ: ${e}`)
		}
	}

	/**
	 * Update the user's badges in the guild
	 * @param {String} guildId - The ID of the guild
	 * @param {String} userId - The ID of the user
	 * @param {Array} badges - The badges to add or remove
	 * @param {Boolean} [add=true] - Whether to add or remove the badges
	 * @returns {Promise<void>}
	 */
	updateUserBadges = async (guildId, userId, badges, add = true) => {
		try {
			let data = JSON.parse(await this.client.hget(`${guildId}:users`, userId))
			add
				? data.badges.push(badges)
				: (data.badges = data.badges.filter((badge) => !badges.includes(badge)))
			await this.client.hset(`${guildId}:users`, userId, JSON.stringify(data))
		} catch (e) {
			console.log(`Error while updating user badges: ${e}`)
		}
	}

	updateUserPrivateChannels = async (guildId, userId, privateChannel) => {
		try {
			let data = JSON.parse(await this.client.hget(`${guildId}:users`, userId))
			data.privateChannels.push(privateChannel)
			await this.client.hset(`${guildId}:users`, userId, JSON.stringify(data))
		} catch (e) {
			console.log(`Error while updating user private channels: ${e}`)
		}
	}
}

export const userActions = new UserClass()
