# ---------- Étape 1 : build avec Maven ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# On copie d'abord le pom.xml seul pour profiter du cache Docker sur les dépendances
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Puis le reste du code source
COPY src ./src
RUN mvn -B clean package -DskipTests

# ---------- Étape 2 : image d'exécution légère ----------
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Récupère le jar généré à l'étape précédente (nom exact peu importe grâce au wildcard)
COPY --from=build /app/target/medtrack-backend-*.jar app.jar

# Port par défaut de Spring Boot
EXPOSE 8080

# Variables d'environnement surchargeables (voir docker-compose / K8s ConfigMap)
ENV SPRING_PROFILES_ACTIVE=docker

ENTRYPOINT ["java", "-jar", "app.jar"]
