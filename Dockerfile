#Base image setup
FROM node:8
#Change Workdir
WORKDIR /usr/src/app
#copy package json to app dir
COPY package*.json ./
#install packages
RUN npm install
#copy rest of the source code
COPY . .
#expose the port
EXPOSE 3000
#command to start the app
CMD [ "npm", "start" ]