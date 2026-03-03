const crypto = require('crypto');
const fs = require('fs');

const sharp = require('sharp');
const path = require('path');
const { bmvbhash } = require('blockhash-core');

exports.fromImageOLD = function(filePath) {
	return new Promise(async (resolve, reject) => {
		const ext = path.extname(filePath);
		if (ext == '.gif' || ext == '.mp4' || ext == '.webm') {
			return resolve();
		}

		const { data, info } = await sharp(filePath)
			.resize({width: 128})
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });

		const pixels = {
			'data': data,
			'width': info.width,
			'height': info.height
		};

		const hash = bmvbhash(pixels, 6);
		console.log('Image hash:', hash);

		return resolve(hash);
	});
}

exports.fromImage = function(filePath) {
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

exports.imageIsSame = function(hashHexA, hashHexB) {
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

exports.fromData = function(uintArray) {
	const data = Buffer.from(uintArray);

	return crypto.createHash('md5')
		.update(data, 'utf-8')
		.digest('hex');
}

exports.fromFile = function(filePath) {
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

exports.random = function() {
	return crypto.randomBytes(16).toString('hex');
}