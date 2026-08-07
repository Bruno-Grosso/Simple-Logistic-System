# Simple-Logistic-System

This aims to be a simple implementation of a logistics system, built as a project for the "Princípios de Engenharia de Software" provided by UERJ-IPRJ.  

> This is an updated branch after reconsidering our approach to the back-end infrastructure. To see where the previous iteration stopped, check the "legacy" branch.

You will need to setup .env files under `back/` and `back/app` with the following definitions (values are examples):
```yaml
NODE_LOCAL_PORT = 8081
NODE_DOCKER_PORT = 8080

POSTGRESDB_USER = postgres
POSTGRESDB_ROOT_PASSWORD = postgres
POSTGRESDB_DATABASE = postgres
POSTGRESDB_LOCAL_PORT = 5432
POSTGRESDB_DOCKER_PORT = 5432

VALHALLA_LOCAL_PORT=8002
VALHALLA_DOCKER_PORT=8002
```

The front-end provides a sample `.env.example` file.

## Back-end
### To run:
Setup (only on the first run):
```bash
cd back/app && npm install
```

You will need 2 windows, in 1 run:
```bash
cd back && docker compose up -d
```

On the other run:
```bash
cd back/app && npm run build && npm start
```

To run the tests (requires docker and the server to be running):
```bash
cd back/app && npm test
```

### To stop:

```bash
docker compose down
```

## Front-end
Setup (only on the first run):
```bash
cd front && npm install
```

Then build and run:
```bash
cd front && npm run build && npm start
```

### Tests

The front-end test suite uses Cypress. Install front-end dependencies once, then
start the front-end in one terminal:

```bash
cd front && npm run dev
```

Run tests from a second terminal:

```bash
cd front && npm test
```

Run a group only when needed:

```bash
cd front && npm run test:unit
cd front && npm run test:ui
cd front && npm run test:integration
cd front && npm run test:e2e
```

Open Cypress interactive runner with `cd front && npm run cypress:open`.
Tests use `http://localhost:3000` by default. Pages fall back to mock data if
the back-end is unavailable; configure `front/.env.local` and run the back-end
to test live API behavior.

**Under orientation of Dener dos Santos.**
