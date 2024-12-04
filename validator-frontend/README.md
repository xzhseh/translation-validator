the frontend for the translation validator, powered by [Next.js](https://nextjs.org).

## install dependencies

```bash
npm install --legacy-peer-deps
```

## start the development server

```bash
npm run dev
```

open [http://localhost:3000](http://localhost:3000) with your browser to see the frontend.

**note**: to integrate the frontend with the backend server, please make sure [RelayServer](../relay_server/RelayServer.cpp) and [ValidatorServer](../src/ValidatorServer.cpp) are both compiled and started successfully through 1) `make build` 2) `make run_validator_server` and `make run_relay` respectively in the project [root directory](../).

## build

```bash
npm run build
```
