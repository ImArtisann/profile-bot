import { MongoClient  } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();

class DatabaseMongoDB {
    constructor() {
        this.client = new MongoClient(process.env.MONGO_URI);
        this.database = null;
        this.collection = null;
    }


    async connect() {
        try {
            this.database = this.client.db('gamify');
            this.collection = this.database.collection('users');
            await this.client.connect();
            console.log('Connected to MongoDB');
        } catch (e) {
            console.error('Ran into an error connecting to mongo')
        }
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
}

export const databaseActions = new DatabaseMongoDB();