const util = require("util");
const glob = util.promisify(require("glob"));

getSettings()
	.then(console.log)
	.catch(console.error);

function getSettings() {
	return new Promise((resolve, reject) => {
		glob("**/*.m.css")
			.then(resolve)
			.catch(reject);
	});
}
