const fs = require("fs");
const util = require("util");
const glob = util.promisify(require("glob"));

getSettings()
	.then(console.log)
	.catch(console.error);

function getSettings() {
	return new Promise((resolve, reject) => {
		glob("**/*.m.css").then((files) => {
			// get contents of all modules
			let data = files.map(path => fs.readFileSync(path, "UTF-8"));

			// get variables of all modules
			let variables = data.map((_content) => {
				let content = _content.split(/\r\n|\n/);

				let variables = [];

				for (let i = 0; i < content.length; i++) {
					let line = content[i];

					if (line == "}")
						break;

					if (/[ |\t]*--INT.*;/.test(line) || /[ |\t]*--ContentProgLang-.*;/.test(line))
						continue;

					if (/[ |\t]*--.*(\*\/|;)/.test(line)) {
						let name = /[ |\t]*--(.*):/g.exec(line);
						let value = /[ |\t]*--.*: (.*)/gm.exec(line);

						if (!name || !value)
							continue;

						variables.push(value[1]);
					}
				}

				return variables;
			});

			resolve(variables);
		}).catch(reject);
	});
}
