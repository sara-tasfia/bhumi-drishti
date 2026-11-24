#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "🌾 Pushing Bhumi Drishti to GitHub"
echo "Repository: https://github.com/sara-tasfia/bhumi-drishti"
echo "Author: Sara Tasfia <stasfia492@gmail.com>"
echo "=========================================================="

# 1. Initialize git if needed
if [ ! -d ".git" ]; then
    echo "--> Initializing Git repository..."
    git init
fi

# 2. Configure local repository identity (isolated to this repo)
echo "--> Configuring repository author..."
git config user.name "Sara Tasfia"
git config user.email "stasfia492@gmail.com"

# 3. Stage all project files respecting .gitignore
echo "--> Staging project files..."
git add .

# 4. Check status and commit
if git diff --staged --quiet; then
    echo "--> Working tree clean, nothing new to commit."
else
    echo "--> Creating commit..."
    git commit -m "feat: complete bilingual Bhumi Drishti app with Land Intelligence, Gemini AI & Live APIs"
fi

# 5. Set default branch to main
git branch -M main

# 6. Configure remote origin
if git remote | grep -q "^origin$"; then
    git remote set-url origin https://github.com/sara-tasfia/bhumi-drishti.git
else
    git remote add origin https://github.com/sara-tasfia/bhumi-drishti.git
fi

# 7. Resolve token
TOKEN="${1:-$GH_TOKEN}"
if [ -z "$TOKEN" ]; then
    read -rsp "Enter your GitHub Token: " TOKEN
    echo ""
fi

if [ -z "$TOKEN" ]; then
    echo "❌ Error: Token cannot be empty."
    exit 1
fi

echo "--> Pushing to GitHub (https://github.com/sara-tasfia/bhumi-drishti.git)..."
# Push using authenticated URL without permanently saving token in git config
git push -u "https://sara-tasfia:${TOKEN}@github.com/sara-tasfia/bhumi-drishti.git" main

# Clean remote URL so token is not retained in .git/config
git remote set-url origin https://github.com/sara-tasfia/bhumi-drishti.git

echo ""
echo "🎉 Successfully pushed to https://github.com/sara-tasfia/bhumi-drishti !"
