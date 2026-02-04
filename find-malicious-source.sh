#!/bin/bash

# Script to find the source of crypto mining malware

echo "=== Checking for Malicious Code Sources ==="
echo ""

# 1. Check package.json for suspicious scripts
echo "1. Checking package.json for postinstall/preinstall scripts..."
if grep -q "postinstall\|preinstall" package.json; then
    echo "   ⚠️  WARNING: Found postinstall/preinstall scripts!"
    grep -A 2 "postinstall\|preinstall" package.json
else
    echo "   ✓ No postinstall/preinstall scripts found"
fi
echo ""

# 2. Check package-lock.json for suspicious packages
echo "2. Checking package-lock.json for suspicious packages..."
if grep -qi "mining\|monero\|xmr\|c3pool\|supportxmr" package-lock.json; then
    echo "   ⚠️  WARNING: Found suspicious packages in package-lock.json!"
    grep -i "mining\|monero\|xmr\|c3pool\|supportxmr" package-lock.json | head -10
else
    echo "   ✓ No suspicious packages found in package-lock.json"
fi
echo ""

# 3. Check node_modules for suspicious files
echo "3. Checking node_modules for suspicious files..."
if [ -d "node_modules" ]; then
    if find node_modules -type f -name "*mining*" -o -name "*monero*" -o -name "*xmr*" 2>/dev/null | head -5; then
        echo "   ⚠️  WARNING: Found suspicious files in node_modules!"
    else
        echo "   ✓ No suspicious files found in node_modules"
    fi
else
    echo "   ⚠️  node_modules directory not found (run npm install first)"
fi
echo ""

# 4. Check for suspicious scripts in node_modules
echo "4. Checking for postinstall scripts in node_modules..."
if [ -d "node_modules" ]; then
    SUSPICIOUS_SCRIPTS=$(find node_modules -name "package.json" -exec grep -l "postinstall\|preinstall" {} \; 2>/dev/null | head -10)
    if [ -n "$SUSPICIOUS_SCRIPTS" ]; then
        echo "   ⚠️  WARNING: Found packages with postinstall/preinstall scripts:"
        echo "$SUSPICIOUS_SCRIPTS"
    else
        echo "   ✓ No suspicious scripts found"
    fi
else
    echo "   ⚠️  node_modules directory not found"
fi
echo ""

# 5. Check Dockerfile for suspicious commands
echo "5. Checking Dockerfile for suspicious commands..."
if grep -qi "curl.*base64\|wget.*base64\|sh.*base64" Dockerfile 2>/dev/null; then
    echo "   ⚠️  WARNING: Found suspicious commands in Dockerfile!"
    grep -i "curl.*base64\|wget.*base64\|sh.*base64" Dockerfile
else
    echo "   ✓ No suspicious commands found in Dockerfile"
fi
echo ""

# 6. Check docker-compose files
echo "6. Checking docker-compose files for suspicious environment variables..."
for file in docker-compose*.yaml docker-compose*.yml; do
    if [ -f "$file" ]; then
        if grep -qi "mining\|monero\|xmr\|205.185.127.97\|66.96.20.147" "$file" 2>/dev/null; then
            echo "   ⚠️  WARNING: Found suspicious content in $file!"
            grep -i "mining\|monero\|xmr\|205.185.127.97\|66.96.20.147" "$file"
        fi
    fi
done
echo ""

# 7. Check .env files
echo "7. Checking .env files for suspicious variables..."
for file in .env*; do
    if [ -f "$file" ] && [ "$file" != ".env.example" ] && [ "$file" != ".env.production.example" ]; then
        if grep -qi "mining\|monero\|xmr\|205.185.127.97\|66.96.20.147" "$file" 2>/dev/null; then
            echo "   ⚠️  WARNING: Found suspicious content in $file!"
            grep -i "mining\|monero\|xmr\|205.185.127.97\|66.96.20.147" "$file"
        fi
    fi
done
echo ""

# 8. Check for base64 encoded scripts
echo "8. Checking for base64 encoded content in source files..."
if find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) ! -path "./node_modules/*" ! -path "./.next/*" -exec grep -l "base64.*decode\|echo.*base64.*sh" {} \; 2>/dev/null | head -5; then
    echo "   ⚠️  WARNING: Found files with base64 decode patterns!"
else
    echo "   ✓ No base64 decode patterns found in source files"
fi
echo ""

# 9. Check npm audit
echo "9. Running npm audit..."
if command -v npm &> /dev/null; then
    npm audit --audit-level=moderate 2>&1 | head -20
else
    echo "   ⚠️  npm not found"
fi
echo ""

echo "=== Summary ==="
echo "If no warnings found above, the malicious code is likely:"
echo "1. In node_modules (compromised dependency)"
echo "2. Already running in the container (compromised container)"
echo "3. Injected during build process"
echo ""
echo "Next steps:"
echo "1. Check running processes in container: docker exec sfadmin-nextjs ps aux"
echo "2. Rebuild container with --no-cache: docker-compose build --no-cache"
echo "3. Check npm audit: npm audit"
echo "4. Review package-lock.json for suspicious packages"

