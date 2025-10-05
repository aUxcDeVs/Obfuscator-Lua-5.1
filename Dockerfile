FROM node:18

RUN apt-get update && apt-get install -y lua5.1 git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

RUN git clone https://github.com/Gamandax/Prometheus.git

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
