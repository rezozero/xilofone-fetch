# xilofone-fetch
Fetch Xilofone messages and output them

## Installation

`yarn add -D @rezo-zero/xilofone-fetch`

## Configuration

```dotenv
XILOFONE_BASE_URL=https://xilofone.example.com
XILOFONE_USERNAME=user
XILOFONE_PASSWORD=***********
XILOFONE_FILE_ID=12
XILOFONE_OUTPUT=assets/locales/
```

## Usage

Setup a custom npm script into package.json file

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
