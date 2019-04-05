echo "Updating list of packages and installing nodejs and npm..."
sudo apt-get update
sudo apt-get install nodejs npm
echo "Installing npm packages..."
npm install
echo "Starting the server..."
npm start