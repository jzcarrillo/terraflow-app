FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S landregistry -u 1001

# Change ownership
RUN chown -R landregistry:nodejs /app

EXPOSE 3000

USER landregistry

CMD ["npm", "start"]