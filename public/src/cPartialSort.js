class CPartialSort {
	constructor(tabInfo, children, filterInfo) {
		this.tabInfo = tabInfo;
		this.reference = children;
		this.filterInfo = filterInfo;
		this.isReversed = false;
		this.searchText = InputSearch.value;

		this.reset();
	}

	save() {
		localStorage.setItem('sorting_filter', this.filterInfo.id);
		localStorage.setItem('sorting_tab', this.tabInfo.id);

		localStorage.setItem('filter_search', this.searchText);
	}

	reset() {
		this.mapped = new Map();
		this.sorted = [];
		this.position = 0;
	}

	reverse() {
		this.reset();
		this.isReversed = !this.isReversed;
	}

	sortTo(index) {
		const filter = this.filterInfo.filter;
		if (this.sorted.length === this.reference.length) return;

		const offset = this.isReversed ? -1 : 1;

		while (index >= this.sorted.length) {
			let best = null;

			for (let i = 0; i < this.reference.length; i++) {
				const item = this.reference[i]
				if (this.mapped.has(item)) continue;

				if (best === null || filter(item, best) * offset > 0) {
					best = item;
				}
			}

			if (best === null) break;
			this.sorted.push(best);
			this.mapped.set(best, true);
		}
	}

	get(index) {
		const maxLength = this.reference.length;
		if (index >= maxLength) {
			console.warn(`[CPartialSort] OUT OF BOUNDS! index(${index}) max(${maxLength})`);
			console.trace();
			return;
		};

		const activeLength = this.sorted.length;
		if (index >= activeLength) {
			this.sortTo(index);
		}

		return this.sorted[index];
	}

	getChildren() {
		return this.reference;
	}

	getLength() {
		return this.reference.length;
	}
}