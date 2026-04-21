# Expanded Product Requirements Document
## Digital Heroes — Golf Performance, Prize Draws & Charity Platform
### Version 2.0 | Human-Centric Edition | April 2026

---

## 1. Project Vision (Why We’re Building This)

We believe golf should feel less like a traditional, stiff country-club experience and more like something people genuinely *want* to engage with every month. This platform brings together three things golfers care about:

- **Their game** — tracking progress and seeing how they stack up
- **Their community** — competing in fair, transparent monthly draws
- **Their impact** — effortlessly supporting causes they believe in

> **Design Philosophy:** Emotionally engaging, modern, and deliberately avoiding the dated aesthetics typical of golf websites. Every screen should feel alive, rewarding, and intuitive.

---

## 2. The People Who Use This

### 2.1 Public Visitor (Not Yet Signed Up)
*A curious golfer who heard about the platform and wants to peek inside before committing.*

**What they need:**
- Browse the public leaderboard and see real player scores without signing up
- Understand what the platform offers, how prize draws work, and which charities are supported
- A frictionless, trustworthy signup flow that gets them excited to subscribe

**What they feel:**
- Curious but cautious — they want proof the platform is legitimate and active
- Motivated by seeing real names, real scores, and real winners

---

### 2.2 Registered Subscriber (The Core User)
*A paying member who logs in regularly to enter scores, check draw status, and manage their profile.*

**What they need:**
- A quick, almost effortless way to enter their latest Stableford golf scores
- Clear visibility into their subscription status, next billing date, and payment history
- Transparency into how much they’ve donated to charity and which draws they’ve entered
- Notifications when results are published or when their subscription needs attention

**What they feel:**
- Proud when they see their name climb the leaderboard
- Excited during draw week — anticipation should be palpable in the UI
- Good about their charity contributions — this should never feel hidden

---

### 2.3 Administrator (Platform Operator)
*The internal team managing users, verifying wins, and ensuring the platform runs smoothly.*

**What they need:**
- Complete visibility into every user, subscription, score, draw, and payout
- Tools to run draws (random or algorithmic), simulate outcomes, and publish results
- Ability to manage charities: add new ones, verify NGO credentials, monitor donations
- Fraud detection signals and the ability to manually verify suspicious wins before payout
- System logs and analytics to understand platform health and growth

**What they feel:**
- In control — everything should be one or two clicks away
- Confident — the system should catch edge cases and flag anomalies automatically

---

## 3. Feature Requirements (The Detailed Breakdown)

### 3.1 Authentication & Onboarding

**User Story:**
> As a new visitor, I want to create an account in under 60 seconds so I can start subscribing without frustration.

**Flow:**
1. Visitor clicks "Join" from the public leaderboard or landing page
2. Account creation form: full name, email, password, handicap index, and preferred charity
3. Email verification (secure but not annoying — magic link preferred)
4. Immediate redirect to subscription selection after verification

**Acceptance Criteria:**
- [ ] Passwords must be hashed with bcrypt or Argon2 (never plain text, never weak hashing)
- [ ] Email uniqueness enforced at database level with friendly error messaging
- [ ] Handicap index validated (numeric, range -10 to 54)
- [ ] Preferred charity selected from a verified directory (see Section 3.5)
- [ ] Session tokens rotate securely; JWTs expire reasonably
- [ ] Social login (Google) is a nice-to-have but not mandatory for MVP

---

### 3.2 Subscription & Payment Engine

**User Story:**
> As a golfer, I want to choose between monthly flexibility and yearly savings, knowing exactly what I’m paying, when I’ll be billed, and how to cancel without jumping through hoops.

**Plans:**

| Plan | Billing | Suggested Price Point | What the User Gets |
|------|---------|----------------------|-------------------|
| Monthly | Every 30 days | £9.99 / $12.99 | Full platform access, score entry, draw eligibility, charity contribution |
| Yearly | Once per year | £99 / $129 (roughly 17% discount) | Same as monthly, plus visible "Pro Member" badge on leaderboard |

**Payment Flow:**
1. User selects plan
2. Stripe-hosted checkout or embedded form (PCI compliance is non-negotiable)
3. Immediate access granted on successful payment
4. Confirmation email with receipt, billing date, and cancellation link

