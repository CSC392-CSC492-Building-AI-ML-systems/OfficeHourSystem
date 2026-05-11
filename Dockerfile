# Use Node 20 as the base
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Install dependencies first (for faster builds)
COPY package*.json ./
RUN npm install

# Copy the rest of your code
COPY . .

# Generate Prisma client so the app can talk to the DB
RUN npx prisma generate

# Build the Next.js app
RUN npm run build

# Start the production server
CMD ["npm", "start"]