FROM node:20.15.0
RUN npm install -g npm@latest
LABEL authors="Artisann"
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["node", "index.js"]
