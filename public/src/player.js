const musicPlayer = document.querySelector('.music-player');

const playerImage = document.querySelector('#player-image');

const playerTitle  = document.querySelector('.playing-title');
const playerArtist = document.querySelector('.playing-artist');

const mediaBtnPlay   = document.querySelector('#media-play');
const mediaBtnPause  = document.querySelector('#media-pause');
const mediaBtnPrev   = document.querySelector('#media-previous');
const mediaBtnNext   = document.querySelector('#media-next');

const mediaBtnRepeat   = document.querySelector('#media-repeat');
const mediaBtnShuffle  = document.querySelector('#media-shuffle');
const mediaBtnPlaylist = document.querySelector('#media-playlist');

const volumeContainer = document.querySelector('#volume-container');
const volumeSlider    = document.querySelector('#media-volume-slider');
const volumeTitle     = document.querySelector('#volume-title');

const playlistContainer = document.querySelector('#playlist-container')

const playerBar = document.querySelector('.progress .bar');
const musicProgress = document.querySelector('#music-progress');

function ToggleMediaBtns() {
	mediaBtnPlay.classList.toggle('hidden');
	mediaBtnPause.classList.toggle('hidden');
}

// function Easing(x) {
// 	return 1 - Math.pow(1 - x, 3);
// }

function Easing(x) { // QuadOutIn
	x = 1 - x;
	const y = x < 0.5
		? 2 * x * x
		: 1 - Math.pow(-2 * x + 2, 2) / 2;
	return 1 - y;
}

// function Easing(x) {
// 	return x;
// }

class CPlayer {
	constructor() {
		this.audio = new Audio();
		this.track = null;
		this.isPlaying = false;
		this.isActiveBar = false;
		this.playlist = new CPlaylist();
		this.isRepeat = false;
		this.volume = 0.25;
		this.prevCard = null;

		mediaBtnPlay.addEventListener('click', () => {
			this.play();
		});
		mediaBtnPause.addEventListener('click', () => {
			this.pause();
		});

		musicProgress.addEventListener('input', () => {
			this.stopBarRefresh();
		});

		musicProgress.addEventListener('change', () => {
			this.audio.currentTime = musicProgress.value;
			this.resumeBarRefresh();
		});

		mediaBtnRepeat.addEventListener('click', () => {
			this.isRepeat = !this.isRepeat;
			mediaBtnRepeat.classList.toggle('btn-active');
		});

		mediaBtnShuffle.addEventListener('click', () => {
			mediaBtnShuffle.classList.toggle('btn-active');
		});

		mediaBtnPlaylist.addEventListener('click', () => {
			mediaBtnPlaylist.classList.toggle('btn-active');

			playlistContainer.classList.toggle('hidden');
		});

		volumeSlider.addEventListener('input', () => this.refreshVolume() );
		this.refreshVolume();
		
		mediaBtnNext.addEventListener('click', () => this.playNext());
		mediaBtnPrev.addEventListener('click', () => this.playPrevious());

		navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext());
		navigator.mediaSession.setActionHandler('previoustrack', () => this.playPrevious());

		navigator.mediaSession.setActionHandler('play', () => this.play());
		navigator.mediaSession.setActionHandler('pause', () => this.pause());

		this.audio.addEventListener('ended', () => {
			if (this.isRepeat) {
				this.changeTrack(this.track);
				return;
			}

			this.playNext();
		});

