module.exports = exports = {
	version: {
		major: 0,
		minor: 1,
		patch: 0,
	},
	cli: {
		options: {
			help: false,
			version: false,
		},
		usage: {
			help: "show usage and exit",
			version: "show version and exit",
		},
		alias: {
			"h": "help",
			"v": "version",
		},
	}
}
