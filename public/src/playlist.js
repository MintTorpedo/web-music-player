class CPlaylist {
	constructor() {
		this.position = 0;
	}

	set(sortContent) {
		if (this.sortContent === sortContent) return;
		this.sortContent = sortContent;

		const children = sortContent.getChildren()
		const data = children[0];
		this.isTracks = !!data.location;
		this.isAlbums = !!(data.tracks && data.artists);
		this.isArtists = !!data.albums;

		this.artists = [];
		if (this.isTracks) {
			this.artists.push({
				'albums': [{'tracks': children}]
			});

		} else if (this.isAlbums || this.isArtists) {
			this.artists.push({
				'albums': children
			});

		} else if (this.isArtists) {
			this.artists = children;
		}

		this.currentTrack;
		this.position = 0;
		this.trackCount = 0;
		this.iterateTracks((_, i) => {
			this.trackCount = i;
		})
	}

	iterateTracks(callback) {
		let count = 0;

		for (let i = 0; i < this.artists.length; i++) {
			const artist = this.artists[i];

			for (let i = 0; i < artist.albums.length; i++) {
				const album = artist.albums[i];

				for ( let i = 0; i < album.tracks.length; i++) {
					const track = album.tracks[i];
					if (callback(track, count)) return;

					count++;
				}
			}
		}
	}

	getAt(targetIndex) {
		let trackFound;
		this.iterateTracks((track, i) => {
			if (i !== targetIndex) return;

			trackFound = track;
			return true;
		});

		return trackFound;
	}

	getNextUpcoming(nextPos) {
		const startPos = this.position;
		const endPos = startPos + nextPos;

		//console.log('start pos:', startPos, 'end pos:', endPos)

		const result = [];
		this.iterateTracks((track, i) => {
			if (i < startPos) return;

			result.push(track);
			//console.log('Added:', i);

			if (i >= endPos) return true;
		});

		return result;
	}

	setPosition(targetTrack) {
		if (this.currentTrack === targetTrack) return;

		this.iterateTracks((track, i) => {
			if (track !== targetTrack) return;

			this.position = i;
			this.currentTrack = track;

			return true;
		});
	}

	getNext() {
		const index = (this.position + 1) % this.trackCount;
		this.position = index;

		return this.getAt(index);
	}

	getPrev() {
		const index = Math.abs((this.position - 1) % this.trackCount);
		this.position = index;

		return this.getAt(index);
	}
}