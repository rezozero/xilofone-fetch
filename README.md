# xilofone-fetch
Fetch Xilofone messages and output them

## Installation

```bash
# npm
npm install -D @rezo-zero/xilofone-fetch

# yarn
yarn add -D @rezo-zero/xilofone-fetch

# pnpm
pnpm add -D @rezo-zero/xilofone-fetch
```

## Configuration

Copy `.env.sample` to `.env` and fill in your credentials:

```dotenv
XILOFONE_BASE_URL=https://xilofone.example.com
XILOFONE_USERNAME=user
XILOFONE_PASSWORD=***********
XILOFONE_FILE_ID=12
XILOFONE_OUTPUT=assets/locales/
# Optional: override the output file base name ({locale} is replaced automatically)
# XILOFONE_OUTPUT_FILE_NAME={locale}
```

## Usage

Add a script to your `package.json`:

```json
{
    "scripts": {
        "xilo": "node ./node_modules/@rezo-zero/xilofone-fetch/dist/index.js"
    }
}
```

Then run it with your package manager:

```bash
# npm
npm run xilo

# yarn
yarn xilo

# pnpm
pnpm xilo
```
