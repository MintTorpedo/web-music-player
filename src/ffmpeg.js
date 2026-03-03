const terminal = require('./terminal.js');

exports.getDuration = async function(filePath) {
	let [duration, err] = await terminal.execFile('ffprobe', [
		'-v', 'error',
		'-show_entries', 'format=duration',
		'-of', 'default=noprint_wrappers=1:nokey=1',
		filePath
	]);

	if (err) return;

	return Math.ceil(parseFloat(duration.trim()));;
}

exports.getLoudness = async function(filePath) {
	//if (true) return -7;

	let [_, metadata] = await terminal.exec(`ffmpeg -i "${filePath}" -af loudnorm=print_format=json -f null -`);
	metadata = metadata.match(/\{[\s\S]*\}/);

	if (!metadata) return;

	metadata = JSON.parse( metadata[0] );
	//console.log('ffmpeg metadata', metadata);

	const loudness = metadata.input_i;
	//console.log('loudness', loudness);

	return parseFloat(loudness);
}