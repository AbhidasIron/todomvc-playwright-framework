# Official Playwright image: browsers + OS dependencies preinstalled.
# Tag MUST match the @playwright/test version in package.json.
FROM mcr.microsoft.com/playwright:v1.64.0-noble

WORKDIR /app

ENV CI=true

# Install deps first so this layer is cached until package*.json changes.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

# The image already ships a non-root "pwuser"; run tests as that user.
RUN chown -R pwuser:pwuser /app
USER pwuser

CMD ["npm", "test"]
