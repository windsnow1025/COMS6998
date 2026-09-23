# Nest.js

## Development

### pnpm

1. Install Node.js
2. Install pnpm: `npm install -g pnpm`
3. Install dependencies: `pnpm install`

#### Update Package Manager

```bash
pnpm self-update
```

### WebStorm

Settings >> Languages & Frameworks >> JavaScript Runtime >> Package manager: `~\AppData\Roaming\npm\pnpm.cmd`

### Environment Variables

- Copy `./.env.example` and rename it to `.env`, then fill in the Env variables.

## OpenAPI

### Requirements

1. Install openapi-generator-cli globally.
    ```bash
    npm i -g @openapitools/openapi-generator-cli@latest
    ```
2. Install Java.

### Generate Client Package

```bash
rm -r ../next/src/client/nest # TypeScript
```

```bash
# TypeScript
openapi-generator-cli generate -i http://localhost:3001/docs-json -g typescript-axios -o ../next/src/client/nest
```

## Run

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
