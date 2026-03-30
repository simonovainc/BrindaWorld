# BrindaWorld — Performance Guide

## Lighthouse Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Performance | 90+ | Lazy loading, compression, cache headers |
| Accessibility | 95+ | WCAG 2.1 AA, skip link, ARIA labels |
| Best Practices | 95+ | Helmet headers, HTTPS, no console errors |
| SEO | 90+ | Meta tags, sitemap, robots.txt, canonical |

## Optimizations Applied

### Server
- **Helmet** security headers
- **Gzip compression** (threshold 1KB, level 6)
- **Rate limiting** (300 req/15min global, 15 auth attempts/15min)
- **Cache headers**: static assets = immutable 1yr, API = no-store
- **API response caching**: /curriculum = 24hr, /competitions/active = 5min

### Client
- **React.lazy()** code splitting for: Dashboard, TeacherDashboard, TeacherRegister, TeacherLogin, PrivacyPage, TeachersPage, AboutPage, CurriculumPage, AdminAnalytics
- **Suspense fallback** for loading states
- **Reduced motion** CSS media query
- **System fonts** (no external font loading)
- **Preconnect** for Google Fonts (if used)
- **Sitemap** and **robots.txt** for SEO crawling

### Known Issues
- Stockfish WASM (~1.2MB) loads async — not blocking render
- Chessground CSS from CDN — consider self-hosting for performance
- No image optimization pipeline yet — compress PNGs manually

## How to Run Lighthouse
1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Check all categories
4. Click "Analyze page load"

## Bundle Analysis
```bash
cd client && npm run build
# Check dist/ size
ls -la dist/assets/
```
