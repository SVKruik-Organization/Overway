#!/bin/sh
export HOME=/home/svkruik
export PATH=/usr/bin/php:$PATH

# Git
cd ..
git config --global --add safe.directory /home/svkruik/Documents/GitHub/Overway
git reset --hard
git pull
echo "Git setup complete"

# Frontend - auth.stefankruik.com
cd src
npm install
npm run build
echo "Frontend build complete"

# Backend - auth.stefankruik.com
composer update
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
echo "Backend install complete"

# Restart
echo "Deployment complete. Reloading server."
sudo systemctl restart overway-api.service
