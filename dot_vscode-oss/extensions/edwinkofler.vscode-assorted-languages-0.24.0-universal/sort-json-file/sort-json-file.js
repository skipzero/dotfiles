import * as assert from 'node:assert/strict'

import sortObjectKeys from 'sort-object-keys'
import detectIndent from 'detect-indent'
import { detectNewlineGraceful as detectNewline } from 'detect-newline'
import isPlainObject from 'is-plain-obj'

const pipe =
	(fns) =>
	(x, ...args) =>
		fns.reduce((result, fn) => fn(result, ...args), x)
const onArray = (fn) => (x) => Array.isArray(x) ? fn(x) : x
const onStringArray = (fn) => (x) =>
	Array.isArray(x) && x.every((item) => typeof item === 'string') ? fn(x) : x
const uniq = onStringArray((xs) => [...new Set(xs)])
const sortArray = onStringArray((array) => [...array].sort())
const uniqAndSortArray = pipe([uniq, sortArray])
const onObject =
	(fn) =>
	(x, ...args) =>
		isPlainObject(x) ? fn(x, ...args) : x
const sortObjectBy = (comparator, deep) => {
	const over = onObject((object) => {
		if (deep) {
			object = Object.fromEntries(
				Object.entries(object).map(([key, value]) => [key, over(value)]),
			)
		}

		return sortObjectKeys(object, comparator)
	})

	return over
}

function editStringJSON(json, over) {
	if (typeof json === 'string') {
		const { indent } = detectIndent(json)
		const endCharacters = json.slice(-1) === '\n' ? '\n' : ''
		const newline = detectNewline(json)
		json = JSON.parse(json)

		let result = JSON.stringify(over(json), null, indent) + endCharacters
		if (newline === '\r\n') {
			result = result.replace(/\n/g, newline)
		}
		return result
	}

	return over(json)
}

const isPrivateKey = (/** @type {string} */ key) => key.startsWith('_')
const partition = (
	/** @type {unknown[]} */ array,
	/** @type {boolean} */ predicate,
) =>
	array.reduce(
		(result, value) => {
			result[predicate(value) ? 0 : 1].push(value)
			return result
		},
		[[], []],
	)

/**
 * @typedef SortOptions
 * @type {object}
 * @property {unknown} sortOrder
 * @property {unknown} overFields
 */

/**
 * @param {string | Record<PropertyKey, unknown>} jsonIsh
 * @param {SortOptions} options
 */
function sortJson(jsonIsh, options) {
	return editStringJSON(
		jsonIsh,
		onObject((json) => {
			assert.ok(options.sortOrder, 'Must pass option sortOrder')
			assert.ok(options.overFields, 'Must pass option overFields')

			let sortOrder = options.sortOrder
			if (Array.isArray(sortOrder)) {
				const keys = Object.keys(json)
				const [privateKeys, publicKeys] = partition(keys, isPrivateKey)

				sortOrder = [...sortOrder, ...publicKeys.sort(), ...privateKeys.sort()]
			}

			return options.overFields(sortObjectKeys(json, sortOrder), json)
		}),
	)
}

export { sortJson }
