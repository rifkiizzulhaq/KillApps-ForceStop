module.exports = {
	preset: "react-native",
	setupFiles: ["<rootDir>/jest.setup.js"],
	collectCoverage: true,
	coverageThreshold: {
		global: {
			branches: 90,
			functions: 90,
			lines: 90,
			statements: 90,
		},
	},

	transformIgnorePatterns: [
		"node_modules/(?!(react-native|@react-native|@react-native/virtualized-lists|lucide-react-native|react-native-css-interop)/)",
	],
};
