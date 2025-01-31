ARG NODE_VERSION=20



FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /var/www
COPY package.json package-lock.json ./
COPY plugins ./plugins/
# RUN --mount=type=cache,target=/root/.npm npm install
RUN npm install



FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /var/www
COPY --from=deps /var/www .
COPY . .
COPY --from=deps /var/www/plugins ./plugins/
ENV NODE_ENV=production
# RUN --mount=type=cache,target=./node_modules/.cache npm run build
RUN npm run build
CMD ["npm", "run", "serve"]
EXPOSE 8080





FROM ghcr.io/rabotaru/dochub/nginx:v0.0.3 as nginx
COPY --chown=101 --from=builder /var/www/dist /usr/share/nginx/html