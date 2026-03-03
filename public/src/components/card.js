function Card(title, description, imageUrl, altText) {
	if (!imageUrl) {
		imageUrl = '/assets/missing.jpg';
	}

	const card = document.createElement('div');
	card.className = 'card clickable';
	card.innerHTML = `
		<div class="card-image-wrapper" style="background-image: url(${imageUrl})">
			<img src="/assets/pause.svg" class="play-icon hidden">
			${altText ? '<span>' + altText + '</span>' : ''}
		</div>
		<h3 class="collapse-text">${title}</h3>
		<p class="collapse-text">${description}</p>
	`;

	return card;
}

function CardTrack(track) {
	const artists = track.artists.map(artist => artist.name);
	const duration = track.duration;
	const mins = Math.floor(duration / 60);
	let secs = duration % 60;
	secs = secs < 10 ? '0' + secs : secs;

	const timestamp = mins + ':' + secs;

	const card = Card(track.name, artists.join(', '), track.image, timestamp);
	card.addEventListener('click', () => {
		player.updatePlaylist(activeResult);
		player.changeTrack(track);
	});

	return card;
}

function CardAlbum(album) {
	let suffix = ' tracks';
	if (album.tracks.length === 1) {
		suffix = ' track'
	}

	const credits = album.artists.map(artist => artist.name).join(', ');
	const card = Card(album.name, credits, album.image, album.tracks.length + suffix);

	card.addEventListener('click', () => {
		player.updatePlaylist(activeResult);
		player.changeTrack(album.tracks[0]);
	});

	return card
}

function CardArtist(artist) {
	const desc = `${artist.albums.length} albums, ${artist.tracks.length} tracks`;
	const card = Card(artist.name, desc, artist.image);

	card.addEventListener('click', () => {
		player.updatePlaylist(activeResult);

		const album = artist.albums[0] || artist;
		player.changeTrack(album.tracks[0]);
	});

	return card
}