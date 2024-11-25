import { REST, Routes, Collection, Events } from 'discord.js'
import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import 'dotenv/config'
import { guildActions } from '../actions/guildActions.js'

const __dirname = dirname(dirname(fileURLToPath(import.meta.url)))

class CommandRegister {
	/**
	 * Create a new SlashCommandHandler
	 * @param {Client<Boolean>} client - The Discord client
	 */
	constructor(client) {
		/**
		 * Discord client
		 * @type {Client<Boolean>}
		 */
		this.client = client

		/**
		 * Collection to store commands
		 * @type {import(discord.js).Collection}
		 */
		this.client.commands = new Collection()

		/**
		 * Path to commands folder
		 * @type {string}
		 */
		this.commandsPath = path.join(__dirname, 'commands')

		/**
		 * REST client for command registration
		 * @type {REST}
		 */
		this.rest = null
	}

	/**
	 * Load and register slash commands
	 */
	async loadCommands() {
		const commands = []

		// Read command category folders
		const commandFolders = fs.readdirSync(this.commandsPath)

		for (const folder of commandFolders) {
			// Path to specific command category
			const categoryPath = path.join(this.commandsPath, folder)

			// Get JS files in this category
			const commandFiles = fs
				.readdirSync(categoryPath)
				.filter((file) => file.endsWith('.js'))

			for (const file of commandFiles) {
				const filePath = path.join(categoryPath, file)

				try {
					// Dynamically import the command
					const commandModule = await import(pathToFileURL(filePath))

					// Support both default export and named export
					const command = commandModule.default || commandModule

					// Validate command structure
					if (command.data && command.execute) {
						// Store command in client's commands collection
						this.client.commands.set(command.data.name, command)

						// Add to commands array for registration
						commands.push(command.data.toJSON())

						console.log(`Loaded slash command: ${command.data.name}`)
					} else {
						console.warn(
							`[WARNING] Command at ${filePath} is missing required "data" or "execute" property.`,
						)
					}
				} catch (error) {
					console.error(`Error loading command from ${file}:`, error)
				}
			}
		}

		// Register commands based on environment
		await this.registerCommands(commands)

		return commands
	}

	/**
	 * Register commands with Discord based on environment
	 * @param {Array} commands - Array of command data to register
	 */
	async registerCommands(commands) {
		try {
			console.log(`Started refreshing ${commands.length} application (/) commands.`)

			// Determine environment and set up REST client
			const isTestEnvironment = process.env.NODE_ENV === 'development'

			if (isTestEnvironment) {
				// Development: Register to specific guild
				this.rest = new REST().setToken(process.env.TEST_BOT_TOKEN)
				const data = await this.rest.put(
					Routes.applicationGuildCommands(
						process.env.TEST_CLIENT_ID,
						process.env.TEST_GUILD_ID,
					),
					{ body: commands },
				)
				console.log(`Successfully reloaded ${data.length} guild (/) commands.`)
			} else {
				// Production: Register globally
				this.rest = new REST().setToken(process.env.BOT_TOKEN)
				const data = await this.rest.put(
					Routes.applicationCommands(process.env.CLIENT_ID),
					{ body: commands },
				)
				console.log(`Successfully reloaded ${data.length} global (/) commands.`)
			}
		} catch (error) {
			console.error('Failed to register commands:', error)
		}
	}

	/**
	 * Setup command interaction handler
	 */
	setupInteractionHandler() {
		this.client.on(Events.InteractionCreate, async (interaction) => {
			// Check if it's a slash command interaction
			if (interaction.isChatInputCommand()) {
				// Find the command
				const command = this.client.commands.get(interaction.commandName)

				if (!command) {
					console.error(`No command matching ${interaction.commandName} was found.`)
					return
				}

				try {
					await command.execute(interaction)
				} catch (error) {
					console.error(error)
					if (interaction.replied || interaction.deferred) {
						await interaction.followUp({
							content: 'There was an error while executing this command!',
							ephemeral: true,
						})
					} else {
						await interaction.reply({
							content: 'There was an error while executing this command!',
							ephemeral: true,
						})
					}
				}
			} else if (interaction.isAutocomplete()) {
				const command = this.client.commands.get(interaction.commandName)

				if (!command) {
					console.error(
						`No command matching ${interaction.commandName} was found for autocomplete.`,
					)
					return
				}

				try {
					// Check if command has a static choices property
					if (command.choices) {
						const focusedValue = interaction.options.getFocused()
						const filtered = command.choices.filter((choice) =>
							choice.name.toLowerCase().startsWith(focusedValue.toLowerCase()),
						)

						await interaction.respond(
							filtered.map((choice) => ({
								name: choice.name,
								value: choice.value,
							})),
						)
					} else if (
						interaction.commandName === 'config' &&
						interaction.options.getSubcommand() === 'badge'
					) {
						const badges = await guildActions.getServerBadgesNames(interaction.guild.id)
						await interaction.respond(
							badges.map((badge) => ({
								name: badge,
								value: badge,
							})),
						)
					} else if (command.autocomplete) {
						await command.autocomplete(interaction)
					}
				} catch (error) {
					console.error(`Error during autocomplete for ${interaction.commandName}`, error)
				}
			}
		})
	}
}

export default CommandRegister
