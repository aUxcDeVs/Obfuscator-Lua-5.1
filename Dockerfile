FROM node:18

# Install Lua
RUN apt-get update && \
    apt-get install -y lua5.1 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy everything
COPY package*.json ./
RUN npm install

COPY . .

# Verify Prometheus exists
RUN ls -la /app/Prometheus

EXPOSE 3000

CMD ["npm", "start"]