		window.addEventListener('pagehide', () => {
			this.save();
		});
	}

	save() {
		localStorage.setItem('player_volume', this.volume);
		localStorage.setItem('player_duration', this.audio.currentTime);
	}

	load() {
		const value = localStorage.getItem('player_volume');
		this.volume = parseFloat(value) || 0.5;

		this.playlist.set(activeResult);
		this.playlist.load();

		const track = this.playlist.getCurrent();
		this.changeTrack(track, true);

		const duration = localStorage.getItem('player_duration');
		this.audio.currentTime = parseFloat( duration );
		this.updateBar();

		console.log('Finished loading!');
	}

	refreshVolume() {
		const value = volumeSlider.value;

		volumeTitle.textContent = value + '%';
		this.volume = parseInt(value) / 100;
		this.audio.volume = Easing(this.volume);
	}

	updatePlaylist(resultContent) {
		this.playlist.set(resultContent);
	}

	updateUpcoming() {
		if (this.prevTrack === this.track) return;

		playlistContainer.innerHTML = '';

		const tracks = this.playlist.getNextUpcoming(5);

		for (let i = tracks.length - 1; i >= 0; i--) {
			const row = RowTrack(tracks[i], i === 0);
			playlistContainer.appendChild(row);
		}
	}

	playNext() {
		const track = this.playlist.getNext();
		if (!track) return;

		this.changeTrack(track);
	}

	playPrevious() {
		let track = this.track;

		if (!this.audio || this.audio.currentTime <= 1.5) {
			track = this.playlist.getPrev();
		}

		if (!track) return;
		this.changeTrack(track);
	}

	setCardIsPlaying(playbackState, prevCard) {
		const track = this.track;
		if (!track) return;

		let currentCard;
		if (prevCard) {
			currentCard = prevCard;

		} else {
			const targetData = this.playlist.getCurrentData();

			const children = [...CardContainer.children];
			for (let i = 0; i < children.length; i++) {
				const element = children[i];
				if (element.data != targetData) continue;

				currentCard = element;
				break;
			}

			this.prevCard = currentCard;
		}

		if (!currentCard) return;

		const pauseIcon = currentCard.querySelector('.pause-icon');
		const playIcon = currentCard.querySelector('.play-icon');

		if (playbackState != ENUM.playbackState.inactive) {
			currentCard.classList.add('active');
		}

		if (playbackState === ENUM.playbackState.playing) {
			pauseIcon.classList.remove('hidden');
			playIcon.classList.add('hidden');

		} else if (playbackState === ENUM.playbackState.stopped) {
			pauseIcon.classList.add('hidden');
			playIcon.classList.remove('hidden');

		} else if (playbackState === ENUM.playbackState.inactive) {
			currentCard.classList.remove('active');
			pauseIcon.classList.add('hidden');
			playIcon.classList.add('hidden');
		}
	}

	changeTrack(nextTrack, doNotPlay) {
		if ( mediaBtnPlay.classList.contains('hidden') ) {
			ToggleMediaBtns();
		}

		// console.log(track.name);

		//let volume = 1 - Math.pow(23 + track.loudness, 4) / 105000;

		//console.log(`loudness(${track.loudness}),`, `volume(${volume})`);
		//volume = Math.min(Math.max(volume, 0.1), 1);
		//console.log(volume);

		//volume = 1;

		this.setCardIsPlaying(ENUM.playbackState.inactive, this.prevCard);

		let safeLocation;
		try {
			safeLocation = encodeURIComponent(decodeURIComponent(nextTrack.location));

		} catch(err) {
			console.error(err);
			console.log(`Failed to parse audio path "${nextTrack.location}"`);
		}

		if (!safeLocation) return;

		this.prevTrack = this.track;
		this.track = nextTrack;
		this.audio.src = safeLocation;
		//this.audio.volume = this.volume;
		this.isPlaying = false;

		musicPlayer.classList.remove('hidden');

		musicProgress.value = 0;
		musicProgress.setAttribute('max', nextTrack.duration);

		this.updatePlayerInfo();
		this.playlist.setPosition(nextTrack);

		if (doNotPlay) {
			this.setCardIsPlaying(ENUM.playbackState.stopped);

		} else {
			this.playlist.save();
			this.play();
		}

		this.updateUpcoming();
	}

	updatePlayerInfo() {
		const duration = this.track.duration;
		const mins = Math.floor(duration / 60);
		const secs = duration % 60;

		const track = this.track;
		let trackName = track.name;
		if (trackName.length > 14) {
			trackName = trackName.substring(0, 14) + '...'
		}

		playerTitle.innerHTML = `<b>${trackName}</b> (${mins}:${secs < 10 ? '0' + secs : secs})`;
		playerArtist.innerHTML = track.artists[0].name//track.artists.map(artist => artist.name).join(', ');
		playerImage.src = track.image || '/assets/missing.jpg';
	}

	play() {
		if (this.isPlaying) return;
		this.isPlaying = true;
		this.audio.play();

		navigator.mediaSession.playbackState = 'playing';

		ToggleMediaBtns();

		this.resumeBarRefresh();
		this.setCardIsPlaying(ENUM.playbackState.playing);
	}

	pause() {
		if (!this.isPlaying) return;
		this.isPlaying = false;
		this.audio.pause();

		navigator.mediaSession.playbackState = 'paused';

		ToggleMediaBtns();

		this.stopBarRefresh();
		this.setCardIsPlaying(ENUM.playbackState.stopped);
	}

	stopBarRefresh() {
		this.isActiveBar = false;
	}

	resumeBarRefresh() {
		if (this.isActiveBar) return;
		this.isActiveBar = true;

		this.refreshBar();
	}

	refreshBar() {
		if (!this.isActiveBar) return;

		this.updateBar();
		requestAnimationFrame(() => this.refreshBar());
	}

	updateBar() {
		const currentTime = this.audio.currentTime;
		const duration = this.audio.duration || this.track.duration;

		playerBar.style.width = (currentTime / duration * 100) + '%'
		musicProgress.value = currentTime;
	}
}

//musicPlayer.classList.add('hidden');
mediaBtnPause.classList.add('hidden');