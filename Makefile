COMPOSE ?= docker compose

.DEFAULT_GOAL := help

.PHONY: help up down logs test-api test-ai lint-api lint-web build-web test-e2e smoke smoke-stack backup check

help: ## Hien thi danh sach cac target kha dung
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-12s %s\n", $$1, $$2}'

up: ## Khoi dong stack container o che do nen
	$(COMPOSE) up -d

down: ## Dung cac container (giu nguyen volumes va du lieu)
	$(COMPOSE) down

logs: ## Xem log he thong theo thoi gian thuc
	$(COMPOSE) logs -f

test-api: ## Chay kiem thu Laravel API trong container backend-test (su dung DB rental_test)
	@if ! $(COMPOSE) exec -T db pg_isready -U rental -d rental >/dev/null 2>&1; then \
		echo "Loi: Container 'db' khong chay hoac chua san sang. Vui long chay 'make up' truoc khi chay 'make test-api'." >&2; \
		exit 1; \
	fi
	@$(COMPOSE) exec -T db sh -c "\
		if ! psql -U rental -d postgres -tAc \"SELECT 1 FROM pg_database WHERE datname = 'rental_test'\" | grep -q 1; then \
			echo 'Khoi tao database rental_test...'; \
			createdb -U rental rental_test; \
		fi"
	$(COMPOSE) --profile test build backend-test
	@TARGET_DB=$$($(COMPOSE) --profile test run --rm -T --no-deps backend-test php -r "require 'vendor/autoload.php'; \$$app = require 'bootstrap/app.php'; \$$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); echo config('database.connections.pgsql.database');" | tail -n 1); \
	echo "Database: $$TARGET_DB"; \
	if [ "$$TARGET_DB" != "rental_test" ]; then \
		echo "Loi nghiem trong: Database khong phai rental_test (got: '$$TARGET_DB'). Huy bo kiem thu de bao ve du lieu!" >&2; \
		exit 1; \
	fi
	$(COMPOSE) --profile test run --rm -T backend-test php artisan test

test-ai: ## Chay kiem thu contract AI service bang pytest trong container ai-service-test
	$(COMPOSE) --profile test build ai-service-test
	$(COMPOSE) --profile test run --rm -T ai-service-test pytest

lint-api: ## Kiem tra code style (Pint) va phan tich tinh (PHPStan/Larastan level max)
	cd apps/api && ./vendor/bin/pint --test && ./vendor/bin/phpstan analyse --no-progress --memory-limit=1G

lint-web: ## Kiem tra frontend: ESLint (0 warning), Prettier, tsc
	npm --prefix apps/web run lint
	npm --prefix apps/web run format:check
	npm --prefix apps/web run typecheck

build-web: ## Bien dich frontend SPA cho production
	npm --prefix apps/web run build

test-e2e: ## Chay kiem thu giao dien E2E Playwright
	cd apps/web && npx playwright test

smoke: ## Chay bo kiem thu smoke test API va quy trinh nghiep vu
	bash scripts/e2e-smoke.sh

smoke-stack: ## Smoke test stack docker compose dang chay (nginx + FrankenPHP + Reverb), xem scripts/stack-smoke.py
	@set -a; [ -f .env ] && . ./.env; set +a; \
	STACK_WEB_URL=http://localhost:$${FRONTEND_PORT:-5174} STACK_API_URL=http://localhost:$${API_PORT:-8000} \
	STACK_REVERB=localhost:$${REVERB_PORT:-8080} python3 scripts/stack-smoke.py

backup: ## Chay sao luu database va storage volume vao thu muc backups
	bash infra/backup/backup.sh

check: lint-api test-api lint-web build-web ## Chay toan bo cac buoc kiem tra (lint-api, test-api, lint-web, build-web)
