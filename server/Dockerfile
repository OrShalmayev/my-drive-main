FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4002
ENV IMAGES_PATH=/data/images
CMD ["npm", "start"]
