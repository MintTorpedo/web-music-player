const LOCATION = require('./location.js');

const db = require('better-sqlite3')(LOCATION.DATABASE);
const fs = require('fs');

db.pragma('journal_mode = WAL');

const schema = fs.readFileSync(LOCATION.SCHEMA, 'utf-8');
db.exec(schema);

const sql = require('./sql-queries.js');

function insertCommand(tableName, args) {
	const queryInfo = sql.get(tableName, 'add');
	queryInfo.parseArgs(args);

	let rowId = 0;
	try {
		const result = queryInfo.exec('run', ...args);
		rowId = result.lastInsertRowid;

	} catch(err) {
		console.warn(err);
	}

	if (rowId === 0) {
		console.log('\x1b[31m%s\x1b[0m', `[Database] Failed to insert "${tableName}" with ${JSON.stringify(args)}`);
		console.log('query:', queryInfo.query);
		return 0;
	}

	console.log('\x1b[36m%s\x1b[0m', `[Database] Inserted "${tableName}s" with ${JSON.stringify(args)}`);

	return rowId;
}

exports.insert = function(tableName, ...args) { // RETURNS BOOLEAN
	const rowId = insertCommand(tableName, args);
	return rowId != 0;
}

exports.insertGet = function(tableName, ...args) { // RETURNS ROW.ID 
	const queryInfo = sql.get(tableName, 'get');
	if (queryInfo) {
		const prevRow = queryInfo.exec('get', args[0]);
		if (prevRow) return prevRow.id;
	}

	const rowId = insertCommand(tableName, args);
	if (rowId === 0) return null;

	return rowId;
}


exports.mediaGet = function(fileHash) {
	return sql.get('media', 'get').exec('get', fileHash);
}

exports.mediaGetByImage = function(imageHash) {
	return sql.get('media', 'getByImage').exec('get', imageHash);
}

exports.mediaGetAll = function() {
	return sql.get('media', 'getAll').exec('all');
}

exports.trackGetall = function() {
	const result = sql.get('track', 'getAll').exec('all');

	result.forEach(row => {
		const artists = row.artists;
		row.artists = artists ? JSON.parse(row.artists) : [];
	});

	return result;
}

exports.trackGetFilename = function(location) {
	return sql.get('track', 'getByFilename').exec('get', location);
}

exports.artistGetall = function() {
	return sql.get('artist', 'getAll').exec('all');
}

exports.albumGetAll = function() {
	return sql.get('album', 'getAll').exec('all');
}

exports.updateTrack = function(trackId, property, value) {
	db.prepare(`UPDATE tracks SET ${property} = ? WHERE id = ? LIMIT 1`).run(value, trackId);
}