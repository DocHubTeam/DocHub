# Use multi-stage build
FROM docker/dockerfile:1.3 AS dockerfile-image

FROM node:20-alpine AS deps
WORKDIR /var/www
COPY package.json package-lock.json ./

# Create all required plugins with minimal package.json and index.js files
RUN for plugin in html markaper charts smartants plantuml mermaid network asyncapi bpmnjs table drawio devtool svg; do \
    mkdir -p plugins/$plugin && \
    echo "{\"name\": \"$plugin-plugin\", \"version\": \"1.0.0\"}" > plugins/$plugin/package.json && \
    printf "/* eslint-disable */\nexport default {};" > plugins/$plugin/index.js; \
    done

RUN npm install

FROM node:20-alpine AS builder
WORKDIR /var/www
COPY --from=deps /var/www .
COPY . .

# Create necessary directories and copy documentation
RUN mkdir -p public/build && \
    mkdir -p public/documentation/docs/manual/docs && \
    mkdir -p public/documentation/docs/manual/docs/templates && \
    touch public/documentation/docs/manual/docs/templates/empty.md

# Run indexing and build
RUN npm run build:index && \
    npm run build

FROM ghcr.io/rabotaru/dochub/nginx:v0.0.3 AS nginx
# Create directories with proper permissions
USER root
RUN mkdir -p /usr/share/nginx/html/build && \
    chown -R nginx:nginx /usr/share/nginx/html

# Copy files
COPY --from=builder /var/www/dist /usr/share/nginx/html
COPY --from=builder /var/www/public/build/document-index.json /usr/share/nginx/html/build/

# Switch back to nginx user
USER nginx


