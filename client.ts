import fetch, { FormData, Headers, Response } from 'node-fetch'

export function resolveURL(baseURL: string, ...paths: string[]): string {
    const baseURLWithProtocol = baseURL.match(/^https?:\/\//) ? baseURL : 'https://' + baseURL
    const pathname = paths
        .map((p) => p.replace(/^\/+|\/+$/g, ''))
        .filter((p) => p.length > 0)
        .join('/')
    return new URL(pathname, baseURLWithProtocol).toString()
}

export function createHeaders(token: string): Headers {
    return new Headers({ Authorization: 'Bearer ' + token })
}

export async function fetchJSON<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const text = await response.text()
        const preview = text.replace(/\s+/g, ' ').trim().substring(0, 300)
        throw new Error(`HTTP ${response.status} (${response.statusText}) — ${response.url}\n${preview}`)
    }
    return response.json() as Promise<T>
}

export function getFileName(base: string, locale: string): string {
    const LOCALE_PATTERN = '{locale}'
    let fileName = base
    if (fileName.includes(LOCALE_PATTERN)) {
        fileName = fileName.replace(LOCALE_PATTERN, locale)
    } else if (fileName.length > 0) {
        fileName += '.' + locale
    } else {
        fileName = locale
    }
    return fileName + '.json'
}

// Try v2 login endpoint first; fall back to v1 form-encoded endpoint.
// Returns the token and a flag indicating which API version the server speaks.
export async function authenticate(
    baseURL: string,
    user: string,
    pass: string,
): Promise<{ token: string; isV2: boolean }> {
    const v2Response = await fetch(resolveURL(baseURL, '/api/login_check'), {
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ username: user, password: pass }),
    })

    if (v2Response.status !== 404) {
        const data = await fetchJSON<TokenResponse>(v2Response)
        if (!data.token) throw new Error('No token available')
        return { token: data.token, isV2: true }
    }

    // v2 endpoint not found — server is running Xilofone v1
    console.warn('Xilofone v2 login endpoint not found, falling back to v1 (/api/token)')
    const formData = new FormData()
    formData.append('username', user)
    formData.append('password', pass)
    const v1Response = await fetch(resolveURL(baseURL, '/api/token'), { method: 'POST', body: formData })
    const data = await fetchJSON<TokenResponse>(v1Response)
    if (!data.token) throw new Error('No token available')
    return { token: data.token, isV2: false }
}

// Build the download URL for a given file/locale depending on the detected API version.
// v2: GET /api/download/files/{id}/{locale}/{format}?translated=true
// v1: GET /download/files/{id}/{locale}/translated/{format}  (legacy path without /api prefix)
export function buildDownloadURL(baseURL: string, id: string, locale: string, isV2: boolean): string {
    if (isV2) {
        return resolveURL(baseURL, `/api/download/files/${id}/${locale}/json`) + '?translated=true'
    }
    return resolveURL(baseURL, `/download/files/${id}/${locale}/translated/json`)
}
