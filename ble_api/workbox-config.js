module.exports = {
	globDirectory: '.',
	globPatterns: [
		'**/*.{css,html,js,webmanifest,ico,svg,woff,woff2,png}'
	],
	swDest: 'sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};