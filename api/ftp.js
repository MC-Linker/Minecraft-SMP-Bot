const ftp = require('ftp');
const fs = require('fs-extra');
const { promisify } = require('util');
const utils = require('./utils');
const sftp = require('./sftp');
const plugin = require('./plugin');
const { keys, addPh, ph } = require('./messages');

module.exports = {
	get: function (getPath, putPath, message) {
		return new Promise(async resolve => {
			const protocol = await utils.getProtocol(message.guild.id, message);

			//Redirect to other protocols
			if(protocol === 'sftp') return resolve(await sftp.get(getPath, putPath, message));
			else if(protocol === 'plugin') return resolve(await plugin.get(getPath, putPath, message));

			const ftpData = await utils.getServerData(message.guild.id, message);
			if(!ftpData) return;

			const ftpClient = new ftp();
			ftpClient.on('error', err => {
				message.respond(keys.api.ftp.errors.unknown_ftp_error, ph.fromError(err));
				resolve(false);
			});

			try {
				ftpClient.connect({
					host: ftpData.host,
					user: ftpData.user,
					password: ftpData.password,
					port: ftpData.port,
					secureOptions: {
						rejectUnauthorized: false,
					},
				});
			} catch (err) {
				message.respond(keys.api.ftp.errors.could_not_connect, ph.fromError(err));
				resolve(false);
			}

			ftpClient.on('ready', () => {
				ftpClient.get(getPath, (err, stream) => {
					if(err) {
						message.respond(keys.api.ftp.errors.could_not_get, { "path": putPath, "error": err });
						resolve(false);
					} else {
						stream.pipe(fs.createWriteStream(putPath));
						stream.once('close', () => {
							ftpClient.end();
							resolve(true);
							message.respond(keys.api.ftp.success.get, { "path": putPath });
						});
					}
				});
			});
		});
	},

	put: function (getPath, putPath, message) {
		return new Promise(async resolve => {
			const protocol = await utils.getProtocol(message.guild.id, message);

			//Redirect to other protocols
			if(protocol === 'sftp') return resolve(await sftp.get(getPath, putPath, message));
			else if(protocol === 'plugin') return resolve(await plugin.get(getPath, putPath, message));

			const ftpData = await utils.getServerData(message.guild.id, message);
			if(!ftpData) return;

			const ftpClient = new ftp();
			ftpClient.on('error', err => {
				message.respond(keys.api.ftp.errors.unknown_ftp_error, ph.fromError(err));
				resolve(false);
			});

			try {
				ftpClient.connect({
					host: ftpData.host,
					user: ftpData.user,
					password: ftpData.password,
					port: ftpData.port,
					secureOptions: {
						rejectUnauthorized: false,
					},
				});
			} catch (err) {
				message.respond(keys.api.ftp.errors.could_not_connect, ph.fromError(err));
				resolve(false);
			}

			ftpClient.on('ready', () => {
				ftpClient.put(getPath, putPath, err => {
					if (err) {
						message.respond(keys.api.ftp.errors.could_not_put, { "path": putPath, "error": err });
						resolve(false);
					} else {
						ftpClient.end();
						ftpClient.on('close', () => {
							message.respond(keys.api.ftp.success.put, { "path": putPath });
							resolve(true);
						});
					}
				});
			});
		});
	},

	connect: function(credentials) {
		return new Promise(resolve => {
			const ftpClient = new ftp();
			ftpClient.on('error', err => {
				console.log(addPh(keys.api.ftp.errors.unknown_ftp_error.console, ph.fromError(err)));
				resolve(false);
			});
			try {
				ftpClient.connect({
					host: credentials.host,
					port: credentials.port,
					user: credentials.user,
					password: credentials.pass,
					secureOptions: {
						rejectUnauthorized: false,
					},
				});
			} catch (err) {
				console.log(addPh(keys.api.ftp.errors.could_not_connect, ph.fromError(err)));
				resolve(false);
			}
			ftpClient.on('ready', () => {
				ftpClient.end();
				console.log(keys.api.ftp.success.connect.console);
				resolve(true);
			});
		});
	},

	find: function(file, start, maxDepth, credentials) {
		return new Promise(resolve => {
			const ftpClient = new ftp();
			ftpClient.on('error', err => {
				console.log(addPh(keys.api.ftp.errors.unknown_ftp_error.console, ph.fromError(err)));
				resolve();
			});
			try {
				ftpClient.connect({
					host: credentials.host,
					port: credentials.port,
					user: credentials.user,
					password: credentials.pass,
					secureOptions: {
						rejectUnauthorized: false,
					},
				});
			} catch (err) {
				console.log(addPh(keys.api.ftp.errors.could_not_connect, ph.fromError(err)));
				resolve();
			}
			ftpClient.on('ready', async () => {
				const foundFile = await findFile(ftpClient, file, start, maxDepth);
				console.log(addPh(keys.api.ftp.success.find.console, { "path": foundFile }));
				resolve(foundFile);
			});
		});
	}
};

async function findFile(ftpClient, file, path, maxDepth) {
	if (path.split('/').length >= maxDepth++) return;

	const list = await promisify(ftpClient.list).call(ftpClient, path);

	for (const item of list) {
		if (item.type === '-' && item.name === file) return path;
		else if (typeof item === 'string' && item.startsWith('-') && item.split(' ').pop() === file) return path;

		else if(typeof item === 'string' && item.startsWith('d')) {
			let res = await findFile(ftpClient, file, `${path}/${item.split(' ').pop()}`, maxDepth);
			if (res) return res;
		} else if(item.type === 'd') {
			let res = await findFile(ftpClient, file, `${path}/${item.name}`, maxDepth);
			if (res) return res;
		}
	}
}