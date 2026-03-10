FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
COPY src/ src/
RUN npx @kinvolk/headlamp-plugin build

FROM alpine:3.20
USER 1000:1000
COPY --from=build --chown=1000:1000 /app/dist/ /plugins/headlamp-rook-plugin/
COPY --from=build --chown=1000:1000 /app/package.json /plugins/headlamp-rook-plugin/
