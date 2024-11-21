import { MongoClient  } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();

class DatabaseMongoDB {
    constructor() {
        this.client = new MongoClient(process.env.MONGO_URI);
        this.database = null;
        this.collection = null;
        this.configDB = null;
        this.configCollection = null;
        this.roomCollection = null;
    }


    async connect() {
        try {
            this.database = this.client.db('gamify');
            this.collection = this.database.collection('users');
            this.configDB = this.client.db('servers');
            this.configCollection = this.configDB.collection('config');
            this.roomCollection = this.configDB.collection('rooms');
            await this.client.connect();
            console.log('Connected to MongoDB');
        } catch (e) {
            console.error('Ran into an error connecting to mongo')
        }
    }

    getClient() {
        return this.client;
    }

    async getUser(user) {
        return this.collection.find({_id: user}).toArray()
    }

    async updateUser(user, data) {
        let profile = await this.getUser(user)
        if (profile.length > 0) {
            return this.collection.updateOne({_id: user}, {$set: data})
        } else {
            return this.collection.insertOne({_id: user, ...data})
        }
    }

    async getUsers() {
        return this.collection.find({}).toArray()
    }

    async getConfig(guild) {
        return this.configCollection.find({_id: guild}).toArray()
    }

    async updateConfig(guild, data) {
        let config = await this.getConfig(guild)
        if (config.length > 0) {
            return this.configCollection.updateOne({_id: guild}, {$set: data})
        } else {
            return this.configCollection.insertOne({_id: guild, ...data})
        }
    }

    async getRooms() {
        return this.roomCollection.find({}).toArray()
    }

    async getRoom(id) {
        return this.roomCollection.find({_id: id}).toArray()
    }

    async updateRoom(roomId, data) {
        let roomData = await this.getRooms(roomId)
        if (roomData.length > 0) {
            return this.roomCollection.updateOne({_id: roomId}, {$set: data})
        } else {
            return this.roomCollection.insertOne({_id: roomId, ...data})
        }
    }
}

export const databaseActions = new DatabaseMongoDB();