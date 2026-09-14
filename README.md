# BlogNest

BlogNest est un projet d'apprentissage construit autour d'une API REST NestJS et d'une interface Next.js.

## Development

1. Copy `.env.example` to `.env` and set a unique `JWT_SECRET`.
2. Run `make start`.
3. Open `http://localhost:5173` for the frontend and `http://localhost:3000/api` for the development API documentation.

Useful commands:

```sh
make stop
make test
make check-n-test
make front-e2e
make migrate
make seed
make database-reset-and-seed
```

`make database-reset-and-seed` deletes the development SQLite volume before recreating and seeding it.

`make front-e2e` runs the Playwright browser suite locally. The first run requires `npx playwright install chromium`.

## Production containers

The production stack uses separate multi-stage images. It keeps the SQLite database and uploaded images in named Docker volumes.

```sh
API_PORT=3001 FRONTEND_PORT=5174 make start-production
```

Set `JWT_SECRET` to a strong, unique secret before starting it. `NEXT_PUBLIC_API_URL` must be the public API URL visible from the browser; by default it follows `API_PORT`. `CORS_ORIGINS` similarly follows `FRONTEND_PORT`. The frontend container uses the internal API URL automatically.

Stop the production stack with:

```sh
make stop-production
```
