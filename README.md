# 🧺 4MJ's Laundry Management System

4MJ's Laundry is a **full-stack laundry management system** with **real-time business intelligence** and **automated decision support**. Built for small business operations, it demonstrates how emerging technologies like serverless architecture and predictive analytics can bring enterprise-level capabilities to SME operations.

**Key Innovation:** Real-time data-driven monitoring with an automated alerting system that transforms reactive business management into proactive operations.

---

## ✨ Features

### 👤 Authentication & Roles

* Secure authentication using **Convex Auth**
* Role-based access control (Admin / Staff)
* Server-side authorization for protected actions

### 🧾 Laundry Management

* Create, update, and manage **laundry jobs** for Full Service / Drop Off (Regular Clothes, Assorted Color Clothes, Towels & Blankets, Comforters) and Self-Service (Wash, Spinning, Dry) offerings
* **Searchable customer picker** when creating a laundry job — type a name, email, or phone number to filter and select the customer instead of scrolling a long list
* Laundry lifecycle tracking (Pending, In Progress, Ready, Completed) with separate payment status tracking
* Configurable pricing per service type (admin **Set Price** page, backed by `pricingConfig.ts`)
* Pickup date/time scheduling per laundry job, with same-day/future-date validation
* Unique tracking IDs (e.g. `LND-YYYYMMDD-XXXX`) auto-generated for each laundry job

### 💧 Water Drum / Resource Monitoring

* Tracks estimated water usage per service type against available drum capacity
* Warns staff before creating a service that would exceed remaining water supply
* Drum refill tracking so usage resets after a refill is logged

### 📦 Customer Laundry Tracking

* Public laundry tracking page (`/track`) using a Tracking ID
* Real-time laundry status updates
* No customer login required

### 👥 Customer Management

* Add, search, and manage customer records (name, email, phone, notes)
* Duplicate-protection on email and phone number
* Guards against saving non-routable/placeholder email domains (e.g. `example.com`, `test.com`) so every customer record on file can actually receive email

### 📊 Admin & Staff Dashboard

* Centralized dashboard for daily laundry operations
* View and manage all active and completed laundry jobs, with search, filtering, sorting, and pagination
* Staff-controlled laundry status and payment updates
* Operational visibility for admins and shop owners

### 📈 Analytics & Reporting

* Visual analytics for laundry operations and performance
* Laundry volume, revenue, and turnaround time insights
* Data-driven reporting to support business decisions
* Charts and visualizations powered by **Recharts**
* Time-range filtering (Today, Week, Month, All Time)
* Service type distribution analysis

### 🚨 System Alerts & Notifications

* Automated system alerts based on operational and financial metrics
* Revenue drop detection and performance monitoring
* High unpaid laundry rate alerts
* Overdue laundry job detection
* Slow turnaround time alerts
* No-activity or low-volume warnings
* Severity-based alerts (info, warning, critical)
* Automatic alert resolution when conditions normalize
* Alert expiration and cleanup to prevent stale alerts
* Dismissible alerts with one-click resolution
* Background monitoring via Convex **scheduled cron jobs** (`convex/crons.ts`)

### 📧 Customer & System Emails

* Order-confirmation and "ready for pickup" emails sent to the **customer's own email address** on file (not the shop's inbox), delivered via **Nodemailer (Gmail SMTP)**
* Welcome emails with temporary credentials for newly created staff/admin accounts
* Automatic retry (up to 3 attempts) on transient SMTP failures
* A service is always saved first, then the confirmation email is attempted — so a slow or failed email never blocks or loses a customer's order
* Built-in seed-data cleanup (`seedData.ts`) to remove demo customers/orders (identified by their `@example.com` placeholder emails) before going live

### 📝 Audit Logging & Activity Tracking

* Tracks all critical user actions (creation, updates, deletions)
* Captures performer, target user, timestamp, and optional metadata
* Admins can view all audit logs, filter by action, or limit results
* Provides recent activity logs for the dashboard
* Helps ensure accountability, security, and traceability

---

## 🔬 Emerging Technologies & Innovation

### 🎯 Primary Innovation: Real-Time Business Intelligence & Decision Support System

This project's core emerging technology is a **real-time business intelligence system with automated decision support**, bringing enterprise-level analytics to small business operations. This represents a significant shift from traditional manual record-keeping to intelligent, data-driven management.

#### **Why This Qualifies as Emerging Technology**

