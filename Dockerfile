FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm install --omit=dev --legacy-peer-deps

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4101

EXPOSE 4101

CMD ["npm", "run", "serve:ssr:frontend"]