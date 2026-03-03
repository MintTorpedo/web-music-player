const { exec, execFile, spawn } = require('child_process');

exports.exec = function(command) {
	return new Promise((resolve, reject) => {
		exec(command, (err, stdout, stderr) => {
			if (err) {
				console.error(err);
				return reject([undefined, err]);
			}

			resolve([stdout, stderr]);
		});
	});
}

exports.execFile = function(command, options) {
	return new Promise((resolve, reject) => {
		execFile(command, options, (err, stdout) => {
			if (err) {
				console.error(err);
				return resolve([undefined, err]);
			}

			resolve([stdout.toString()]);
		});
	});
}

exports.spawn = function(command, options) {
	return new Promise((resolve, reject) => {
		const process = spawn(command, options);

		let output = '';
		process.stdout.on('data', data => {
			data = data.toString();

			output += data
			console.log(data);
		});

		process.stderr.on('data', data => {
			console.error(data);
		});

		process.on('close', code => {
			if (code !== 0) {
				console.warn('Error code: ' + code);
				return resolve([]);
			}

			resolve([output]);
		})
	});
}