**Real-Time Analytics (Not Batch Processing):**
- Traditional systems: End-of-day or end-of-month reports
- Our system: Live dashboard updates, instant metric calculations
- Data refreshes automatically as orders are created/updated

**Predictive Analytics (Not Just Historical):**
- Detects patterns and anomalies automatically
- Anticipates problems before they escalate
- Provides an early warning system for business issues

**Automated Decision Support (Not Manual Analysis):**
- System actively monitors multiple business metrics continuously
- Generates intelligent alerts without human intervention
- Self-resolves when conditions normalize

**Integrated Intelligence (Not Separate Reporting):**
- Analytics embedded directly in operational workflows
- Alerts appear in-context during daily work
- No separate "reporting module" to check manually

#### **Technical Implementation**

**Automated Alert Engine:**
```
Alert Types Implemented:
├── Revenue Drop Detection (>30% decline)
├── Payment Collection Monitoring (>50% unpaid)
├── Turnaround Time Analysis (>48 hours avg)
├── Overdue Order Detection (>72 hours)
├── Activity Monitoring (no orders in 48h)
└── Volume Analysis (<5 orders/week)
```

**Multi-Criteria Evaluation:**
- Combines multiple data points for accurate alerts
- Statistical analysis (percentage changes, thresholds)
- Period-over-period comparisons (today vs yesterday, week vs previous week)

**Smart Alert Lifecycle:**
- **Creation:** Automatic when thresholds are exceeded
- **Classification:** Severity levels (Info, Warning, Critical)
- **Notification:** In-app alerts, resolved automatically as data changes
- **Resolution:** Auto-resolves when conditions improve
- **Expiration:** Prevents stale alerts (24-72 hour TTL)

**Real-Time Dashboard Features:**
- Live KPI tracking (revenue, orders, customers, turnaround time)
- Interactive time-range filtering (Today, Week, Month, All Time)
- Dynamic charts with trend visualization
- Growth metrics with period comparisons
- Top customer analysis
- Service type distribution

#### **Academic Classification**

**Primary Category:** Business Intelligence (BI) & Decision Support Systems (DSS)

**Related Fields:**
- Data Analytics & Visualization
- Predictive Analytics
- Event-Driven Architecture
- Intelligent Monitoring Systems

**Future AI/ML Integration Potential:**
This rule-based system provides the foundation for:
- Machine learning demand forecasting
- Dynamic pricing optimization
- Customer behavior prediction
- Automated resource allocation

#### **Business Impact**

**Proactive vs Reactive Management:**
- **Before:** Owner checks reports weekly, discovers problems after they occur
- **After:** System alerts the owner immediately, preventing issues from escalating

**Democratization of Enterprise Tech:**
- Features previously only in expensive enterprise software
- Accessible to small businesses at minimal cost
- No specialized training required

---

### ☁️ Supporting Technology: Serverless Cloud Architecture

The real-time analytics capabilities are enabled by modern **Backend-as-a-Service (BaaS)** architecture using Convex.

**Key Technical Features:**
- **Real-Time Database:** Instant synchronization across all clients (no polling)
- **Serverless Functions:** Auto-scaling without infrastructure management
- **Type-Safe API:** End-to-end TypeScript from database to UI
- **Scheduled Jobs:** Autonomous background tasks (alert monitoring, cleanup)
- **Event-Driven:** React to data changes automatically

**Why This Matters:**
- Represents a shift from traditional monolithic backends to distributed cloud services
- Enables rapid development without sacrificing scalability
- Zero infrastructure management overhead
- Modern alternative to REST APIs and manual database management

---

### 🔐 Security & Compliance: Comprehensive Audit Logging

**Complete Activity Tracking:**
- Logs all CRUD operations on critical entities
- User attribution (who performed each action)
- Precise timestamps for forensic analysis

**Benefits:**
- Accountability and transparency
- Security monitoring and breach detection
- Regulatory compliance support
- Dispute resolution capabilities

---

## 🛠 Tech Stack

### Frontend

* **Next.js 16 (App Router, Turbopack)** - Modern React framework with server components
* **React 19** - Latest React features and concurrent rendering
* **TypeScript** - Type safety and enhanced developer experience
* **Tailwind CSS 4** - Utility-first CSS framework
* **shadcn/ui** - High-quality, accessible UI components
* **Recharts** - Powerful charting library for data visualization
* **lucide-react** - Modern icon library
* **Convex React Client** - Real-time data hooks and mutations

### Backend

