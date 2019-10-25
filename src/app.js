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
			markdown: false,
			explain: false,
		},
		usage: {
			help: "show usage and exit",
			version: "show version and exit",
			markdown: "format list as markdown",
			explain: "appends help at end"
		},
		alias: {
			"h": "help",
			"v": "version",
			"m": "markdown",
			"e": "explain",
		},
	}
}
