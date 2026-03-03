class CEvent {
	constructor() {
		this.content = new Map();
	}

	on(eventName, callback) {
		let listeners = this.content.get(eventName);
		if (!listeners) {
			listeners = [];
			this.content.set(eventName, listeners);
		}

		listeners.push(callback);
	}

	emit(eventName, ...args) {
		if (!this.content.has(eventName)) return;

		const listeners = this.content.get(eventName);
		for (let i = 0; i < listeners.length; i++) {
			const callback = listeners[i];
			callback(...args);
		}
	}

	invoke(eventName, ...args) {
		if (!this.content.has(eventName)) return;

		const listeners = this.content.get(eventName);
		for (let i = 0; i < listeners.length; i++) {
			const callback = listeners[i];
			return callback(...args);
		}
	} 
}