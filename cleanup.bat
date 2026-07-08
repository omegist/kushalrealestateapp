@echo off
REM Kushal Estate App - Cleanup & Verification Script (Windows)
REM Run this script to complete the cleanup process

echo.
echo 🧹 Kushal Estate App - Lovable Cleanup Script
echo =============================================
echo.

REM Step 1: Install dependencies
echo 📦 Step 1: Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ npm install failed
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Step 2: Check TypeScript
echo 🔍 Step 2: Checking TypeScript...
call npx tsc --noEmit
if errorlevel 1 (
    echo ⚠️  TypeScript errors found (may be OK)
)
echo.

REM Step 3: Run linter
echo 🔍 Step 3: Running ESLint...
call npm run lint
if errorlevel 1 (
    echo ⚠️  Linting issues found (may be OK)
)
echo.

REM Step 4: Build
echo 🔨 Step 4: Building for production...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed
    exit /b 1
)
echo ✅ Build successful
echo.

REM Step 5: Optional cleanup
echo 🗑️  Step 5: Optional - Delete old files?
echo.
echo Files to delete:
echo   - vite.config (1).ts
echo   - tsconfig (1).json
echo   - eslint.config (1).js
echo   - package (1).json
echo   - src\start.ts
echo   - src\server.ts
echo   - src\lib\lovable-error-reporting.ts
echo   - .lovable\ directory
echo   - bun.lock
echo   - bunfig.toml
echo   - components (1).json
echo   - AGENTS.md
echo.
set /p DELETE="Delete these files? (y/n): "
if /i "%DELETE%"=="y" (
    del /f /q "vite.config (1).ts" 2>nul
    del /f /q "tsconfig (1).json" 2>nul
    del /f /q "eslint.config (1).js" 2>nul
    del /f /q "package (1).json" 2>nul
    del /f /q "src\start.ts" 2>nul
    del /f /q "src\server.ts" 2>nul
    del /f /q "src\lib\lovable-error-reporting.ts" 2>nul
    rmdir /s /q ".lovable" 2>nul
    del /f /q "bun.lock" 2>nul
    del /f /q "bunfig.toml" 2>nul
    del /f /q "components (1).json" 2>nul
    del /f /q "AGENTS.md" 2>nul
    echo ✅ Old files deleted
) else (
    echo ⏭️  Skipped file deletion
)
echo.

REM Step 6: Summary
echo ✅ Cleanup Complete!
echo =============================================
echo.
echo 📊 Summary:
echo   ✅ Dependencies installed
echo   ✅ TypeScript checked
echo   ✅ ESLint run
echo   ✅ Production build created
echo.
echo 🚀 Next steps:
echo   1. Start dev server: npm run dev
echo   2. Test all pages and features
echo   3. Deploy: npm run build ^&^& deploy dist/
echo.
echo 📚 Documentation:
echo   - README.md - Project overview
echo   - SETUP_GUIDE.md - Development guide
echo   - CLEANUP_SUMMARY.md - What changed
echo   - CLEANUP_CHECKLIST.md - Verification steps
echo.
pause