**Subscription Lifecycle:**
- **Active:** Full access to all features
- **Renewal:** Graceful retry logic for failed payments (3 attempts over 7 days with email reminders)
- **Lapsed:** User can still view historical data but cannot enter new scores or participate in draws
- **Cancelled:** Access continues until end of paid period; no prorated refunds for simplicity

**Technical Guardrails:**
- [ ] Every authenticated API call checks subscription status in real time
- [ ] Webhook handling for Stripe events: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
- [ ] Idempotency keys on all payment operations to prevent double-charging
- [ ] Subscription status cached in Redis but invalidated immediately on webhook receipt

---

### 3.3 Score Entry & Leaderboard Experience

**User Story:**
> As a subscriber, I want to enter my latest round in Stableford format quickly — ideally while I’m still at the 19th hole — and see instantly how it affects my ranking.

**Understanding Stableford (For Developers):**
Stableford is a points-based scoring system where higher is better. A player’s score on each hole is compared against the hole’s par and their handicap to award points:

| Result vs. Par (after handicap) | Points |
|--------------------------------|--------|
| 2 or more over fixed score | 0 |
| 1 over fixed score | 1 |
| Fixed score (net par) | 2 |
| 1 under fixed score (net birdie) | 3 |
| 2 under fixed score (net eagle) | 4 |
| 3 under fixed score (net albatross) | 5 |

*The platform does NOT need to calculate Stableford points — users enter their final Stableford total directly. However, the system should validate that the entered score is within reasonable bounds (0 to 72 points for an 18-hole round).*

**Score Entry Flow:**
1. User clicks "Enter Score" from dashboard
2. Inputs: Course name (autocomplete from database), Date played, Stableford points total
3. Optional: Hole-by-hole breakdown (nice-to-have for future analytics)
4. Submission creates a pending entry; user sees confirmation toast
5. Score appears on personal scorecard immediately; leaderboard updates within 5 minutes

**Leaderboard Rules:**
- Ranked by highest single Stableford score in the current calendar month
- Tie-breaker: earliest submission date
- Public leaderboard shows top 50; personal rank always visible to logged-in user
- Historical leaderboards archived by month

**Acceptance Criteria:**
- [ ] Score entry restricted to subscribers with active status
- [ ] Users can edit or delete their own score within 24 hours of entry
- [ ] Admins can edit any score with an audit log entry
- [ ] Leaderboard cached in Redis, refreshed every 5 minutes or on new score entry
- [ ] Responsive table design: horizontal scroll on mobile, full grid on desktop

---

### 3.4 Prize Draw Engine (The Heart of the Platform)

**User Story:**
> As a subscriber, I want the monthly draw to feel fair, exciting, and transparent. I should understand exactly how winners are picked and what the prize pool is worth.

**How the Prize Pool Works:**
A fixed percentage of every subscription payment feeds into the monthly prize pool. The pool is then distributed across three tiers:

| Tier | Match Requirement | Pool Share | Judged / Verified? | Behavior if Unclaimed |
|------|------------------|------------|-------------------|----------------------|
| Tier 1: Jackpot | 5-Member Match | 40% | Yes — requires admin verification | Carries forward to next month’s pool |
| Tier 2: Major Match | 4-Member Match | 35% | No — automatic | Distributed automatically |
| Tier 3: Minor Match | 3-Member Match | 20% | No — automatic | Distributed automatically |

*The remaining 5% covers platform operational costs or emergency reserve.*

**Draw Mechanics:**
- **Draw Date:** Last Friday of every month at 8:00 PM local time
- **Eligibility:** Only subscribers with at least one score entry in that calendar month
- **Match Definition:** A "match" is determined by the draw engine — it could be matching digits from a randomized draw against user IDs, handicap indexes, or score patterns. *For the MVP, implement a transparent random number draw where user scores or IDs are matched against drawn numbers.*

**Example Draw Algorithm (Transparent & Auditable):**
1. System generates a cryptographically secure random seed at draw time
2. Seed is hashed and published publicly before number generation
3. Random numbers are drawn within defined ranges
4. Matching logic runs against eligible user data
5. Results published with the seed and hash so anyone can verify fairness

**Winner Experience:**
- Winners receive an in-app notification and email within 10 minutes of draw completion
- Tier 1 (Jackpot) winners enter a 48-hour verification hold where admin confirms no fraud signals
- After verification (or immediately for Tier 2/3), winners see a "Claim Prize" button
- Prize distributed via bank transfer or Stripe Connect within 5 business days

