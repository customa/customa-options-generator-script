module.exports = exports = {
	version: {
		major: 1,
		minor: 0,
		patch: 0,
	},
	cli: {
		options: {
			help: false,
			version: false,
			markdown: false,
			explain: false,
			list: false,
		},
		usage: {
			help:     "[-h] show usage and exit",
			version:  "[-v] show version and exit",
			markdown: "[-m] format list as markdown",
			explain:  "[-e] appends help at end",
			list:     "[-l] only list variables",
		},
		alias: {
			"h": "help",
			"v": "version",
			"m": "markdown",
			"e": "explain",
			"l": "list",
		},
	}
}
