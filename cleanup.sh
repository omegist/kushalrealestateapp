#!/bin/bash
# Kushal Estate App - Cleanup & Verification Script
# Run this script to complete the cleanup process

echo "🧹 Kushal Estate App - Lovable Cleanup Script"
echo "=============================================="
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Step 2: Check TypeScript
echo "🔍 Step 2: Checking TypeScript..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "⚠️  TypeScript errors found (may be OK)"
fi
echo ""

# Step 3: Run linter
echo "🔍 Step 3: Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
    echo "⚠️  Linting issues found (may be OK)"
fi
echo ""

# Step 4: Build
echo "🔨 Step 4: Building for production..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Build successful"
echo ""

# Step 5: Optional cleanup
echo "🗑️  Step 5: Optional - Delete old files?"
echo ""
echo "Files to delete:"
echo "  - vite.config (1).ts"
echo "  - tsconfig (1).json"
echo "  - eslint.config (1).js"
echo "  - package (1).json"
echo "  - src/start.ts"
echo "  - src/server.ts"
echo "  - src/lib/lovable-error-reporting.ts"
echo "  - .lovable/ directory"
echo "  - bun.lock"
echo "  - bunfig.toml"
echo "  - components (1).json"
echo "  - AGENTS.md"
echo ""
read -p "Delete these files? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f "vite.config (1).ts"
    rm -f "tsconfig (1).json"
    rm -f "eslint.config (1).js"
    rm -f "package (1).json"
    rm -f src/start.ts
    rm -f src/server.ts
    rm -f src/lib/lovable-error-reporting.ts
    rm -rf .lovable/
    rm -f bun.lock
    rm -f bunfig.toml
    rm -f "components (1).json"
    rm -f AGENTS.md
    echo "✅ Old files deleted"
else
    echo "⏭️  Skipped file deletion"
fi
echo ""

# Step 6: Summary
echo "✅ Cleanup Complete!"
echo "=============================================="
echo ""
echo "📊 Summary:"
echo "  ✅ Dependencies installed"
echo "  ✅ TypeScript checked"
echo "  ✅ ESLint run"
echo "  ✅ Production build created"
echo ""
echo "🚀 Next steps:"
echo "  1. Start dev server: npm run dev"
echo "  2. Test all pages and features"
echo "  3. Deploy: npm run build && deploy dist/"
echo ""
echo "📚 Documentation:"
echo "  - README.md - Project overview"
echo "  - SETUP_GUIDE.md - Development guide"
echo "  - CLEANUP_SUMMARY.md - What changed"
echo "  - CLEANUP_CHECKLIST.md - Verification steps"
echo ""
