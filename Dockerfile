FROM circleci/node:11-browsers

USER root
WORKDIR /usr/src
COPY package.json .
RUN whoami
RUN npm install
COPY . .
RUN npm run build
