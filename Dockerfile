# ---- frontend build ----
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- backend build (embeds frontend dist) ----
FROM golang:1.25-alpine AS backend
WORKDIR /app
COPY backend/ ./
COPY --from=frontend /app/frontend/dist ./web/dist
RUN CGO_ENABLED=0 go build -o /out/sliver-ui .

# ---- runtime ----
FROM alpine:3.20
RUN addgroup -S appuser && adduser -S -G appuser appuser
WORKDIR /app
COPY --from=backend /out/sliver-ui /usr/local/bin/sliver-ui
USER appuser
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/sliver-ui"]
CMD ["--addr", "0.0.0.0:8080"]
