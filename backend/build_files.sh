#!/usr/bin/env bash

echo "Building the project..."
python3 -m pip install -r requirements.txt

echo "Make migration"
python3 manage.py makemigrations --noinput
python3 manage.py migrate --noinput

echo "Populate icons"
python3 manage.py popular_icones

echo "Collect static files"
python3 manage.py collectstatic --noinput --clear
