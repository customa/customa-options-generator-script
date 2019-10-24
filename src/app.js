module.exports = exports = {
	semver: {
		major: 0,
		minor: 1,
		patch: 0,
		toString: () => {
			return `${this.major}.${this.minor}${patch ? `.${this.patch}` : ""}`;
		}
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
