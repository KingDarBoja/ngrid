#!/bin/bash

# Usage: ./update-pebula.sh

TARGET=~/work/Q-Thor-Angular

echo "Removing Angular cache..."
rm -rf "$TARGET/.angular/cache"

echo "Removing node_modules/@pebula in target project..."
rm -rf "$TARGET/node_modules/@pebula"

echo "Copying dist/@pebula to target project's node_modules..."
mkdir -p "$TARGET/node_modules"
cp -r dist/@pebula "$TARGET/node_modules/"

echo "Done."