**Admin Draw Tools:**
- [ ] "Run Draw" button (single-click, irreversible, with confirmation modal)
- [ ] "Simulate Draw" button (run 1000 simulations to test distribution fairness; no persistence)
- [ ] Manual override to re-roll a specific tier in case of technical failure (logged extensively)
- [ ] Historical draw archive with full audit trail

---

### 3.5 Charity Integration

**User Story:**
> As a subscriber, I want to support a charity effortlessly. My contribution should feel meaningful, and I want to see the cumulative impact I’ve made over time.

**Contribution Model:**
- Minimum 10% of subscription fee (user can increase up to 50%)
- Selected at signup; changeable anytime from account settings
- Charity receives aggregated monthly payouts from the platform

**Charity Directory:**
- Admins add charities with: name, registration number, logo, description, website
- Each charity shows: total subscribers supporting it, total donations raised, last payout date
- Charities can be "featured" or "verified" (verified means admin has checked NGO registration)

**Subscriber Charity Experience:**
- Dashboard widget: "You’ve donated £24.50 to St. Andrews Junior Golf Foundation"
- Annual charity impact report available for download (nice-to-have)
- Ability to switch charity once per billing cycle

**Acceptance Criteria:**
- [ ] Donation amount calculated at payment time and recorded separately from prize pool allocation
- [ ] Charity allocation report generated monthly for admin payout processing
- [ ] Users cannot select a charity that has been deactivated by admin

---

### 3.6 Admin Dashboard

**User Story:**
> As an admin, I need to feel like I have complete situational awareness. Nothing should be hidden, and common actions should require minimal clicks.

**Dashboard Sections:**

#### Overview (Home)
- Active subscribers count (with trend vs. last month)
- Current month prize pool total
- Pending verifications (Tier 1 winners awaiting approval)
- Recent system alerts (failed payments, disputes, anomalies)

#### User Management
- Searchable, filterable user table (name, email, subscription status, join date)
- Click into user profile to: edit details, view score history, cancel subscription, impersonate login (with audit log)
- Bulk export to CSV

#### Score Oversight
- View all scores entered this month
- Flag suspicious patterns (e.g., same user entering 3 rounds in one day with wildly different courses)
- Edit or delete any score with mandatory reason field

#### Draw Control
- Configure next draw date and time
- View current pool breakdown by tier
- Run or simulate draws (see Section 3.4)
- Publish results manually if automatic publication fails

#### Charity Management
- Add / edit / deactivate charities
- View donation breakdown per charity
- Mark charity payouts as completed

#### Winner Verification
- Queue of Tier 1 winners pending verification
- Quick approve / reject / request-more-info actions
- Payout status tracking: pending → processing → completed

#### Reports & Analytics
- Monthly revenue chart
- Subscriber churn rate
- Average donation per user
- Leaderboard engagement (how many users entered scores this month)
- Exportable PDF reports

**Security:**
- [ ] Admin panel accessible only via `/admin` route with role-based access control
- [ ] All admin actions logged with admin ID, timestamp, and before/after values
- [ ] Sensitive operations (draw execution, payout approval) require re-authentication

---

## 4. Technical Architecture

### 4.1 Stack Recommendations
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18+ with Vite | Modern, fast, large community |
| Styling | Tailwind CSS | Rapid, consistent, responsive design |
| Backend | Node.js + Express OR Python + FastAPI | Team preference; both scale well |
| Database | PostgreSQL | ACID compliance, JSON support, reliable |
| ORM | Prisma (Node) or SQLAlchemy (Python) | Type safety, migration support |
| Cache | Redis | Session store, leaderboard cache, rate limiting |
| Payments | Stripe | Industry standard, excellent webhooks |
| Auth | Custom JWT + bcrypt | Full control; OAuth as add-on |
| Deployment | Render / Railway / Fly.io | Simple, modern, affordable for MVPs |

### 4.2 Database Schema (Core Tables)

```
users (id, email, password_hash, full_name, handicap, role, created_at)
subscriptions (id, user_id, plan_type, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, created_at)
scores (id, user_id, course_name, stableford_points, played_date, entered_at, is_deleted)
charities (id, name, registration_number, description, logo_url, is_verified, is_active, total_donations_received)
user_charity_preferences (id, user_id, charity_id, contribution_percentage)
draws (id, draw_date, total_pool, tier_1_pool, tier_2_pool, tier_3_pool, random_seed, status, created_at)
draw_results (id, draw_id, user_id, tier, matched_on, prize_amount, verification_status, payout_status, created_at)
admin_audit_logs (id, admin_id, action, entity_type, entity_id, before_value, after_value, reason, created_at)
```

