FROM node:24.13.0-slim

WORKDIR /app

COPY server.mjs ./

USER node

EXPOSE 3101

CMD ["node", "server.mjs"]
