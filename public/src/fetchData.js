let TRACKS = [];
let ARTISTS = [];
let ALBUMS = [];

const [TRACK_MAP, ALBUM_MAP, ARTIST_MAP] = [new Map(), new Map(), new Map()];

function GetImagePath(filename) {
	if (!filename) return null;

	return '/media/images/' + filename;
}

const fakeArtist = {
	'id': 0,
	'name': 'Youtube',
	'description': null,
}

async function LoadData() {
	const artists = await fetchJSON('/api/artist/all');
	artists.unshift(fakeArtist);

	for (let i = artists.length - 1; i >= 0; i--) {
		const artist = artists[i];
		if (!artist) {
			artists.splice(i, 1);
			continue
		};

		ARTIST_MAP.set(artist.id, artist);
		artist.image = GetImagePath(artist.image);

		artist.tracks = [];
		artist.albums = [];
	}

	ARTISTS = artists;
	console.log('Artists:', artists);


	const tracks = await fetchJSON('/api/track/all');
	tracks.forEach(track => {
		if (!track) return;

		TRACK_MAP.set(track.id, track);

		track.image = GetImagePath(track.image);
		track.loudness = track.loudness || -10;
		track.artists = track.artists.map(artistId => {
			let artist = ARTIST_MAP.get(artistId);
			if (!artist) {
				artist = fakeArtist;
			}

			artist.tracks.push(track);
			return artist;
		});
	});

	TRACKS = tracks;
	console.log('Tracks:', tracks);
	
	const albums = await fetchJSON('/api/album/all');
	albums.forEach(album => {
		ALBUM_MAP.set(album.id, album);

		let data = album.tracks;
		album.tracks = [];
		album.image = GetImagePath(album.image);

		if (data === '[null]') return;
		
		const debounce = new Map();
		album.artists = [];

		album.tracks = JSON.parse(data).map(trackId => {
			const track = TRACK_MAP.get(trackId);
			
			track.artists.forEach(artist => {
				if ( debounce.has(artist.id) ) return;
				debounce.set(artist.id, true);

				album.artists.push(artist);
				artist.albums.push(album);
			});
			
			return track;
		});
	});

	ALBUMS = albums;
	console.log('Albums', ALBUMS);

	gEvent.emit('loaded');
}

LoadData();