const LOCATION = require('./location.js');
const db = require('better-sqlite3')(LOCATION.DATABASE);

const sql = {};

sql.media = {};
sql.media.add = `INSERT OR IGNORE INTO media (filename, file_hash, image_hash) VALUES (?, ?, ?)`;
sql.media.get = `SELECT * FROM media WHERE file_hash = ? LIMIT 1`;
sql.media.getByImage = `SELECT * FROM media WHERE image_hash = ? LIMIT 1`;
sql.media.getAll = `SELECT filename, image_hash FROM media`;

sql.track = {};
sql.track.add = `INSERT OR IGNORE INTO tracks (name, location, filename, image, duration, year) VALUES (?, ?, ?, ?, ?, ?)`;
sql.track.get = `SELECT * FROM tracks WHERE name = ? LIMIT 1`;
sql.track.getByName = `SELECT * FROM tracks WHERE name = ? LIMIT 1`;
sql.track.getByFilename= `SELECT * FROM tracks WHERE filename = ? LIMIT 1`;
sql.track.getAll = `
	SELECT 
		tracks.*, 
		json_group_array(track_artists.artist_id) AS artists 
	FROM tracks
	LEFT JOIN track_artists ON tracks.id = track_artists.track_id
	GROUP BY tracks.id
`;

sql.artist = {};
sql.artist.add = `INSERT OR IGNORE INTO artists (name) VALUES (?)`;
sql.artist.get = `SELECT * FROM artists WHERE name = ? LIMIT 1`;
sql.artist.getByName = `SELECT * FROM artists WHERE name = ? LIMIT 1`;
sql.artist.getAll = `SELECT * FROM artists`;

sql.artistrel = {};
sql.artistrel.add = `INSERT OR IGNORE INTO track_artists (track_id, artist_id) VALUES(?, ?)`;

sql.album = {};
sql.album.add = `INSERT OR IGNORE INTO albums (name, image) VALUES (?, ?)`;
sql.album.get = `SELECT * FROM albums WHERE name = ? LIMIT 1`;
sql.album.getAll = `
	SELECT
		albums.*,
		json_group_array(track_albums.track_id ORDER BY track_albums.position) AS tracks
	FROM albums
	LEFT JOIN track_albums ON albums.id = track_albums.album_id
	GROUP BY albums.id
`;
sql.album.getByName = `SELECT * FROM albums WHERE name = ? LIMIT 1`;

sql.albumrel = {};
sql.albumrel.add = `INSERT OR IGNORE INTO track_albums (track_id, album_id, position) VALUES(?, ?, ?)`;


// 'query': query,
// 			'command': prepareQuery(tableName, query),
// 			'count': (query.split('?')).length - 1

class SqlQuery {
	constructor(query) {
		let command;

		try {
			command = db.prepare(query);

		} catch(err) {
			console.warn('Failed to prepare sql query: \n' + query);

			throw new Error(err);
		}

		this.command = command;
		this.query = query;
		this.paramCount = ( query.split('?') ).length - 1;
	}

	parseArgs(args) {
		for (let i = 0; i < this.paramCount; i++) {
			const value = args[i]
			if (value === undefined) {
				args[i] = null;
				continue;
			}

			args[i] = value;
		}
	}

	exec(operation, ...args) {
		this.parseArgs(args);
		return this.command[operation](...args);
	}
}

function iterate(targetObject, callback) {
	for (const [tableName, queries] of Object.entries(targetObject)) {
		for (const [queryName, query] of Object.entries(queries)) {
			callback(tableName, queryName, query);
		}
	}
}

const commands = {};
iterate(sql, (tableName, queryName, query) => {
	let table = commands[tableName];

	if ( !table ) {
		table = {}
		commands[tableName] = table;
	}

	table[queryName] = new SqlQuery(query);
});

exports.get = function(tableName, queryName) {
	const table = commands[tableName];
	if (!table) return console.error(`[SQL] No such table as "${tableName}"`);

	const queryInfo = table[queryName];
	return queryInfo;
}

//console.log('commands', commands);

exports.data = sql;
exports.commands = commands;