* **Convex** - Backend-as-a-Service with real-time database
* **Convex Auth** - Secure authentication and session management
* **Scheduled Jobs (Cron)** - Automated background tasks for alerts and monitoring
* **Type-safe API** - Full TypeScript coverage from database to UI

### Email Service

* **Nodemailer** - Email sending library
* **Gmail SMTP** - Email delivery, with automatic retry on transient failures
* **HTML Email Templates** - Professional notification formatting for order confirmation, ready-for-pickup, and welcome emails

### Development Tools

* **ESLint** - Code quality and consistency
* **Prettier** - Code formatting
* **Git** - Version control

### Deployment

* **Vercel** - Frontend hosting with edge network
* **Convex Cloud** - Backend services and database
* **GitHub** - Source code repository

---

## 📁 Project Structure

```
4MJ-s-Laundryshop/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin-only pages
│   │   ├── manage-laundry/       # Create/view/update laundry jobs
│   │   ├── manage-customers/     # Customer records
│   │   ├── manage-users/         # Staff/admin accounts
│   │   ├── set-price/            # Service pricing configuration
│   │   ├── analytics-report/     # Business intelligence dashboard
│   │   └── audit-log/            # Activity/audit trail
│   ├── staff/                    # Staff pages (subset of admin features)
│   ├── api/                      # Email API routes (order/ready/test emails)
│   ├── track/                    # Public tracking page (no login required)
│   ├── signin/                   # Sign-in page
│   ├── dashboard/                # Post-login role redirect
│   └── layout.tsx                # Root layout
├── components/                   # Reusable UI components
│   ├── ui/                       # shadcn/ui components
│   ├── Adminsidebar.tsx          # Admin navigation
│   ├── Staffsidebar.tsx          # Staff navigation
│   └── ConvexClientProvider.tsx  # Convex client/auth provider
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema
│   ├── analytics.ts              # Analytics queries
│   ├── alertSystem.ts            # Alert engine
│   ├── auditLogs.ts              # Audit logging
│   ├── laundryOrders.ts          # Order mutations
│   ├── laundryOrdersQueries.ts   # Order queries
│   ├── customers.ts              # Customer operations
│   ├── users.ts                  # User management
│   ├── pricingConfig.ts          # Service pricing
│   ├── waterTank.ts              # Water drum/resource tracking
│   ├── crons.ts                  # Scheduled background jobs
│   └── seedData.ts               # Demo data generator + cleanup
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities (email.ts, utils.ts)
├── public/                       # Static assets
├── .env.local                    # Environment variables (not committed)
├── .env.example                  # Environment template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites

* **Node.js** 18.x or higher
* **npm**
* **Git**
* **Convex Account** (free tier available)
* **Gmail Account** (for email notifications)

### 1️⃣ Clone the repository

```bash
git clone https://github.com/jzsaysayen/4mjslaundry.git
cd 4mjslaundry
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Set up Convex

```bash
# Login to Convex (creates account if needed) and start the backend
npx convex dev

# This will:
# - Create a new Convex project (or link an existing one)
# - Generate/sync the schema
# - Start the local development backend
```

### 4️⃣ Environment variables

Create a `.env.local` file based on `.env.example`:

```env
# DB — used in Production/Preview deploys of your Convex project
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
SETUP_SCRIPT_RAN=

# Gmail SMTP settings for sending emails
GMAIL_USER=yourgmail@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# Public app URL (used to build links inside emails, e.g. the tracking link)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 📧 Setting up Gmail SMTP

1. Go to Google Account Settings
2. Enable 2-Step Verification
3. Generate an **App Password**:
   - Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password
4. Use this App Password in `GMAIL_APP_PASSWORD` (not your regular Gmail password)

> ⚠️ **Security:** Never commit `.env.local` to version control

### 5️⃣ Run the development server

```bash
# Terminal 1: Start Convex backend
npx convex dev

# Terminal 2: Start Next.js frontend
npm run dev
```

Access the app at:
```
http://localhost:3000
```

### 6️⃣ Create your first admin user

1. Visit `http://localhost:3000/signin` and create an account
2. In the Convex Dashboard, manually set that user's `role` field to `"admin"`
3. Log out and log back in

### 7️⃣ (Optional) Load demo data

```bash
npx convex run seedData:seedHistoricalOrders
```

Demo customers are created with `@example.com` placeholder emails, which **cannot receive real mail** — this is intentional so demo orders can't accidentally spam a real inbox. Before going live, remove them:

