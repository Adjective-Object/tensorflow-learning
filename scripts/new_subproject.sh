#!/usr/bin/env bash

if [[ "$#" != "1" ]]; then
    echo "usage: $0 <project-name>"
    exit 1
fi

PROJECT_NAME=$1

echo "creating project directory"

mkdir $PROJECT_NAME

VENV_DIR=`pwd`"/$PROJECT_NAME/venv"
echo "creating virtualenv at VENV_DIR"
virtualenv --system-site-packages -p python3 $VENV_DIR

echo "installing pip in virtualenv"

cd $PROJECT_NAME
source ./venv/bin/activate
pip install --upgrade pip

echo "installing tensorflow in virtualenv"
pip install --upgrade tensorflow

echo "installing black (code formatter)"
pip install --upgrade black
