# Deploy to Vercel Script
Write-Host "🚀 Deploying MemberHub Pro to Vercel" -ForegroundColor Cyan

# Install Vercel CLI if not installed
Write-Host "Installing/Updating Vercel CLI..." -ForegroundColor Yellow
npm i -g vercel

# Login to Vercel
Write-Host "Logging in to Vercel..." -ForegroundColor Yellow
vercel login

# Link to Vercel project
Write-Host "Linking to Vercel project..." -ForegroundColor Yellow
vercel link

# Deploy
Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

Write-Host "✅ Deployment complete!" -ForegroundColor Green
