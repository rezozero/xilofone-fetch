import { describe, it, expect, beforeAll } from 'vitest'
import * as dotenv from 'dotenv'
import fetch from 'node-fetch'
import { resolveURL, authenticate, buildDownloadURL, fetchJSON } from './client.js'

dotenv.config()

const baseURL = process.env.XILOFONE_BASE_URL ?? ''
const username = process.env.XILOFONE_USERNAME ?? ''
const password = process.env.XILOFONE_PASSWORD ?? ''
const fileID = process.env.XILOFONE_FILE_ID ?? ''

// ── Pure unit tests (no network) ──────────────────────────────────────────────

describe('buildDownloadURL', () => {
    it('v2: uses /api/download path with ?translated=true', () => {
        const url = buildDownloadURL('https://example.com', '42', 'fr', true)
        expect(url).toBe('https://example.com/api/download/files/42/fr/json?translated=true')
    })

    it('v1: uses legacy /download path without /api prefix', () => {
        const url = buildDownloadURL('https://example.com', '42', 'fr', false)
        expect(url).toBe('https://example.com/download/files/42/fr/translated/json')
    })

    it('strips trailing slash from baseURL', () => {
        const url = buildDownloadURL('https://example.com/', '1', 'en', true)
        expect(url).toBe('https://example.com/api/download/files/1/en/json?translated=true')
    })
})

describe('resolveURL', () => {
    it('adds https:// when protocol is missing', () => {
        expect(resolveURL('example.com', '/api/login_check')).toBe('https://example.com/api/login_check')
    })

    it('preserves existing https://', () => {
        expect(resolveURL('https://example.com', '/api/token')).toBe('https://example.com/api/token')
    })

    it('joins multiple path segments', () => {
        expect(resolveURL('https://example.com', '/api', '/files', '42')).toBe(
            'https://example.com/api/files/42',
        )
    })
})

// ── Integration tests (real .env credentials required) ───────────────────────

describe.skipIf(!baseURL || !username || !password)('auth endpoints (real server)', () => {
    it('POST /api/login_check returns 200 or 404 (not a server error)', async () => {
        const response = await fetch(resolveURL(baseURL, '/api/login_check'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        })
        expect([200, 404]).toContain(response.status)
    })

    it('authenticate() returns a non-empty token', async () => {
        const { token, isV2 } = await authenticate(baseURL, username, password)
        expect(typeof token).toBe('string')
        expect(token.length).toBeGreaterThan(0)
        expect(typeof isV2).toBe('boolean')
    })

    it('authenticate() with wrong password throws', async () => {
        await expect(authenticate(baseURL, username, 'wrong-password')).rejects.toThrow()
    })
})

describe.skipIf(!baseURL || !username || !password || !fileID)('download endpoint (real server)', () => {
    let token: string
    let isV2: boolean

    beforeAll(async () => {
        ;({ token, isV2 } = await authenticate(baseURL, username, password))
    })

    it('download URL returns valid JSON for the first locale of the file', async () => {
        // Fetch the file to discover its project locales
        const fileResponse = await fetch(resolveURL(baseURL, `/api/files/${fileID}`), {
            headers: { Authorization: 'Bearer ' + token },
        })
        expect(fileResponse.ok).toBe(true)

        const file = (await fileResponse.json()) as { project?: { '@id'?: string } }
        const projectIRI = file.project?.['@id']
        expect(projectIRI).toBeTruthy()

        const projectResponse = await fetch(resolveURL(baseURL, projectIRI!), {
            headers: { Authorization: 'Bearer ' + token },
        })
        expect(projectResponse.ok).toBe(true)

        const project = (await projectResponse.json()) as { locales?: string[] }
        expect(project.locales?.length).toBeGreaterThan(0)

        const locale = project.locales![0]
        const downloadURL = buildDownloadURL(baseURL, fileID, locale, isV2)

        const downloadResponse = await fetch(downloadURL, {
            headers: { Authorization: 'Bearer ' + token },
        })
        expect(downloadResponse.ok).toBe(true)

        const messages = await fetchJSON<unknown>(downloadResponse as Parameters<typeof fetchJSON>[0])
        // Response is either an object (translations) or an empty array (no translations yet)
        expect(messages === null || typeof messages === 'object').toBe(true)
    })
})
