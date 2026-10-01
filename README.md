# Simple-Logistic-System
This aims to be an implementation of a logistics system, built as a project for the "Princípios de Engenharia de Software" provided by UERJ-IPRJ.  

## Back-end
### Running:
Setup (only on the first run), example `.env` files are provided along with the repo:
```bash
cd back/app && npm install
```

You will need 2 windows, in 1 run (on `back/`):
```bash
docker compose up -d
```

To run the tests (requires docker to be running, run at `back/app`):
```bash
npm test
```

**Stopping:**
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
npm run build && npm start
```

### Tests
The front-end test suite uses Cypress, so it requires the front-end to be running:
```bash
npm run dev
```

Run tests from a second terminal:
```bash
npm test
```

Run a group only when needed:
```bash
npm run test:unit
npm run test:ui
npm run test:integration
npm run test:e2e
```

Open Cypress interactive runner with `cd front && npm run cypress:open`.
Tests use `http://localhost:3000` by default. Pages fall back to mock data if
the back-end is unavailable; configure `front/.env.local` and run the back-end
to test live API behavior.

**Under orientation of Dener dos Santos.**
