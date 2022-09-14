import fetch, { FormData, Headers } from 'node-fetch'
import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs-extra'

function resolveURL(...paths: string[]) {
    return path.join(baseURL || '', ...paths)
}

function createHeaders(token: string) {
    return new Headers({
        Authorization: 'Bearer ' + token,
    })
}

dotenv.config()

const baseURL = process.env.XILOFONE_BASE_URL
const username = process.env.XILOFONE_USERNAME
const password = process.env.XILOFONE_PASSWORD
const fileID = process.env.XILOFONE_FILE_ID
const output = process.env.XILOFONE_OUTPUT

if (!baseURL || !username || !password || !fileID) {
    throw new Error('Bad setup')
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
const file: XilofoneFile | null = await fetch(path.join(baseURL, 'api/files/', fileID), {
    headers: createHeaders(token),
}).then((response) => response.json()) as File | null
const projectID = file?.project?.['@id']

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
        const messageFile: XilofoneMessageFile | null = (await fetch(resolveURL(`/download/files/${fileID}/${locale}/json`), {
            headers: createHeaders(token),
        }).then((response) => response.json())) as XilofoneMessageFile | null

        if (messageFile) {
            const outputFileName = path.join('./', output || '', locale + '.json')

            return fs.outputJson(outputFileName, messageFile, {
                spaces: 2,
            })
        }
    })
)
