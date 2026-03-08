class CPlaylist {
	constructor() {
		this.position = 0;
	}

	set(sortInfo) {
		if (this.sortInfo === sortInfo) return;

		const children = sortInfo.getChildren();
		this.sortInfo = sortInfo;
		this.sortLength = children.length;

		const data = children[0];
		this.isTracks = !!data.location;
		this.isAlbums = !!(data.tracks && data.artists);
		this.isArtists = !!data.albums;

		this.position = 0;
		this.cache = [];
	}

	save() {
		localStorage.setItem('playlist_position', this.position);
		this.sortInfo.save();
	}

	load() {
		let position = localStorage.getItem('playlist_position');
		if (!position) return;

		this.position = parseInt(position);
		console.log('new playlist!', this);
	}

	iterateTracksFromAlbum(album, callback) {	
		for (let i = 0; i < album.tracks.length; i++) {
			const track = album.tracks[i];
			if ( callback(track) ) return true;
		}
	}

	iterateTracksFromEntry(data, callback) {
		if (this.isTracks) return callback(data);

		for (let i = 0; i < data.tracks.length; i++) {
			const track = data.tracks[i];
			if ( callback(track) ) return true;
		}
	}

	iterateTracks(callback) {
		let position = 0;
		let index = 0;

		const maxCachePosition = this.cache.length - 1;
		while (true) {
			let success = false;
			const entry = this.sortInfo.get(index);
			this.iterateTracksFromEntry(entry, track => {
				if (position > maxCachePosition) {
					this.cache.push([track, entry]);
				}
				
				if ( callback(track, position, index) ) {
					success = true;
					return true
				};
				position++;
			});

			if (success) break;
			index++;

			if (index >= this.sortLength) {
				console.log('no success...'); 
				console.trace(); 
				break;
			};
		}
	}

	getAt(targetPosition) {
		if (targetPosition > this.cache.length - 1) {
			this.iterateTracks((_, position) => {
				if (position === targetPosition) return true;
			});
		}

		let position = targetPosition % this.cache.length;
		return this.cache[position][0];
	}

	getNextUpcoming(count) {
		const startPosition = this.position;

		const result = [];
		for (let position = 1; position <= count; position++) {
			const track = this.getAt(startPosition + position);
			result.push(track);
		}

		return result;
	}

	setPosition(targetTrack) {
		if (this.currentTrack === targetTrack) return;

		let position = 0;
		while (true) {
			const track = this.getAt(position);
			if (targetTrack === track) break;

			position++;
		}

		this.position = position;
	}

	getCurrent() {
		return this.getAt(this.position);
	}

	getCurrentData() {
		return this.cache[this.position][1]
	}

	getNext() {
		this.position++;
		return this.getCurrent();
	}

	getPrev() {
		this.position--;
		return this.getCurrent();
	}
}