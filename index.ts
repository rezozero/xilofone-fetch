import fetch, { FormData, Headers } from 'node-fetch'
import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs-extra'

dotenv.config()

const FILE_NAME_LOCALE_PATTERN = '{locale}'

const baseURL = process.env.XILOFONE_BASE_URL
const username = process.env.XILOFONE_USERNAME
const password = process.env.XILOFONE_PASSWORD
const fileID = process.env.XILOFONE_FILE_ID
const output = process.env.XILOFONE_OUTPUT

function resolveURL(...paths: string[]) {
    if (!baseURL) {
        throw new Error('XILOFONE_BASE_URL must not be empty.')
    }
    const baseURLWithProtocol = baseURL.match(`^https?:\/\/`) ?
        baseURL :
        'https://' + baseURL
    return path.join(baseURLWithProtocol || '', ...paths)
}

function createHeaders(token: string) {
    return new Headers({
        Authorization: 'Bearer ' + token,
    })
}

function getFileName(base: string, locale: string): string {
    let fileName = base

    if (fileName.includes(FILE_NAME_LOCALE_PATTERN)) {
        fileName = fileName.replace(FILE_NAME_LOCALE_PATTERN, locale)
    } else if (fileName.length > 0) {
        fileName += '.' + locale
    } else {
        fileName = locale
    }

    return fileName + '.json'
}

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

const formData = new FormData()
formData.append('username', username)
formData.append('password', password)

// get token
const tokenResponse: TokenResponse | null = await fetch(resolveURL('/api/token'), { method: 'post', body: formData }).then(
    (response) => response.json() as TokenResponse
)

if (!tokenResponse || !tokenResponse.token) {
    throw new Error('No token available')
}

const token = tokenResponse.token

// get file
const file: XilofoneFile | null = await fetch(resolveURL('api/files/' + fileID), {
    headers: createHeaders(token),
}).then((response) => response.json()) as File | null

if (!file) {
    throw new Error(`There is no file with the ID ${fileID}.`)
}

const fileBaseName = process.env.XILOFONE_OUTPUT_FILE_NAME || file.name?.split('.').slice(0, -1).join('.') || ''
const projectID = file.project?.['@id']

if (!projectID) {
    throw new Error(`The file with the ID ${fileID} is not linked to a project.`)
}

// get project
const project: XilofoneProject | null = await fetch(resolveURL(projectID), {
    headers: createHeaders(token),
}).then((response) => response.json()) as XilofoneProject | null

if (!project) {
    throw new Error('No project available for the ID ' + projectID)
}

if (!project.locales) {
    throw new Error('No locale available for this project.')
}

if (!project.files || !project.files.length) {
    throw new Error('No file available for this project.')
}

// get files to download
await Promise.all(
    project.locales.map(async (locale) => {
        const messageFile: XilofoneMessageFile | null = (await fetch(resolveURL(`/download/files/${fileID}/${locale}/translated/json`), {
            headers: createHeaders(token),
        }).then((response) => response.json())) as XilofoneMessageFile | null

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
