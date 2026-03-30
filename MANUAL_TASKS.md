# BrindaWorld — Manual Tasks for VN

These tasks require manual action (phpMyAdmin, Stripe dashboard, etc).

## Database Migrations (phpMyAdmin)

### Migration 017 — Teacher Portal
File: `phase2/logs/migration_017_TODO.sql`
Creates: teachers, teacher_classes, class_enrollments, teacher_notes, teacher_assignments

### Migration 018 — Competition Enhancements
File: `phase2/logs/migration_018_TODO.sql`
Creates: competition_scores, adds columns to competitions table

### Seed Data — Demo Competition
File: `phase2/logs/seed_competition.sql`
Seeds one "Spring Chess Championship" competition for demo purposes.

## Environment Variables

Add to server `.env`:
```
JWT_SECRET=<generate a strong random string>
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=hello@brindaworld.ca
SMTP_PASS=<email password>
SMTP_FROM=BrindaWorld <hello@brindaworld.ca>
ADMIN_KEY=<generate a strong random string>
```

## Stripe Dashboard

1. Verify webhook endpoint: `https://brindaworld.ca/api/stripe/webhook`
2. Ensure webhook listens for events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
3. Verify price IDs in `.env` match Stripe dashboard:
   - `STRIPE_FAMILY_MONTHLY_PRICE_ID=price_xxx`
   - `STRIPE_FAMILY_ANNUAL_PRICE_ID=price_xxx`

## Deployment

1. Push to `platform` branch
2. SSH into Hostinger VPS
3. `cd /home/u171187877/domains/brindaworld.ca/public_html`
4. `git pull origin platform`
5. `npm install`
6. `npm run build`
7. Restart Node.js app in Hostinger panel

## Mobile App

1. Replace placeholder images in `mobile/assets/`:
   - `icon.png` (1024x1024)
   - `splash.png` (1284x2778)
   - `adaptive-icon.png` (1024x1024)
2. Install Expo CLI: `npm install -g eas-cli`
3. Login: `eas login`
4. Build: `cd mobile && eas build --platform all`
5. Submit: `eas submit`

## Post-Deployment Checks

- [ ] Visit https://brindaworld.ca — homepage loads
- [ ] Register a new parent account
- [ ] Add a child profile
- [ ] Teacher register + create class + share join code
- [ ] Parent joins child to class
- [ ] Demo mode: https://brindaworld.ca?demo=true
- [ ] Admin analytics: https://brindaworld.ca/admin/analytics?key=YOUR_KEY
- [ ] Privacy page: https://brindaworld.ca/privacy
- [ ] Curriculum page: https://brindaworld.ca/curriculum
