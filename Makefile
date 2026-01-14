# Variables
YARN = yarn

# Default target
all: lint build

build:
	$(YARN) build

dev:
	$(YARN) dev

lint:
	$(YARN) lint

test:
	$(YARN) test

deploy:
	ssh root@89.169.37.68 "cd /var/www/formaflow/frontend && git fetch origin && git reset --hard origin/master && yarn build"

.PHONY: all build dev lint test deploy
