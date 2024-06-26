/* eslint-disable no-undef */
module.exports = {
	"env": {
		"browser": true,
		"es2021": true
	},
	"extends": [
		'eslint:recommended',
		'plugin:react-hooks/recommended'
	],
	"overrides": [
	],
	"parserOptions": {
		"ecmaVersion": "latest",
		"sourceType": "module",
		"ecmaFeatures": {
			"jsx": true
		}
	}, "plugins": ["jest"],

	"rules": {
		"indent": [
			0,
			"tab"
		],
		"linebreak-style": [
			"error",
			"unix"
		],

		"quotes": [
			"off",
			"double"
		],
		"semi": "off",
		"html-validate(attr-quotes)": "off"
	}
};
