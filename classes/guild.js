class ServerClass {
    constructor() {
        this.client = null;
        this.data = {
            roomRent: 150,
            econRate: 1,
            logChannelId: "",
            ticketChannelId: "",
            configChannelId: "",
            trackedChannelsIds: [],
            roomIds: [],
            serverRoleShop: [],
        }
    }

    async initialize(client) {
        this.client = client;
    }

    async createServer(guildId){
        await this.client.hset()
    }

}

export const serverActions = new ServerClass();