# xilofone-fetch
Fetch Xilofone messages and output them

## Installation

`yarn add @rezo-zero/xilofone-fetch`

## Configuration

```dotenv
XILOFONE_BASE_URL=xilofone.example.com
XILOFONE_USERNAME=user
XILOFONE_PASSWORD=***********
XILOFONE_PROJECT_ID=12
XILOFONE_FILE_NAME=nuxt.xlf
XILOFONE_OUTPUT=/assets/locales/
```

## Usage

```bash
npx @rezo-zero/xilofone-fetch
```

or setup a custom npm script into package.json file

```json
{
    "scripts": {
        "xilo": "node ./node_modules/@rezo-zero/xilofone-fetch/dist/index.js"
    }
}
```

and use it like

```bash
yarn xilo
```
