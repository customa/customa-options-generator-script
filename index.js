const fs = require("fs");
const util = require("util");
const glob = util.promisify(require("glob"));

getSettings()
	.then(console.log)
	.catch(console.error);

function getSettings() {
	return new Promise((resolve, reject) => {
		let current = fs.realpathSync(".");

		glob("**/*.m.css").then((files) => {
			// create module and 
			let data = {};

			files.forEach((path) => {
				let category = path.split("/")[0];
				let module = path.split("/")[1];

				if (!data[category])
					data[category] = [];

				data[category].push(module);
			});

			Object.keys(data).forEach((category) => {
				let modules = data[category];

				let newCategory = {};

				modules.forEach((module) => {
					let content = fs.readFileSync(`${category}/${module}`, "UTF-8").split(/\r\n|\n/);

					let variables = {};

					for (let i = 0; i < content.length; i++) {
						let line = content[i];

						if (line == "}")
							break;

						if (/[ |\t]*--INT.*;/.test(line) || /[ |\t]*--ContentProgLang-.*;/.test(line))
							continue;

						if (/[ |\t]*--.*(\*\/|;)/.test(line)) {
							let name = /[ |\t]*--(.*):/g.exec(line);
							let value = /[ |\t]*--.*: *(.*);/gm.exec(line);

							if (!name || !value)
								continue;

							variables[name[1]] = value[1]
						}
					}

					newCategory[module] = variables;
				});

				data[category] = newCategory;
			});

			resolve(data);
		}).catch(reject);
	});
}
