# ---------- Étape 1 : build Angular ----------
FROM node:20-alpine AS build
WORKDIR /app

# Cache des dépendances npm
COPY package*.json ./
RUN npm ci

# Code source puis build de prod
COPY . .
RUN npm run build -- --configuration production

# ---------- Étape 2 : servir avec Nginx ----------
FROM nginx:1.27-alpine

# Angular CLI 21 génère le build dans dist/<nom-du-projet>/browser
# Nom du projet = "ng-tailadmin" (voir angular.json -> "projects")
COPY --from=build /app/dist/ng-tailadmin/browser /usr/share/nginx/html

# Config Nginx pour le routing Angular (redirige tout vers index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
