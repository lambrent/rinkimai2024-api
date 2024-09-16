FROM node:16-alpine

# Create app directory
WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

# Bundle app source
COPY . .

EXPOSE 8080
CMD [ "yarn", "start" ]