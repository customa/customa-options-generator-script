const fs = require("fs");
const util = require("util");
const glob = util.promisify(require("glob"));

getSettings()
	.then(formatSettings)
	.then(console.log)
	.catch(console.error);

function formatSettings(settings) {
	let markdown = "";

	Object.keys(settings).forEach((_category) => {
		markdown += "```css\n";
		markdown += `${_category[0].toUpperCase()}${_category.substring(1)} {\n`;

		let category = settings[_category];

		Object.keys(category).forEach((_module) => {
			let module = category[_module];

			let settings = Object.keys(module);

			if (settings.length == 0) {
				markdown += `\t${_module} { /* no variables */ }\n`;
			} else {
				let md = `\t${_module} {\n`;

				settings.forEach((setting) => {
					let value = module[setting];
	
					md += `\t\t--${setting}: ${value};\n`;
				});
	
				markdown += md + "\t}\n";
			}
		});

		markdown += "}\n```\n";
	});

	markdown += "```css\n";
	markdown += "/* this is how this channel is organized */\n";
	markdown += "Category {\n";
	markdown += "	module.m.css {\n";
	markdown += "		/* list of options and modifications in the form of variables*/\n";
	markdown += "	}\n";
	markdown += "}\n";
	markdown += "\n";
	markdown += "/* your import link would then be `https://customa.gitlab.io/Customa-Discord/Category/module.m.css` */\n";
	markdown += "```\n";

	return markdown;
}

function getSettings() {
	return new Promise((resolve, reject) => {
		// get all module files
		glob("*/*.m.css").then((files) => {
			// create category tree
			let data = {};

			// for each module found
			files.forEach((path) => {
				// get category and module from path of module
				let category = path.split("/")[0];
				let module = path.split("/")[1];

				if (!data[category])
					data[category] = [];

				data[category].push(module);
			});

			// get all categories
			Object.keys(data).forEach((category) => {
				let modules = data[category];

				let newCategory = {};

				// get all modules in a category
				modules.forEach((module) => {
					// read module file
					let content = fs.readFileSync(`${category}/${module}`, "UTF-8").split(/\r\n|\n/);

					let variables = {};

					// loop over each line
					for (let i = 0; i < content.length; i++) {
						let line = content[i];

						// save time by only looping through :root
						// :root should be at start of file so the first closing bracket belongs to it
						if (line == "}")
							break;

						// ignore internal variables (settings module, variables module)
						// ignore code block language variables (holy shit there are so many, and no need to configure)
						if (/[ |\t]*--INT.*;/.test(line) || /[ |\t]*--ContentProgLang-.*;/.test(line))
							continue;

						// make ***sure*** line is variable
						if (/[ |\t]*--.*(\*\/|;)/.test(line)) {
							// get name and value of variable
							let name = /[ |\t]*--(.*): +/g.exec(line);
							let value = /[ |\t]*--.*: +(.*);/gm.exec(line);

							if (!name || !value)
								continue;

							// assign
							variables[name[1]] = value[1];
						}
					}

					// assign
					newCategory[module] = variables;
				});

				// replace list of modules with object of modules and values
				data[category] = newCategory;
			});

			resolve(data);
		}).catch(reject);
	});
}
