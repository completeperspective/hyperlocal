#!/bin/bash

# Remove all installed packages
echo "Removing all installed packages..."
find . -name "node_modules" -print0 | xargs -0 rm -rf

# Remove all lock files
echo "Removing all lock files..."
find . -name "package-lock.json" -print0 | xargs -0 rm -f
find . -name "yarn.lock" -print0 | xargs -0 rm -f
find . -name "pnpm-lock.yaml" -print0 | xargs -0 rm -f

# Remove all build artifacts
echo "Removing all build artifacts..."
find . -name ".next" -print0 | xargs -0 rm -rf
find . -name ".keystone" -print0 | xargs -0 rm -rf