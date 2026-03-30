@echo off
git add package.json package-lock.json
git commit -m "fix: sync package-lock.json with package.json"
git push
