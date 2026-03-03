const METHOD_GET = {'method': 'GET'}
function fetchJSON(url, params) {
	params = params || METHOD_GET;

	return fetch(url, params).then(res => res.json()).catch(console.log);
}

const gEvent = new CEvent();