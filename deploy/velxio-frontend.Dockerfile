FROM node:20 AS frontend-builder

WORKDIR /app
COPY vendor/velxio/frontend/ frontend/
COPY vendor/velxio/scripts/ scripts/

WORKDIR /app/frontend
RUN npm install --legacy-peer-deps --no-package-lock --include=optional
RUN npm run build:docker

FROM nginx:1.27-alpine

COPY deploy/velxio-nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-builder /app/frontend/dist/ /usr/share/nginx/html/

EXPOSE 8080
