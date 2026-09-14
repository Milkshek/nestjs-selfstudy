.PHONY: start stop test migrate seed database-reset-and-seed check-n-test

start:
	docker compose up -d --build

stop:
	docker compose down

test:
	docker compose run --rm api npm run test
	docker compose run --rm api npm run test:e2e

migrate:
	docker compose run --rm api npm run migrate

seed:
	docker compose run --rm api npm run seed

database-reset-and-seed:
	docker compose down
	docker volume rm blognest_sqlite_data
	docker compose up -d --build
	docker compose run --rm api npm run seed

check-n-test:
	docker compose run --rm api npm run lint
	docker compose run --rm api npm run test
	docker compose run --rm api npm run test:e2e
	docker compose run --rm api npm run build
