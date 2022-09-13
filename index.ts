import fetch, { FormData } from 'node-fetch'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config()

const baseURL = process.env.XILOFONE_BASE_URL
const projectID = process.env.XILOFONE_PROJECT_ID
const username = process.env.XILOFONE_USERNAME
const password = process.env.XILOFONE_PASSWORD

if (!baseURL || !projectID || !username || !password) {
    throw new Error('Bad setup')
}

function resolveURL(...paths: string[]) {
    return path.join(baseURL || '', ...paths)
}

const formData = new FormData()
formData.append('username', username)
formData.append('password', password)

const token = await fetch(resolveURL('/api/token'), { method: 'post', body: formData }).then((response) =>
    response.text()
)

console.log('token=', token)
// const project = fetch(path.join(baseURL, 'api/projects/', projectID), {
//     headers: new Headers({
//         Authorization: 'Bearer ' + btoa('username:password'),
//         'Content-Type': 'application/x-www-form-urlencoded',
//     }),
// })
//
// console.log(project)
