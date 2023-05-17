import { CachedManager } from 'discord.js';
import fs from 'fs-extra';
import { getManagerString } from '../api/shardingUtils.js';

export default class ConnectionManager extends CachedManager {

    /**
     * @typedef {ServerConnectionData|UserConnectionData|ServerSettingsConnectionData|UserSettingsConnectionData} ConnectionData - The data for any connection.
     */

    /**
     * @typedef {ServerConnectionResolvable|UserConnectionResolvable|ServerSettingsConnectionResolvable|UserSettingsConnectionResolvable} ConnectionResolvable - The resolvable for any connection.
     */

    /**
     * The server connection cache of this manager.
     * @type {import('discord.js').Collection<string, Connection>}
     */
    cache;

    /**
     * Creates a new ConnectionManager instance.
     * @param {MCLinker} client - The client to create the manager for.
     * @param {typeof Connection} holds - The type of connection the manager holds.
     * @param {CollectionName} collectionName - The name of the database collection that this manager controls.
     * @returns {ConnectionManager} - A new ConnectionManager instance.
     */
    constructor(client, holds, collectionName) {
        super(client, holds);

        /**
         * The name of the database collection that this manager controls.
         * @type {CollectionName}
         */
        this.collectionName = collectionName;

        /**
         * The connection cache of this manager.
         * @type {import('discord.js').Collection<string, Connection>}
         */
        this.cache = super.cache;
    }

    /**
     * Adds a connection to the cache and writes the data to the file system.
     * @param {ConnectionData} data - The data for the connection.
     * @returns {Promise<?Connection>} - The connection instance that has been created.
     */
    async connect(data) {
        /** @type {?Connection} */
        const connection = this._add(data, true, { extras: [this.collectionName] });
        if(connection && await connection._output()) {
            if('socket' in data) delete data.socket;// The socket is not serializable and should not be broadcasted
            //Broadcast to all shards
            await this.client.shard.broadcastEval((c, { data, manager, shard }) => {
                if(c.shard.ids.includes(shard)) return; // Don't patch the connection on the shard that edited it
                c[manager]._add(data, true, { extras: [c[manager].collectionName] });
            }, { context: { data, manager: getManagerString(this), shard: this.client.shard.ids[0] } });
            return connection;
        }
        else {
            this.cache.delete(this.resolveId(connection));
            return null;
        }
    }

    /**
     * Removes a connection from the cache and deletes the data from the file system.
     * @param {ConnectionResolvable} connection - The connection to disconnect.
     * @returns {Promise<boolean>} - Whether the disconnection was successful.
     */
    async disconnect(connection) {
        /** @type {?Connection} */
        const instance = this.resolve(connection);
        if(instance && await instance._delete()) {
            //Broadcast to all shards
            await this.client.shard.broadcastEval((c, { instanceId, manager, shard }) => {
                if(c.shard.ids.includes(shard)) return; // Don't patch the connection on the shard that edited it
                c[manager].cache.delete(instanceId);
            }, {
                context: { instanceId: instance.id, manager: getManagerString(this), shard: this.client.shard.ids[0] },
            });
            return this.cache.delete(this.resolveId(connection));
        }
        else return false;
    }

    /**
     * Loads all connections from the file system.
     * @returns {Promise<void>}
     */
    async _load() {
        const connections = await this.client.mongo.models[this.collectionName].find({});
        for(const connection of connections) {
            await this._add(connection, true, { extras: [this.collectionName] });
        }
    }

    /**
     * Removes the download cache folder for a connection.
     * @param {string} id - The id of the connection.
     * @returns {Promise<boolean>}
     */
    async removeCache(id) {
        try {
            await fs.rm(`./download-cache/${this.collectionName}/${id}/`, { recursive: true });
            return true;
        }
        catch(_) {
            return false;
        }
    }
}
