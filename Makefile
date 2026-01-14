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
	ssh root@89.169.37.68 "export NVM_DIR=\"\$$HOME/.nvm\" && [ -s \"\$$NVM_DIR/nvm.sh\" ] && . \"\$$NVM_DIR/nvm.sh\" && cd /var/www/formaflow/frontend && git fetch origin && git reset --hard origin/master && yarn build"

.PHONY: all build dev lint test deploy
