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
		alias: {
			"h": "help",
			"v": "version",
		},
	}
}
