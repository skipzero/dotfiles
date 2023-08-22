import sortObjectKeys from 'sort-object-keys'
import gitHooks from 'git-hooks-list'
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

const sortObject = sortObjectBy()
const sortURLObject = sortObjectBy(['type', 'url'])
const sortPeopleObject = sortObjectBy(['name', 'email', 'url'])
const sortDirectories = sortObjectBy([
	'lib',
	'bin',
	'man',
	'doc',
	'example',
	'test',
])
const overProperty =
	(property, over) =>
	(object, ...args) =>
		Object.hasOwn(object, property)
			? { ...object, [property]: over(object[property], ...args) }
			: object
const sortGitHooks = sortObjectBy(gitHooks)

// https://code.visualstudio.com/api/language-extensions/language-configuration-guide

// field.key{string}: field name
// field.over{function}: sort field subKey
const fields = [
	{ key: '$schema' },
	{ key: 'comments', over: sortObject },
	{ key: 'brackets', over: uniqAndSortArray },
	{ key: 'autoClosingPairs', over: uniqAndSortArray },
	{ key: 'autoCloseBefore', over: uniqAndSortArray },
	{ key: 'surroundingPairs', over: uniqAndSortArray },
	{ key: 'folding', over: sortObject },
	{ key: 'wordPattern' },
	{ key: 'indentationRules', over: sortObject },
]

export const defaultSortOrder = fields.map(({ key }) => key)
export const overFields = pipe(
	fields
		.map(({ key, over }) => (over ? overProperty(key, over) : undefined))
		.filter(Boolean),
)
