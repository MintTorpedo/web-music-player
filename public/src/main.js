const player = new CPlayer();
console.log('cPlayer', player);

const CardContainer  = document.querySelector('.card-container');
const ContainerTitle = document.querySelector('.header-container > .title');
const InputSortby    = document.querySelector('#input-sortby');
const InputSearch    = document.querySelector('#input-search');

const BtnSortDesc = document.querySelector('#sort-des');
const BtnSortAsc  = document.querySelector('#sort-asc');
const SortBtns = document.querySelector('#sort-btns');

const Filters = [
	{ // Date added
		'id': 0,
		'orderBtn': true,
		'filter': (a, b) => a.id - b.id,
	},

	{ // Alphabetical order
		'id': 1,
		'orderBtn': true,
		'filter': (a, b) => a.name.localeCompare(b.name),
	},

	{ // Random
		'id': 2,
		'orderBtn': false,
		'filter': (a, b) => Math.random() - 0.5,
	},

	{ // Track duration
		'id': 3,
		'orderBtn': true,
		'filter': (a, b) => a.duration - b.duration,
	},

	{ // Total tracks
		'id': 4,
		'orderBtn': true,
		'filter': (a, b) => a.tracks.length - b.tracks.length,
	},

	{ // Total albums
		'id': 5,
		'orderBtn': true,
		'filter': (a, b) => a.albums.length - b.albums.length,
	},
];

function FilterByName(children) {
	const searchText = InputSearch.value;

	for (let i = children.length - 1; i >= 0; i--) {
		const name = children[i].name;
		if ( new RegExp(searchText, 'i').test(name) ) continue;

		children.splice(i, 1);
	};
}

let activeTab;
let activeResult;
let activeResultPos = 0;
function SetupSorting(customTab) {
	const filterType = parseInt( InputSortby.value );
	const operation = Filters[filterType];
	if (!operation) return console.log('Invalid sorting operation');

	const tab = customTab || activeTab;
	let children = tab.get();
	if (InputSearch.value != '') {
		FilterByName(children);
	}

	activeResult = new CPartialSort(tab, children, operation);
	//activeResult.save();
	activeResultPos = 0;

	if (!operation.orderBtn) {
		SortBtns.classList.add('hidden');
		return;

	} else {
		SortBtns.classList.remove('hidden');
	}

	//console.log('Creating new sorting')
	return children;
}

function DrawCardBatch(offset) {
	const length = activeResult.getLength()
	if (activeResultPos >= length) return;

	const maxDist = activeResultPos + offset;

	for (let i = 0; i < length; i++) {
		if (activeResultPos > i) continue;
		if (i >= maxDist) break;

		const info = activeResult.get(i);
		const card = activeTab.card(info);
		card.data = info;
		CardContainer.appendChild(card);
	}

	//player.setCardIsPlaying(true);

	activeResultPos = maxDist;
}

function DrawCards(tab) {
	CardContainer.innerHTML = '';

	const isTracks = tab.name === 'tracks';
	let children = activeResult.getChildren();

	let totalSec = 0;
	if (isTracks) {
		children.forEach(info => {totalSec += info.duration});
	}

	activeResultPos = 0;
	DrawCardBatch(20);

	//player.setCardIsPlaying(true)

	if (!isTracks) {
		ContainerTitle.innerHTML = `${children.length} ${tab.name}`;
		return;
	};

	const totalHours = Math.floor(totalSec / 60 / 60);
	const totalMins = totalSec % 60;
	ContainerTitle.innerHTML = `${children.length} ${tab.name} (${totalHours} hours, ${totalMins} minutes)`;
}

function ChangeTab(clickedTab) {
	if (activeTab) {
		activeTab.element.classList.remove('active');
	}

	activeTab = clickedTab;
	clickedTab.element.classList.add('active');

	let isAvailable = false;
	let defaultFilterId = null;

	const filterOptions = [...InputSortby.children];
	filterOptions.forEach((element, filterId) => {
		if ( !clickedTab.filters.includes(filterId) ) {
			element.classList.add('hidden');
			return;
		}

		element.classList.remove('hidden');

		if (InputSortby.value === element.value) {
			isAvailable = true;
		}

		if (defaultFilterId) return;
		defaultFilterId = element.value
	});

	if (!isAvailable) {
		InputSortby.value = defaultFilterId;
	}

	InputSearch.value = '';

	SetupSorting(clickedTab);
	DrawCards(clickedTab);
}

const Tabs = [
	{
		id: 0,
		name: 'tracks',
		element: document.querySelector('#nav-tracks'),
		card: CardTrack,
		filters: [0, 1, 2, 3],

		get: () => TRACKS.slice(),
	},

	{
		id: 1,
		name: 'albums',
		element: document.querySelector('#nav-albums'),
		card: CardAlbum,
		filters: [0, 1, 2, 4],

		get: () => ALBUMS.slice(),
	},

	{
		id: 2,
		name: 'artists',
		element: document.querySelector('#nav-artists'),
		card: CardArtist,
		filters: [0, 1, 2, 4, 5],

		get: () => ARTISTS.slice(),
	},
];

Tabs.forEach(tabInfo => {
	const element = tabInfo.element;
	element.setAttribute('href', 'javascript:void(0)');
	element.addEventListener('click', () => ChangeTab(tabInfo));
});

InputSortby.addEventListener('input', () => {
	SetupSorting();
	DrawCards(activeTab);
});

BtnSortDesc.addEventListener('click', () => {
	BtnSortDesc.classList.add('hidden');
	BtnSortAsc.classList.remove('hidden');

	activeResult.reverse();
	DrawCards(activeTab);
});

BtnSortAsc.addEventListener('click', () => {
	BtnSortAsc.classList.add('hidden');
	BtnSortDesc.classList.remove('hidden');

	activeResult.reverse();
	DrawCards(activeTab);
});

InputSearch.addEventListener('input', () => {
	SetupSorting();
	DrawCards(activeTab);
});

gEvent.on('loaded', () => {
	const sortTabId = localStorage.getItem('sorting_tab');
	let tab = Tabs[0];

	if (sortTabId) {
		tab = Tabs[ parseInt(sortTabId) ];
		
		const sortFilterId = localStorage.getItem('sorting_filter');
		InputSortby.value = sortFilterId || 0;

		console.log('Sort filter!!', sortFilterId)
	}

	SetupSorting(tab);
	ChangeTab(tab);

	if (!sortTabId) return;
	player.load();
});

document.addEventListener('scroll', function(e) {
	let documentHeight = document.body.scrollHeight;
	let currentScroll = window.scrollY + window.innerHeight;
	
	let modifier = 200; 
	if(currentScroll + modifier < documentHeight) return;

	DrawCardBatch(20);
})
