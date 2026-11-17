FROM node:22-alpine
WORKDIR /app
COPY server.js index.html manifest.json sw.js icon-180.png icon-192.png icon-512.png ./
ENV PORT=8080 DATA_DIR=/data
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/salud || exit 1
CMD ["node", "server.js"]
