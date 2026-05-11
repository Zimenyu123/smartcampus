FROM node:20
WORKDIR /server
COPY package*.json ./
COPY . .
RUN npm config set registry https://registry.npmmirror.com/
RUN npm i -g pnpm@8.15.6 && pnpm config set registry https://registry.npmmirror.com/
CMD cd /server && pnpm i && pnpm run start
EXPOSE 7002
