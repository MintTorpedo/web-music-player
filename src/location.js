const path = require('path');

const locations = {
	'DATABASE': './core.db',
	'SCHEMA': './schema.sql',

	'MEDIA': './public/media',
}

for (const [index, value] of Object.entries(locations)) {
	exports[index] = path.resolve(value);
}