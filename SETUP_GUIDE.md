# Project Structure & Setup Guide

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm preview

# Run linter
npm lint

# Format code
npm format
```

## Project Structure

```
kushal-estate-app/
├── src/
│   ├── main.tsx                 # React app entry point
│   ├── router.tsx               # TanStack Router configuration
│   ├── styles.css               # Global styles
│   ├── routes/                  # Page routes
│   │   ├── __root.tsx           # Root layout
│   │   ├── index.tsx            # Home page
│   │   ├── properties.tsx       # Properties listing
│   │   ├── porperties.$id.tsx   # Property details
│   │   ├── auth.tsx             # Authentication
│   │   ├── contact.tsx          # Contact page
│   │   ├── team.tsx             # Team page
│   │   └── authenticated/       # Protected routes
│   ├── components/
│   │   ├── ui/                  # Radix UI components
│   │   ├── app/                 # App-specific components
│   │   └── admin/               # Admin components
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities and helpers
│   ├── integrations/
│   │   └── supabase/            # Supabase client & auth
│   ├── assets/                  # Images and static files
│   └── routeTree.gen.ts         # Auto-generated route tree
├── supabase/
│   ├── migrations/              # Database migrations
│   └── config.toml              # Supabase config
├── index.html                   # HTML entry point
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── eslint.config.js             # ESLint configuration
├── package.json                 # Dependencies
└── .env                         # Environment variables

```

## Key Files

### index.html
Entry point for the Vite dev server and production build. Mounts React app to `#root` element.

### src/main.tsx
React app initialization. Creates router instance and renders app.

### src/router.tsx
TanStack Router setup with QueryClient context.

### src/routes/__root.tsx
Root layout component with:
- Error boundary
- 404 page
- Supabase auth state management
- React Query provider
- Toast notifications

### vite.config.ts
Vite configuration with:
- React plugin
- TanStack Router plugin
- TypeScript path aliases
- Dev server settings

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development

### Adding a New Page

1. Create a new file in `src/routes/` (e.g., `about.tsx`)
2. Export a `Route` object using `createFileRoute()`
3. The route is automatically added to the router

Example:
```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return <div>About Page</div>
}
```

### Using Supabase

```tsx
import { supabase } from '@/integrations/supabase/client'

// Authentication
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
})

// Database queries
const { data, error } = await supabase
  .from('table_name')
  .select('*')
```

### Using React Query

```tsx
import { useQuery } from '@tanstack/react-query'

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('*')
      return data
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <div>{/* render data */}</div>
}
```

## Deployment

### Build
```bash
npm run build
```

Creates optimized production build in `dist/` directory.

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Deploy to AWS S3 + CloudFront
```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Troubleshooting

### Port already in use
```bash
npm run dev -- --port 3001
```

### Clear cache and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
# Check for type errors
npx tsc --noEmit
```

### Build fails
```bash
# Clear Vite cache
rm -rf dist .vite

# Rebuild
npm run build
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Supabase project set up
- [ ] Database migrations applied
- [ ] Build completes without errors
- [ ] All routes working
- [ ] Authentication tested
- [ ] Forms tested
- [ ] Images optimized
- [ ] SEO meta tags updated
- [ ] Analytics configured (if needed)
