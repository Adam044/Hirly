# Use the official Node.js 20-alpine image as a base
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install application dependencies
RUN npm install --omit=dev

# Copy the rest of your application code to the container
COPY . .

# --- START DEBUGGING ADDITIONS ---
# List all files and directories in the working directory
RUN ls -la /usr/src/app

# List contents of the 'utils' directory, as emailService.js is critical
RUN ls -la /usr/src/app/utils
# --- END DEBUGGING ADDITIONS ---

# Your server.js is configured to listen on process.env.PORT or 8080.
EXPOSE 8080

# Command to run your application when the container starts
CMD ["node", "server.js"]