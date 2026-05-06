.PHONY: run build seed swagger tidy test

run:
	go run ./cmd/main/main.go

build:
	go build -o bin/server ./cmd/main/main.go

seed:
	go run ./cmd/seed/seed.go

swagger:
	$(shell go env GOPATH)/bin/swag init -g cmd/main/main.go -o docs

tidy:
	go mod tidy

test:
	go test ./...
