const express = require('express');
const path    = require('path');
const fs      = require('fs');

const Track    = require('./src/track.js');
const database = require('./src/database.js');
const ffmpeg   = require('./src/ffmpeg.js');
const hash     = require('./src/hash.js');
const media    = require('./src/media.js');

media.setLocation('./public/media/images/');

const app = express();
const port = 8120;

app.use(express.static(__dirname + '../public'));
app.use(express.json());

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

const queue = [];
let processing = false;
async function QueueLoudness(filePath, callback) {
	// if (true) return;

	queue.push({
		'path': filePath,
		'callback': callback
	});

	if (processing) return;
	processing = true;

	while (queue.length > 0) {
		const info = queue[0];
		queue.splice(0, 1);

		let value;
		try {
			value = await ffmpeg.getLoudness(info.path);

		} catch(err) {
			console.log('ERROR', err);
		}

		info.callback(value);
		console.log('Loudness left in queue:', queue.length);
	}

	processing = false;
	console.log('Finished adding loudness!')
}

function FindByImageHash(imageHash) {
	const children = database.mediaGetAll();

	for (let i=0; i < children.length; i++) {
		const data = children[i];
		const targetImageHash = data.image_hash;
		if (!targetImageHash) return;

		if ( !hash.imageIsSame(imageHash, targetImageHash) ) {
			continue;
		}

		return data;
	}
}

async function SaveImage(track) {
	const fileHash = track.getCoverHash();

	let savedMedia = database.mediaGet(fileHash);
	if ( savedMedia ) return savedMedia.filename;

	const uniqueHash = hash.random();
	const destination = track.getCoverDestination(uniqueHash);
	track.saveCoverImage(destination);
	
	const imageHash = await hash.fromImage(destination);
	savedMedia = FindByImageHash(imageHash);

	if ( savedMedia ) {
		fs.unlinkSync(destination);
		console.log('REMOVE IMAGE DUPLICATE');

		return savedMedia.filename;
	}

	const filename = path.basename(destination);
	const success = database.insert('media', filename, fileHash, imageHash);
	if (success) {
		return filename;
	}
	
	fs.unlinkSync(destination);
	console.log('UNKNOWN ERROR');
}

async function AddTrack(filePath) {
	console.log('\n', filePath);

	const filename = path.basename(filePath)
	if ( database.trackGetFilename(filename) ) return console.log('Track already registered');

	const duration = await ffmpeg.getDuration(filePath);
	if (!duration) return; // Check if file is corrupt

	const track = await Track.new(filePath);
	//console.log(track);

	let coverFilename;
	if (track.cover) {
		media.uploadFromData(track.cover.data, track.coverFormat);
		// coverFilename = await SaveImage(track);
	}

	const trackId = database.insertGet('track', track.title, track.path, track.filename, coverFilename, duration, track.year);
	QueueLoudness(filePath, loudness => {
		if (!loudness) return;

		database.updateTrack(trackId, 'loudness', loudness);
		console.log('Loudness updated', track.filename, loudness);
	});

	track.artists.forEach(name => {
		const artistId = database.insertGet('artist', name);
		database.insert('artistrel', trackId, artistId);
	});

	const albumName = track.album;
	if (!albumName) return;
	
	const albumId = database.insertGet('album', albumName, coverFilename);
	database.insert('albumrel', trackId, albumId, track.position);

	//console.log('TRACK', track);
}

app.use(express.json());
app.get('/api/track/all', (req, res) => {
	res.set('Cache-Control', 'public');
	res.json( database.trackGetall() );
});

app.get('/api/artist/all', (req, res) => {
	res.set('Cache-Control', 'public');
	res.json( database.artistGetall() );
});

app.get('/api/album/all', (req, res) => {
	res.set('Cache-Control', 'public');
	res.json( database.albumGetAll() );
})

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, '0.0.0.0', () => {
	console.log(`Server running at https://localhost:${port}/`);
});

//Track.deepSearch('./public/music/Sticklovers', AddTrack);
//Track.deepSearch('./public/music/min', AddTrack);