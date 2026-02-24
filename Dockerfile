FROM golang:alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy go.mod and go.sum files first to leverage Docker cache
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the rest of the application source code
COPY . .

# Build the Go application
# CGO_ENABLED=0 ensures a statically linked binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o mqvision .

# Stage 2: Create a minimal image to run the application
FROM alpine:latest

# Install CA certificates for TLS requests (e.g., to Gemini API) and tzdata for timezones
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy the built binary from the builder stage
COPY --from=builder /app/mqvision .

# Expose the default port
EXPOSE 8080

# Command to run the executable
ENTRYPOINT ["/app/mqvision"]
