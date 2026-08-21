FROM node:20-alpine

# O Prisma precisa do OpenSSL, que a imagem Alpine não traz por padrão
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3333

CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run seed && npm start"]