.PHONY: build test lint typecheck clean dev

build:
	npm run build

test:
	npm run test

lint:
	npm run lint

typecheck:
	npm run typecheck

clean:
	npm run clean

dev:
	npm run dev

all: lint typecheck build test
