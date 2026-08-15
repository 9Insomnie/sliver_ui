BIN      ?= sliver-ui
GO       ?= go
NPM      ?= npm

# On Windows the binary is linked as a GUI subsystem so it starts without a
# cmd console window. Extra ldflags can be appended via GO_LDFLAGS.
GOOS       := $(shell $(GO) env GOOS)
GO_LDFLAGS ?=
ifeq ($(GOOS),windows)
GO_LDFLAGS += -H=windowsgui
endif

.PHONY: all frontend-build backend-build build test vet run dev clean

all: build

## frontend-build: install deps, build the web client, copy output into the
## embedded backend directory (backend/web/dist).
frontend-build:
	cd frontend && $(NPM) ci && $(NPM) run build
	rm -rf backend/web/dist
	mkdir -p backend/web/dist
	cp -r frontend/dist/* backend/web/dist/

## backend-build: build the single Go binary.
backend-build:
	cd backend && $(GO) build -ldflags "$(GO_LDFLAGS)" -o ../$(BIN) .

## build: full single-binary production build (frontend embedded in backend).
build: frontend-build backend-build

## test: run frontend and backend tests.
test:
	cd frontend && $(NPM) test
	cd backend && $(GO) test ./...

## vet: run go vet on the backend.
vet:
	cd backend && $(GO) vet ./...

## run: build and start the single binary.
run: build
	./$(BIN) --addr 0.0.0.0:8080

## dev: start the API server and the Vite dev server (frontend proxies /api).
dev:
	cd backend && $(GO) run . --addr 0.0.0.0:8080 &
	cd frontend && $(NPM) run dev

## clean: remove build artifacts (keeps backend/web/dist/.gitkeep for go:embed).
clean:
	rm -f $(BIN)
	rm -rf frontend/dist
	rm -rf backend/web/dist/*
	touch backend/web/dist/.gitkeep
