const util = require("util");
const glob = util.promisify(require("glob"));

glob("**/*.m.css")
	.then(console.log)
	.catch(console.error);
