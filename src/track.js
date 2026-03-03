const mm = require('music-metadata');
const fs = require('fs');
const path = require('path');

const hash = require('./hash.js');

async function GetMetadata(filePath) {
	try {
		const metadata = await mm.parseFile(filePath);
		return metadata;
	} catch (err) {
		console.error('Error reading metadata:', err.message);
	}
}

function IsFile(filePath) {
	const stats = fs.statSync(filePath);
	return stats.isFile();
}

function RecursiveFileRead(parentPath, result) {
	if (!result) {
		result = [];
	}

	const filenames = fs.readdirSync(parentPath, { withFileTypes: true });

	for (let i = 0; i < filenames.length; i++) {
		const file = filenames[i];
		const childPath = path.join(parentPath, file.name);

		if ( file.isFile() ) {
			result.push(childPath);

		} else if ( file.isDirectory() ) {
			RecursiveFileRead(childPath, result);
		}
	}

	return result
}

class Track {
	constructor(dirPath) {
		this.fullPath = dirPath;
		this.path = dirPath.split('public/')[1];
		this.filename = path.basename(this.path);
		this.hasCover = false;
		this.coverHash = null;
	}

	orginazeMetadata() {
		const metadata = this.metadata;

		if (metadata.picture) {
			const cover = metadata.picture[0];
			const ext = '.' + cover.format.split('/')[1];

			this.coverFormat = ext;
			this.cover = cover;
		}

		this.title = metadata.title || path.basename(this.fullPath).split('.')[0];
		this.album = metadata.album;
		this.position = metadata.track.no || null;
		this.year = metadata.year;

		let artists = metadata.artists || [];
		if (artists.length === 1) {
			artists = artists[0].split(' x ');
		}

		this.artists = artists;
	}

	async loadMetadata() {
		if (this.metadata) return this.metadata;

		let metadata = await GetMetadata(this.fullPath);
		metadata = metadata.common;

		this.metadata = metadata;
		this.orginazeMetadata();
	}

	async loadFileHash() {
		this.hash = await hash.fromFile(this.fullPath);
	}

	getCoverHash() {
		if (this.coverHash) return this.coverHash;
		if (!this.cover) return;

		this.coverHash = hash.fromData(this.cover.data);
		return this.coverHash;
	}

	getCoverDestination(name) {
		const filename = name + this.coverFormat;
		const destination = path.join('./public/media/images/', filename);
		return destination;
	}

	saveCoverImage(destination) {
		const cover = this.cover;
		if (!cover) return;

		if ( !fs.existsSync(destination) ) {
			fs.writeFileSync( destination, cover.data );
		}

		return destination;
	}
}

async function NewTrack(location) {
	if ( !IsFile(location) ) return;

	const track = new Track(location);

	await track.loadMetadata();
	await track.loadFileHash();

	return track;
}

exports.new = NewTrack;

exports.deepSearch = async function(dirPath, callback) {
	let files = [];
	if ( IsFile(dirPath) ) {
		files = [dirPath];
	} else {
		files = RecursiveFileRead(dirPath);
	}

	console.log(files);

	for (let i = 0; i < files.length; i++) {
		const filePath = files[i];
		if ( path.extname(filePath) !== '.mp3' ) continue;

		await callback( filePath );
	}
}