#!/bin/sh
export HOME=/home/svkruik
export PATH=/usr/bin/php:$PATH
cd src

# PHP
composer install
apt-get install php-mysql
apt-get install php-xml
apt-get install php-curl

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Node
npm install
npm run build
