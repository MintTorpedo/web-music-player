const sharp = require('sharp');
const path = require('path');

const LOCATION = require('./location.js');
const db = require('better-sqlite3')(LOCATION.DATABASE);

db.exec(`
CREATE TABLE IF NOT EXISTS media (
	id INTEGER PRIMARY KEY,
	description TEXT,

	filename TEXT NOT NULL UNIQUE,
	file_hash TEXT NOT NULL UNIQUE,
	image_hash TEXT UNIQUE,

	creation TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
) STRICT;
`);

const sql_media_add = db.prepare(`INSERT OR IGNORE INTO media (filename, file_hash, image_hash) VALUES (?, ?, ?)`);
const sql_media_get = db.prepare(`SELECT * FROM media WHERE id = ? LIMIT 1`);
const sql_media_get_by_hash =  db.prepare(`SELECT * FROM media WHERE file_hash = ? LIMIT 1`);
const sql_media_get_all = db.prepare(`SELECT filename, image_hash FROM media`);

let uploadLocation;

function FileHashFromPath(filePath) {
	return new Promise((resolve, reject) => {
		const hash = crypto.createHash('md5');
		const stream = fs.createReadStream(filePath);

		stream.on('error', reject);

		stream.on('data', chunk => {
			hash.update(chunk);
		});

		stream.on('end', () => {
			const fileHash = hash.digest('hex');

			resolve(fileHash);
		});
	});
}

function FileHashFromData(uintArray) {
	const data = Buffer.from(uintArray);

	return crypto.createHash('md5')
		.update(data, 'utf-8')
		.digest('hex');
}

function GenerateImageHash(filePath) {
	return new Promise(async (resolve, reject) => {
		const ext = path.extname(filePath);
		if (ext == '.gif' || ext == '.mp4' || ext == '.webm') {
			return resolve();
		}

		const { data } = await sharp(filePath)
			.resize(9, 8, { fit: 'fill' })
			.grayscale()
			.raw()
			.toBuffer({ resolveWithObject: true });

		let hash = 0n;
		let bit = 1n;

		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 8; x++) {
				const left = data[y * 9 + x];
				const right = data[y * 9 + x + 1];
				if (left > right) hash |= bit;
				bit <<= 1n;
			}
		}

		hash = hash.toString(16).padStart(16, '0');

		console.log('Image hash:', hash);
		return resolve(hash);  // 64-bit perceptual hash
	});
}

function IsSameHash(hashHexA, hashHexB) {
	const a = BigInt('0x' + hashHexA);
	const b = BigInt('0x' + hashHexB);

	let x = a ^ b;
	let distance = 0;
	while (x) {
		x &= x - 1n;
		distance++;
	}

	// < 10 almost same
	// < 15 visually similar

	return distance < 10;
}

exports.setLocation = function(givenPath) {
	uploadLocation = path.join(__dirname, givenPath);
}

exports.uploadFromData = async function(imageData, ext) {
	const fileHash = await FileHashFromData(imageData);
	let fileInfo = sql_media_get_by_hash.get(fileHash);
	if (fileInfo) {
		return fileInfo.id;
	}

	const destination = path.join(uploadLocation, fileHash + ext);
	fs.writeFileSync( destination, imageData );

	const imageHash = await GenerateImageHash(filePath);
	const children = sql_media_get_all.all();

	for (let i = 0; i < children.length; i++) {
		const targetFileInfo = children[i];
		if ( IsSameHash(targetFileInfo.image_hash, imageHash) ) continue;

		fileInfo = targetFileInfo;
		break;
	}

	if (fileInfo) return fileInfo.id;

	const filename = path.basename(filePath)
	const result = sql_media_add.run(filename, fileHash, imageHash);
	fileInfo = sql_media_get.get(result.lastInsertRowid);

	return fileInfo.id;
}