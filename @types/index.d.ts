interface JsonLD {
    '@id'?: string
    '@type'?: string
    '@context'?: string
}

interface TokenResponse {
    token?: string
}

interface XilofoneProject extends JsonLD {
    name?: string
    locales?: string[]
    files: File[]
}

interface XilofoneFile extends JsonLD {
    name?: string
    project?: Omit<XilofoneProject, "locales", 'files'>
}

type XilofoneMessageFile = Record<string, string>
