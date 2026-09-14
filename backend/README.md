# BlogNest

BlogNest is a REST blog API built with NestJS as a learning project.

## Development

The development environment runs in Docker with SQLite volumes for application and test data.

```bash
make start
make stop
make check-n-test
```

## Database

```bash
make migrate
make seed
make database-reset-and-seed
```

## API documentation

Outside production, Swagger UI is available at `http://localhost:3000/api`.
The OpenAPI JSON document is available at `http://localhost:3000/api-json`.

## Configuration

Copy `.env.example` to `.env` and provide a secure `JWT_SECRET`.
Configuration is validated on application startup.
