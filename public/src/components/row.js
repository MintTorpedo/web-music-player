function Row(title, description, imageUrl, isActive) {
	if (!imageUrl) {
		imageUrl = '/assets/missing.jpg';
	}

	const row = document.createElement('div');
	row.className = 'row clickable flex-h';
	row.innerHTML = `
		<div class="row-image-wrapper" style="background-image: url(${imageUrl})">
			<img src="/assets/pause.svg" class="play-icon ${isActive ? '' : 'hidden'}">
		</div>

		<div class="row-info">
			<h3>${title}</h3>
			<p>${description}</p>
		</div>
	`;

	return row;
}


function RowTrack(track, isPlaying) {
	const row = Row(track.name, track.artists[0].name, track.image, isPlaying);

	row.addEventListener('click', () => {
		player.changeTrack(track);
	})

	return row;
}