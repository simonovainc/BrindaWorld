# BrindaWorld — School Board Demo Checklist

## Pre-Demo Setup
- [ ] Run migration 017 (teacher portal tables)
- [ ] Run migration 018 (competition enhancements)
- [ ] Seed demo competition
- [ ] Set JWT_SECRET in .env
- [ ] Set ADMIN_KEY in .env
- [ ] Deploy to production

## Demo Flow
1. **Homepage** (https://brindaworld.ca)
   - [ ] Hero loads with categories
   - [ ] She Can Be section shows 12 professions
   - [ ] Teachers link in footer works

2. **Demo Mode** (https://brindaworld.ca?demo=true)
   - [ ] Purple demo banner appears at top
   - [ ] Dashboard shows sample data (3 children, activity stats)
   - [ ] Exit Demo button returns to normal

3. **Teacher Portal** (https://brindaworld.ca/teacher/register)
   - [ ] Teacher can register
   - [ ] Teacher can create a class
   - [ ] Join code is generated (6 characters)
   - [ ] Student progress table shows enrolled students
   - [ ] Print Report opens clean printable document

4. **Parent Dashboard** (https://brindaworld.ca/dashboard)
   - [ ] Join Class card visible
   - [ ] Enter join code + select child → success message
   - [ ] KPI stats load (sessions, minutes, games)

5. **Curriculum** (https://brindaworld.ca/curriculum)
   - [ ] All 6 subjects displayed with grade bands
   - [ ] Print button opens clean PDF-ready view

6. **Privacy** (https://brindaworld.ca/privacy)
   - [ ] COPPA and PIPEDA sections visible

7. **About** (https://brindaworld.ca/about-us)
   - [ ] Mission statement, stats, She Can Be vision

8. **Technical**
   - [ ] Health check: GET /api/health returns 200
   - [ ] No console errors on any page
   - [ ] Mobile responsive (test at 375px width)
   - [ ] French toggle works (if available)
