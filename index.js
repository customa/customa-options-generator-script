const fs = require("fs");
const util = require("util");
const glob = util.promisify(require("glob"));

const app = require("./src/app");

let args = process.argv.splice(2);

// args
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

		if (app.cli.options[arg] !== undefined) {
			app.cli.options[arg] = (args[i + 1] || "--").startsWith("--") ?
								   true : args[i + 1];
		} else {
			console.log(`script: invalid option -- '${arg}'`);
			process.exit(-1);
		}
	});
}

// special flags
const options = app.cli.options;
if (options.help) {    // --help
	// prints usage and flag functions
	console.log("usage: script [flags]\n\nflags:" + _(app.cli.usage));
	process.exit();

	function _(object) {
		let markdown = "";

		// for each flag
		Object.keys(object).forEach((key) => {
			// append flag name and usage
			markdown += `\n   --${key}\t${object[key]}`;
		});

		return markdown;
	}
}

if (options.version) { // --version
	let v = app.version;

	// outputs "version: MAJOR.MINOR" (and ".PATCH" if >0)
	console.log("version: " +
				`${v.major}.${v.minor}${v.patch ? `.${v.patch}` : ""}`);
	process.exit();
}

// run
getSettings()
	.then(formatSettings)
	.then(console.log)
	.catch(console.error);

function formatSettings(settings) {
	// variable to store finalized message
	let s = "";

	if (options.list && options.markdown)
		s += "```css\n";

	// loop over each category
	Object.keys(settings).forEach((_category) => {
		if (!options.list) {
			// append category name
			s += options.markdown ? "```css\n" : "\n";
			s += `${_category[0].toUpperCase()}${_category.substring(1)} {\n`;
		}

		let category = settings[_category];

		// loop over each module
		Object.keys(category).forEach((_module) => {
			let module = category[_module];

			// get settings of module
			let settings = Object.keys(module);

			if (options.list) {
				if (settings.length > 0) {
					// for each variable in module
					settings.forEach((setting) =>
										 // append setting and default value
										 s += `--${setting}: ${module[setting]};\n`);
				}
			} else {
				if (settings.length === 0) {
					// fallback if module does not contain any options
					// append module name and stub block
					s += options.markdown
						 ? `    ${_module} { /* no variables */ }\n`
						 : `    ${_module} { no variables }\n`
				} else {
					// append module name
					s += `    ${_module} {\n`;

					// for each variable in module
					settings.forEach((setting) =>
										 // append setting and default value
										 s += `        --${setting}: ${module[setting]};\n`);

					// close module block
					s += "    }\n";
				}
			}
		});

		// close category block
		if (!options.list)
			s += options.markdown ? "}\n```\n" : "}\n";
	});

	if (options.list && options.markdown)
		s += "```\n";

	// append explanation
	if (options.explain && !options.list) {
		if (options.markdown) {
			s += "```css\n";
			s += "/* this is how this channel is organized */\n" +
				 "Category {\n" +
				 "    module.m.css {\n" +
				 "        /* list of options and modifications in the form of variables */\n" +
				 "    }\n" +
				 "}\n\n" +
				 "/* your import link would then be `https://customa.gitlab.io/Customa-Discord/Category/module.m.css\` */";
			s += "\n```\n";
		} else {
			s += "\nthis is how this channel is organized:\n\n" +
				 "Category {\n" +
				 "    module.m.css {\n" +
				 "        list of options and modifications in the form of variables\n" +
				 "    }\n" +
				 "}\n\n" +
				 "your import link would then be `https://customa.gitlab.io/Customa-Discord/Category/module.m.css`\n";
		}
	}

	return s;
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
						if (line === "}")
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