### 4.3 Scalability & Future-Proofing
- [ ] Database indexing on `scores.user_id`, `scores.entered_at`, `subscriptions.status`, `draw_results.draw_id`
- [ ] API rate limiting: 100 requests/minute per IP, 1000 per authenticated user
- [ ] Static assets served via CDN
- [ ] Architecture supports future mobile app via REST or GraphQL API
- [ ] Multi-country expansion: store currency per user, support tax calculation hooks

---

## 5. Design & UX Requirements

### 5.1 Visual Identity
- **Primary palette:** Deep forest green, warm gold, clean white (sophisticated but not stuffy)
- **Typography:** Modern sans-serif (Inter or Geist); no serif fonts that feel old-fashioned
- **Imagery:** Real golfers of diverse ages and backgrounds; avoid stock-photo stiffness
- **Animations:** Subtle page transitions, leaderboard rank changes animate smoothly, draw countdown timer creates tension

### 5.2 Responsive Breakpoints
- Mobile: 320px – 767px (stacked layouts, thumb-friendly buttons)
- Tablet: 768px – 1023px (side-by-side where appropriate)
- Desktop: 1024px+ (full dashboard layouts, data-rich tables)

### 5.3 Accessibility (Non-Negotiable)
- WCAG 2.1 AA compliance minimum
- Keyboard-navigable throughout
- Screen reader friendly (aria-labels on all interactive elements)
- Color contrast ratios verified
- Reduced-motion support for animations

---

## 6. Quality Assurance & Edge Cases

### 6.1 Edge Cases to Handle
- **User cancels mid-month:** Access continues until period end; no partial refund
- **Payment fails 3 times:** Subscription lapses; user gets friendly reactivation flow with preserved data
- **No eligible users for a tier:** Pool rolls forward (Tier 1) or redistributes to other tiers (Tier 2/3)
- **Draw runs on a holiday:** Fully automated; admin can reschedule if needed
- **Same user wins multiple tiers:** Allowed, but capped at one prize per tier per draw
- **Score entry after month ends:** Counts toward next month’s leaderboard and draw eligibility

### 6.2 Error Handling
- All API errors return user-friendly messages (no raw stack traces)
- Network failures: retry with exponential backoff; offline mode for score draft saving (nice-to-have)
- Payment failures: clear next steps, never blame the user

---

## 7. Deliverables Checklist

| # | Deliverable | Definition of Done |
|---|-------------|-------------------|
| 1 | **Live Website** | Publicly accessible URL with SSL certificate |
| 2 | **User Panel** | Signup, login, subscription, score entry, leaderboard viewing, charity selection, draw results viewing |
| 3 | **Admin Panel** | All sections in Section 3.6 functional with real data |
| 4 | **Database** | PostgreSQL with encrypted connections, migrations applied, seed data for demo |
| 5 | **Source Code** | Clean folder structure, meaningful variable names, commented complex logic, README with setup steps |
| 6 | **Deployment** | Hosted on Render (new account), environment variables documented, CI/CD if possible |
| 7 | **Test Credentials** | At least one test user and one test admin provided for evaluation |

---

## 8. Evaluation Rubric (How Success Is Measured)

| Criteria | Weight | What Good Looks Like |
|----------|--------|---------------------|
| Feature Completeness | 30% | All core flows work end-to-end without manual workarounds |
| Code Quality | 25% | Readable, well-structured, secure, no obvious vulnerabilities |
| UI/UX Polish | 20% | Looks modern, feels responsive, error states handled gracefully |
| Database Design | 15% | Proper relationships, indexing, no N+1 queries |
| Deployment & Documentation | 10% | Live URL works, README is clear, env vars configured properly |

---

## 9. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | March 2026 | Digital Heroes | Original PRD issued |
| 2.0 | April 2026 | Expanded | Added user stories, acceptance criteria, draw algorithm, edge cases, evaluation rubric, human-centric language |

---

*This document is a living specification. As questions arise during development, answers should be recorded here so the entire team shares one source of truth.*
