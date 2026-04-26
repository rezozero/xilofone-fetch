import fetch from 'node-fetch'
import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs-extra'
import { resolveURL, createHeaders, fetchJSON, getFileName, authenticate, buildDownloadURL } from './client.js'

dotenv.config()

const baseURL = process.env.XILOFONE_BASE_URL
const username = process.env.XILOFONE_USERNAME
const password = process.env.XILOFONE_PASSWORD
const fileID = process.env.XILOFONE_FILE_ID
const output = process.env.XILOFONE_OUTPUT

if (!baseURL) {
    throw new Error('XILOFONE_BASE_URL must not be empty.')
}
if (!username) {
    throw new Error('XILOFONE_USERNAME must not be empty.')
}
if (!password) {
    throw new Error('XILOFONE_PASSWORD must not be empty.')
}
if (!fileID) {
    throw new Error('XILOFONE_FILE_ID must not be empty.')
}

// get token (v2 first, v1 fallback)
const { token, isV2 } = await authenticate(baseURL, username, password)

// get file
const file = await fetch(resolveURL(baseURL, 'api/files/' + fileID), {
    headers: createHeaders(token),
}).then((response) => fetchJSON<XilofoneFile>(response))

const fileBaseName = process.env.XILOFONE_OUTPUT_FILE_NAME || file.name?.split('.').slice(0, -1).join('.') || ''
const projectID = file.project?.['@id']

if (!projectID) {
    throw new Error(`The file with the ID ${fileID} is not linked to a project.`)
}

// get project
const project = await fetch(resolveURL(baseURL, projectID), {
    headers: createHeaders(token),
}).then((response) => fetchJSON<XilofoneProject>(response))

if (!project.locales) {
    throw new Error('No locale available for this project.')
}

if (!project.files || !project.files.length) {
    throw new Error('No file available for this project.')
}

// get files to download
await Promise.all(
    project.locales.map(async (locale) => {
        const messageFile = await fetch(buildDownloadURL(baseURL, fileID, locale, isV2), {
            headers: createHeaders(token),
        }).then((response) => fetchJSON<XilofoneMessageFile>(response))

        if (messageFile) {
            // Xilofone returns an empty array if there are no translations, but we want an empty object to keep the file structure consistent
            const formattedMessageFile = Array.isArray(messageFile) && !messageFile.length ? {} : messageFile

            const fileName = getFileName(fileBaseName, locale)
            const filePath = path.join('./', output || '', fileName)

            return fs.outputJson(filePath, formattedMessageFile, {
                spaces: 2,
            })
        }
    })
)
