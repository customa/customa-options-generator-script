const fs = require("fs");
const util = require("util");
const glob = util.promisify(require("glob"));

const app = require("./src/app");

let args = process.argv.splice(2);
{ // split
	let a = [];

	args.forEach((arg) => {
		if (/^-[^-].+/gm.test(arg))
			for (let i = 1; i < arg.length; i++)
				a.push(`-${arg[i]}`);
		else
			a.push(arg);
	});

	args = a;
}
{ // expand
	let a = app.cli.alias;

	args = args.map((_arg) => {
		if (/^-[^-]/gm.test(_arg)) {
			let arg = _arg[1];
			return a[arg] ? `--${a[arg]}` : `--${arg}`;
		} else {
			return _arg;
		}
	});
}
{ // set
	args.forEach((_arg, i) => {
		let arg = _arg.substring(2);

		if (app.cli.options[arg] != undefined)
			app.cli.options[arg] = (args[i + 1] || "--").startsWith("--") ?
				true : args[i + 1];
	});
}

const options = app.cli.options;

if (options.help) {    // --help
	console.log("usage: script [flags]\n\nflags:" + _(app.cli.usage));
	process.exit();

	function _(object) {
		let markdown = "";

		Object.keys(object).forEach((key) => {
			markdown += `\n    ${key}:\t${object[key]}`;
		});

		return markdown;
	}
}

if (options.version) { // --version
	let v = app.version;

	console.log("version: " +
		`${v.major}.${v.minor}${v.patch ? `.${v.patch}` : ""}`);
	process.exit();
}

getSettings()
	.then(formatSettings)
	.then(console.log)
	.catch(console.error);

function formatSettings(settings) {
	// variable to store finalized message
	let markdown = "";

	// loop over each category
	Object.keys(settings).forEach((_category) => {
		// append category name
		markdown += "```css\n";
		markdown += `${_category[0].toUpperCase()}${_category.substring(1)} {\n`;

		let category = settings[_category];

		// loop over each module
		Object.keys(category).forEach((_module) => {
			let module = category[_module];

			// get settings of module
			let settings = Object.keys(module);

			if (settings.length == 0) {
				// fallback if module does not contain any options
				// append module name and stub block
				markdown += `\t${_module} { /* no variables */ }\n`;
			} else {
				// append module name
				let md = `\t${_module} {\n`;

				settings.forEach((setting) => {
					let value = module[setting];

					// append setting and default value
					md += `\t\t--${setting}: ${value};\n`;
				});
	
				// close module block
				markdown += md + "\t}\n";
			}
		});

		// close category block
		markdown += "}\n```\n";
	});

	// append explaination
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
