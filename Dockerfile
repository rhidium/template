FROM node:21-alpine

# Create app/working/bot directory
RUN mkdir -p /app
WORKDIR /app

# Install app production dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm ci

# Bundle app source
COPY . ./

# Build the project
RUN npx prisma generate
RUN npm run build

# Run the start command
CMD [ "npm", "start" ]
