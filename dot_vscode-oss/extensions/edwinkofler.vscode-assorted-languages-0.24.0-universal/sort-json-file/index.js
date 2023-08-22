import { readFile, writeFile } from 'node:fs/promises'

import { sortJson } from './sort-json-file.js'

const cliSortOrderId = process.argv[2]
const cliFile = process.argv[3]
if (!cliSortOrderId || !cliFile) {
	console.error(`Usage: sort-json-file <sortOrderId> <filePath>`)
	process.exit(1)
}

let sortOrder
let overFields
if (cliSortOrderId === 'language-configuration') {
	;({ sortOrder, overFields } = await import(
		'./sort-orders/packageJsonSortOrder.js'
	))
} else if (cliSortOrderId === 'package-json') {
	;({ sortOrder, overFields } = await import(
		'./sort-orders/packageJsonSortOrder.js'
	))
} else {
	throw new TypeError(`Unsupported sortOrderId: ${cliSortOrderId}`)
}

const jsonString = await readFile(cliFile, 'utf-8')
const jsonObj = sortJson(jsonString, { sortOrder, overFields })
await writeFile(cliFile, jsonObj, null, '\t')
