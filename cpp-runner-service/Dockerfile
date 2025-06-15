
# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Install g++ and other build essentials
RUN apt-get update && \
    apt-get install -y g++ build-essential && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
RUN npm install --omit=dev

# Bundle app source
COPY . .

# Make port 3001 available to the world outside this container
# Render will map this to 80/443 automatically via its PORT env var
EXPOSE 3001

# Define environment variable for the port
ENV PORT 3001

# Run server.js when the container launches
CMD ["node", "server.js"]
