import fetch, { FormData, Headers } from 'node-fetch'
import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs-extra'

interface Token {
    token?: string
}

interface Project {
    name?: string
    locales?: string[]
    files: File[]
}

interface File {
    '@id': string
    '@type': string
    name?: string
}

type MessageFile = Record<string, string>

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
const projectID = process.env.XILOFONE_PROJECT_ID
const username = process.env.XILOFONE_USERNAME
const password = process.env.XILOFONE_PASSWORD
const fileName = process.env.XILOFONE_FILE_NAME
const output = process.env.XILOFONE_OUTPUT

if (!baseURL || !projectID || !username || !password) {
    throw new Error('Bad setup')
}

const formData = new FormData()
formData.append('username', username)
formData.append('password', password)

// get token
const tokenResponse: Token | null = await fetch(resolveURL('/api/token'), { method: 'post', body: formData }).then(
    (response) => response.json() as Token
)

if (!tokenResponse || !tokenResponse.token) {
    throw new Error('No token available')
}

const token = tokenResponse.token

// get project
const project: Project | null = (await fetch(path.join(baseURL, 'api/projects/', projectID), {
    headers: createHeaders(token),
}).then((response) => response.json())) as Project | null

if (!project) {
    throw new Error('No project available for the ID ' + projectID)
}

if (!project.locales) {
    throw new Error('No locale available for this project.')
}

if (!project.files || !project.files.length) {
    throw new Error('No file available for this project.')
}

const file = project.files.find((file) => file.name === fileName) || project.files[0]
const fileID = file['@id'].replace('/api/files/', '')

// get files to download
await Promise.all(
    project.locales.map(async (locale) => {
        const messageFile: MessageFile | null = (await fetch(resolveURL(`/download/files/${fileID}/${locale}/json`), {
            headers: createHeaders(token),
        }).then((response) => response.json())) as MessageFile | null

        if (messageFile) {
            const outputFileName = path.join('./', output || '', locale + '.json')

            return fs.outputJson(outputFileName, messageFile, {
                spaces: 2,
            })
        }
    })
)
