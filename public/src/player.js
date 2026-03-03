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

class CPlayer {
	constructor() {
		this.audio = new Audio();
		this.track = null;
		this.isPlaying = false;
		this.isActiveBar = false;
		this.playlist = new CPlaylist();
		this.isRepeat = false;
		this.volume = 0.25;

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
			this.beginBarRefresh();
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
	}

	refreshVolume() {
		const value = volumeSlider.value;

		volumeTitle.textContent = value + '%';
		this.volume = parseInt(value) / 100;
		this.audio.volume = this.volume;
	}

	updatePlaylist(resultContent) {
		this.playlist.set(resultContent);
		//this.updateUpcoming();
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

	showElementPlayingIcon(show) {
		const track = this.track;
		if (!track) return;

		const children = [...CardContainer.children];
		for (let i = 0; i < children.length; i++) {
			const element = children[i];
			const data = element.data;

			if (data.tracks) {
				if (!data.tracks.includes(track)) continue;

			} else {
				if (element.data != track) continue;	
			}

			const playIcon = element.querySelector('.play-icon');
			if (show) {
				playIcon.classList.remove('hidden');
			} else {
				playIcon.classList.add('hidden');
			}

			break;
		}
	}

	changeTrack(nextTrack) {
		if ( mediaBtnPlay.classList.contains('hidden') ) {
			ToggleMediaBtns();
		}

		// console.log(track.name);

		//let volume = 1 - Math.pow(23 + track.loudness, 4) / 105000;

		//console.log(`loudness(${track.loudness}),`, `volume(${volume})`);
		//volume = Math.min(Math.max(volume, 0.1), 1);
		//console.log(volume);

		//volume = 1;

		this.showElementPlayingIcon(false);

		const safeLocation = encodeURIComponent(decodeURIComponent(nextTrack.location));

		this.prevTrack = this.track;
		this.track = nextTrack;
		this.audio.src = safeLocation;
		this.audio.volume = this.volume;
		this.isPlaying = false;

		musicPlayer.classList.remove('hidden');

		musicProgress.value = 0;
		musicProgress.setAttribute('max', nextTrack.duration);

		this.updatePlayerInfo();

		this.play();
		this.playlist.setPosition(nextTrack);

		this.showElementPlayingIcon(true);
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

		this.beginBarRefresh();
	}

	pause() {
		if (!this.isPlaying) return;
		this.isPlaying = false;
		this.audio.pause();

		navigator.mediaSession.playbackState = 'paused';

		ToggleMediaBtns();

		this.stopBarRefresh();
	}

	stopBarRefresh() {
		this.isActiveBar = false;
	}

	beginBarRefresh() {
		if (this.isActiveBar) return;
		this.isActiveBar = true;

		this.updateBar();
	}

	updateBar() {
		if (!this.isActiveBar) return;
		
		const currentTime = this.audio.currentTime;
		const duration = this.audio.duration;

		playerBar.style.width = (currentTime / duration * 100) + '%'
		musicProgress.value = currentTime;

		requestAnimationFrame(() => this.updateBar());
	}
}

//musicPlayer.classList.add('hidden');
mediaBtnPause.classList.add('hidden');