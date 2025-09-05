#!/bin/bash

echo "Setting up Multi-Structure Billing API..."

# Create directories
echo "Creating directory structure..."
mkdir -p src/{config,controllers,middleware,routes,services,utils}
mkdir -p uploads tests docs logs
touch uploads/.gitkeep
touch logs/.gitkeep

# Copy environment file
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please update the .env file with your actual configuration values."
else
    echo ".env file already exists"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with proper values"
echo "2. Set up your Neon database"
echo "3. Run 'npm run dev' to start the development server"