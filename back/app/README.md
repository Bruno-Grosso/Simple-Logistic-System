# Back-end (Node.js)

This project uses **Node.js**, **Hono** for the API layer, **Postgres.js** for database connectivity, and **Vitest** for testing.

## Prerequisites
- Node.js (v20 or higher)
- Docker and Docker Compose

## Getting Started
### 1. Build & Run (Docker)
```bash
docker compose up --build
```
The API will be available at `http://localhost:8080`.

### 2. Local Development
To run the server locally with hot-reloading:

```bash
cd app
npm install
npm run dev
```

## Available Scripts
Inside the `app` directory, you can run:

*   **`npm run build`**: Bundles the TypeScript code into `dist/index.js` using `esbuild`.
*   **`npm run start`**: Runs the compiled production build from the `dist` folder.
*   **`npm run dev`**: Starts the development server with `tsx` (watch mode).
*   **`npm run test`**: Runs the test suite using `vitest`.

## Testing
The tests are designed to run against the live Docker container to simulate real-world front-end requests. 

1. Ensure the containers are running: `docker compose up -d`
2. Run the tests:
```bash
cd app
npm run test
```

## Project Structure
- `src/server.ts`: Request handling logic and routing.
- `src/model.ts`: Database connection and configuration.
- `src/controller.ts`: Data access layer and repositories.
- `index.ts`: Application entry point.
- `tests/`: Vitest test files targeting the API.
