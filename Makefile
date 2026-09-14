.PHONY: start stop build install start-production stop-production test front-test front-e2e back-test check-n-test migrate seed database-reset-and-seed
start:
	docker compose up -d --build
stop:
	docker compose down
build:
	docker compose build
install: build
	docker compose run --rm api npm ci
	docker compose run --rm frontend npm ci
start-production:
	docker compose -f compose.production.yaml up -d --build
stop-production:
	docker compose -f compose.production.yaml down
front-test:
	docker compose run --rm frontend npm test
front-e2e:
	cd frontend && npm run test:e2e
back-test:
	docker compose run --rm api npm run test
	docker compose run --rm api npm run test:e2e
test: install front-test back-test
check-n-test:
	$(MAKE) install
	docker compose run --rm frontend npm run lint
	docker compose run --rm frontend npm run build
	docker compose run --rm api npm run lint
	docker compose run --rm api npm run build
	$(MAKE) test
migrate:
	docker compose run --rm api npm run migrate
seed:
	docker compose run --rm api npm run seed
database-reset-and-seed:
	docker compose down
	docker volume rm blognest_sqlite_data
	docker compose up -d --build
	docker compose run --rm api npm run seed