```bash
npx convex run seedData:clearPreviousSeedData
```

---

## 🌐 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Set Environment Variables**
   ```
   CONVEX_DEPLOYMENT=your-convex-deployment-id
   NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
   GMAIL_USER=yourgmail@gmail.com
   GMAIL_APP_PASSWORD=your-app-password
   NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
   ```

4. **Deploy Convex to Production**
   ```bash
   npx convex deploy
   ```

5. **Update Convex Deployment ID**
   - Copy the production deployment ID from the Convex dashboard
   - Update `CONVEX_DEPLOYMENT` / `NEXT_PUBLIC_CONVEX_URL` in Vercel's environment variables
   - Redeploy in Vercel

### Post-Deployment Checklist

- [ ] Test authentication flow
- [ ] Verify order-confirmation and ready-for-pickup emails actually reach a real customer inbox
- [ ] Run `seedData:clearPreviousSeedData` to remove demo customers/orders before real use
- [ ] Check analytics dashboard loads
- [ ] Test alert system triggers
- [ ] Confirm role-based access works
- [ ] Test the public customer tracking page
- [ ] Monitor Convex logs for errors

---

## 🔐 Security Considerations

### Authentication & Authorization
- ✅ Passwords hashed using industry-standard algorithms (handled by Convex Auth)
- ✅ Session management with secure tokens
- ✅ Role-based access control (RBAC) enforced server-side
- ✅ Protected API endpoints with auth checks
- ✅ No sensitive data exposed to unauthorized users

### Data Protection
- ✅ Environment variables for secrets (never committed)
- ✅ Gmail App Passwords (not regular passwords)
- ✅ HTTPS encryption in production (via Vercel)
- ✅ Input validation on all forms
- ✅ Server-side rejection of placeholder/non-routable customer email domains
- ✅ SQL injection prevention (Convex handles this)

### Email Security
- ✅ SMTP over TLS
- ✅ App-specific passwords
- ✅ Automatic retry with backoff on transient send failures
- ✅ Emails always go to the customer's own address, never a shared/admin inbox

### Audit & Compliance
- ✅ Complete activity logging
- ✅ User action attribution
- ✅ Timestamp tracking for all operations

---

## 📊 Analytics & Metrics

### Key Performance Indicators (KPIs)

The dashboard tracks these critical business metrics:

1. **Revenue Metrics**
   - Total revenue by period
   - Revenue growth rate (%)
   - Revenue trend over time
   - Revenue by service type

2. **Operational Metrics**
   - Total orders processed
   - Order volume growth (%)
   - Orders by status (pending, in-progress, ready, completed)
   - Average turnaround time (hours)
   - Turnaround time trends

3. **Customer Metrics**
   - Total unique customers
   - Customer growth rate (%)
   - Top customers by revenue
   - Customer order frequency

4. **Financial Metrics**
   - Payment collection rate (%)
   - Unpaid order count
   - Revenue per order
   - Service type distribution

5. **Resource Metrics**
   - Water usage vs. drum capacity
   - Remaining drums since last refill

### Alert Thresholds

The system monitors these conditions:

| Alert Type | Trigger Condition | Severity |
|------------|------------------|----------|
| Revenue Drop | >30% decrease vs previous period | Critical |
| High Unpaid Rate | >50% unpaid orders | Warning |
| Slow Turnaround | >48 hours average | Warning |
| Overdue Orders | Orders >72 hours old | Warning |
| No Activity | No orders in 48 hours | Info |
| Low Volume | <5 orders per week | Info |

---

## 📈 Future Enhancements

### Potential Improvements
- SMS/Push notifications for instant alerts
- Customer portal with self-service tracking and order history
- Inventory management for supplies
- Employee scheduling system
- Multi-location support
- Mobile app (React Native)

### Advanced Features (AI/ML Integration)
- Machine learning demand forecasting
- Dynamic pricing optimization
- Customer behavior prediction
- Automated resource allocation
- Natural language search and voice commands

---

## 📧 Contact & Support

**GitHub:** [https://github.com/jzsaysayen/4mjslaundry](https://github.com/jzsaysayen/4mjslaundry)

For questions or issues:
- Check existing GitHub Issues
- Create a new Issue with a detailed description
- For security concerns, email directly (do not post publicly)

---

## 📄 License

For **educational and demonstration purposes only**.

---

## 📌 Project Status

**Status:** ✅ Active development
**Last Updated:** August 2026

---

**Built for Capstone Project**
