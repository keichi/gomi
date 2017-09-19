FROM node

COPY . /app

WORKDIR /app
RUN npm install

CMD ["node", "/app/app.js"]

EXPOSE 5000
