# Frontend Implementation Plan — LogiSys

This document defines every step required to build the Next.js + Tailwind CSS + shadcn/ui frontend for the Simple Logistic System, grounded in the real database schema from `db/database.sql`.

---

## 1. Foundation Setup

### 1.1 Initialize the Next.js app shell

The project already has `next@16`, `react@19`, `tailwindcss@4`, and TypeScript installed. What remains:

```bash
# Install shadcn/ui (detects Next.js, Tailwind, TS automatically)
npx shadcn@latest init

# Install the baseline component set we'll need
npx shadcn@latest add button card badge input label select separator \
  table tabs dialog sheet avatar dropdown-menu command tooltip \
  progress skeleton sonner sidebar breadcrumb

# Additional deps
npm install lucide-react
```

### 1.2 File structure

```
front/
├── app/
│   ├── globals.css          # Tailwind imports + CSS variables
│   ├── layout.tsx           # Root: html lang="pt-BR", font loading, ThemeProvider
│   ├── page.tsx             # Redirect to /dashboard
│   ├── login/
│   │   └── page.tsx
│   └── (dashboard)/
│       ├── layout.tsx       # SidebarProvider + AppSidebar + SidebarInset
│       ├── dashboard/page.tsx
│       ├── orders/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/page.tsx
│       ├── fleet/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── deposits/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── products/page.tsx
│       ├── stock/page.tsx
│       ├── employees/page.tsx
│       ├── suppliers/page.tsx
│       └── reports/page.tsx
├── components/
│   ├── ui/                  # shadcn/ui primitives (auto-generated)
│   ├── app-sidebar.tsx      # Sidebar built on shadcn Sidebar primitive
│   ├── nav-main.tsx         # Sidebar navigation items
│   ├── nav-user.tsx         # User avatar + menu at sidebar bottom
│   ├── page-header.tsx      # Breadcrumbs + title + actions slot
│   ├── stat-card.tsx        # KPI card (reuses shadcn Card)
│   ├── data-table.tsx       # Generic responsive table wrapper
│   └── empty-state.tsx      # No-data placeholder
├── lib/
│   ├── utils.ts             # cn() helper (created by shadcn init)
│   └── mock-data.ts         # Seed data matching DB schema
├── types/
│   └── index.ts             # TypeScript interfaces for every DB table
└── hooks/
    └── use-mobile.tsx        # Responsive breakpoint hook (shadcn Sidebar uses it)
```

### 1.3 Theming

Define CSS variables inside `globals.css` using shadcn's theme convention:

- Use **HSL format** for all color tokens (shadcn requirement).
- Define both `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, and the sidebar-specific tokens.
- Pick a **dark** base theme. The palette should feel like **warm industrial** — deep slate backgrounds with amber/gold primary accent. Not generic purple-on-white.
- Use `@font-face` or Google Fonts link for a distinctive serif display font (e.g. DM Serif Display) paired with a clean sans-serif body font (e.g. DM Sans).

---

## 2. TypeScript Data Layer

### 2.1 Types (`types/index.ts`)

Create one interface per DB table, with field names matching SQL exactly. Every `INTEGER CHECK IN (0,1)` maps to `boolean` in TS. Every `TEXT` PK/FK maps to `string`. The `role` and `status` fields become union literal types.

**Tables to type (20 total):**

| Interface | Source table | Key fields |
|-----------|-------------|------------|
| `Deposit` | `deposit` | id, location (JSON string), size (JSON string), volume_actual, volume_max, has_refrigeration |
| `Truck` | `truck` | id, model, volume_actual/max, weight_actual/max, is_delivering, is_valid, is_traveling, current/origin/destination/home deposit IDs, has_refrigeration, speed, fuel_capacity/current/consumption, wear_percentage/rate |
| `Product` | `product` | id, name, is_cold, is_fragile, expire_date, price, size, volume, weight |
| `User` | `users` | id, name, work_position, address, role: `"admin" \| "worker" \| "client"` |
| `Session` | `session` | session_id, user_id, login_time, expires_at, is_active |
| `Order` | `orders` | id, final_destination (JSON), sender/receiver/client IDs, time_limit, price, status: `"Pending" \| "Shipped" \| "Delivered" \| "Cancelled"`, supplier_id, supplier_delivery |
| `OrderItem` | `order_items` | order_id, product_id, quantity |
| `Stock` | `stock` | id, product_id, quantity, deposit_id, truck_id, order_id, arrived_at |
| `StockHistory` | `stock_history` | id, stock_id, quantity, deposit/truck/order IDs, moved_by, moved_at |
| `OrderRoute` | `order_route` | order_id, step, deposit_id, truck_id, estimated_time, arrived_at |
| `Supplier` | `supplier` | id, name, address, latitude, longitude |
| `SupplyRoute` | `supply_route` | order_id, supplier_id, truck_id, estimated_departure/arrival, actual_arrival |
| `FuelStation` | `fuel_station` | id, name, location, latitude, longitude, is_partner |
| `FuelPrice` | `fuel_price` | station_id, price_per_liter, recorded_at |
| `RefuelLog` | `refuel_log` | id, truck_id, station_id, liters, price_per_liter, refueled_at |
| `Employee` | `employee` | id, user_id (unique), is_able, deposit_id, max_work_hours_per_day, hourly_cost |
| `TruckDriver` | `truck_driver` | truck_id, employee_id, assigned_at |
| `WorkLog` | `work_log` | id, employee_id, truck_id, start_time, end_time |
| `FreightCost` | `freight_cost` | order_id, fuel/labor/maintenance/total cost, calculated_at |
| `TruckPerformance` | `truck_performance_history` | id, truck_id, total_distance, fuel_consumed, orders_completed, maintenance_count, wear_percentage, recorded_at |
| `TruckMaintenance` | `truck_maintenance` | id, truck_id, type, description, cost, wear_before/after, performed_at |

Also define a `DashboardStats` aggregate type for the dashboard KPIs.

### 2.2 Mock data (`lib/mock-data.ts`)

Create realistic seed data for each type. Include helper functions:

- `getById(collection, id)` — generic lookup.
- `getOrderItems(orderId)`, `getOrderRoute(orderId)` — filtered lookups.
- `getStockByDeposit(depositId)`, `getStockByTruck(truckId)`.
- `getDashboardStats()` — compute KPIs from mock data.
- `getDepositLabel(deposit)` — parse JSON location string.

This layer will be replaced with `fetch()` calls once the backend exposes a REST API.

---

## 3. Layout Shell

### 3.1 Root layout (`app/layout.tsx`)

- `<html lang="pt-BR">` — content is Portuguese.
- Load fonts via Google Fonts `<link>` or `next/font`.
- Wrap in a `ThemeProvider` (or just set `class="dark"` on `<html>` if only dark mode).
- Include `<Toaster />` from `sonner` for notifications.

### 3.2 Dashboard layout (`app/(dashboard)/layout.tsx`)

Use the **shadcn Sidebar** primitive. This gives us:

```tsx
<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    {children}
  </SidebarInset>
</SidebarProvider>
```

`SidebarInset` handles the content offset automatically — no manual `ml-*` or `pl-*`. The sidebar collapses to icon-only on `SidebarTrigger` click and hides off-canvas on mobile.

### 3.3 `AppSidebar` component

Built using `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton` from shadcn.

Navigation items:

| Label | Route | Icon |
|-------|-------|------|
| Dashboard | `/dashboard` | `LayoutDashboard` |
| Orders | `/orders` | `Package` |
| Fleet | `/fleet` | `Truck` |
| Deposits | `/deposits` | `Warehouse` |
| Products | `/products` | `Box` |
| Stock | `/stock` | `Boxes` |
| Employees | `/employees` | `Users` |
| Suppliers | `/suppliers` | `Factory` |
| Reports | `/reports` | `BarChart3` |

Footer: user avatar + name + role, with a `DropdownMenu` for Settings / Sign out.

### 3.4 Page header component

Reusable `<PageHeader>` with:
- **Breadcrumbs** (using shadcn `Breadcrumb`) with `SidebarTrigger` on the left.
- **Title** (serif display font).
- **Subtitle** (optional muted text).
- **Actions slot** (right-aligned, for primary actions like "New Order").

---

## 4. Pages — Implementation Order

Build pages in this order (each step builds on the previous one's patterns):

### Step 1: Login (`/login`)

**Layout:** asymmetric split — decorative left panel (desktop only) + form right panel.

**Components:** `Card`, `Input`, `Label`, `Button`. No shadcn Sidebar (login is outside `(dashboard)` route group).

**Features:**
- Email + password fields with `htmlFor`/`id` labels, `autoComplete` hints.
- Password visibility toggle with `aria-label`.
- Loading state on submit. Error display with `role="alert"`.
- Demo credentials section.

---

### Step 2: Dashboard (`/dashboard`)

**Components:** `StatCard` (custom), `Card`, `Badge`, `Progress`, `Button`.

**Sections:**

1. **KPI row** — 4 stat cards: in-transit orders, pending orders, delivered this month, revenue.
   - Responsive: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`.
   - Numbers use `tabular-nums` and the display font.

2. **Recent orders** — list inside a Card. Each row links to `/orders/[id]`.
   - Show: order ID (monospace), destination, deadline, price, status Badge.
   - Always-visible link arrows (not hover-only).

3. **Trucks on road** — Card with active trucks, fuel progress bars, link to `/fleet/[id]`.

4. **Maintenance alerts** — conditional Card for trucks with wear > 80%.

5. **Deposit capacity** — grid of mini-cards with Progress bars, link to `/deposits/[id]`.

---

### Step 3: Orders list (`/orders`)

**Components:** `Tabs` (status filter), `Table` (shadcn DataTable pattern), `Badge`, `Button`.

**Features:**
- Status tab bar: All / Pending / Shipped / Delivered / Cancelled (with counts).
- Responsive table in `overflow-x: auto` wrapper with `min-w-*` on `<table>`.
- Columns: Order ID (monospace link), Destination, Client, Status (Badge), Deadline (red if overdue), Value.
- `<th scope="col">` for accessibility.
- Always-visible row-level link to detail page.
- "New Order" button in page header.

---

### Step 4: Order detail (`/orders/[id]`)

**Components:** `Card`, `Badge`, `Separator`, custom route timeline.

**Sections:**
- **Order details** — info grid: client, receiver, destination, deadline, value, supplier delivery.
- **Items** — list of products with quantity, unit price, subtotal, cold/fragile badges.
- **Route tracking** — vertical timeline using an `<ol>` with position-based dots on a vertical rail. Each step: deposit or truck label, ETA, arrival timestamp.

---

### Step 5: New order form (`/orders/new`)

**Components:** `Card`, `Input`, `Label`, `Select`, `Button`.

**Features:**
- Destination, client (select from users with role="client"), receiver, deadline.
- Dynamic product line items: product select + quantity input + remove button. "Add item" action.
- All labels linked to inputs via `htmlFor`/`id`.
- Live estimated total.
- Responsive: product rows stack vertically on mobile (`flex-col sm:flex-row`).
- Submit with loading state, redirect to `/orders`.

---

### Step 6: Fleet list (`/fleet`)

**Components:** `Card`, `Badge`, `Progress`.

**Sections:**
- Summary row: total / available / on road / maintenance (responsive `grid-cols-2 sm:grid-cols-4`).
- Card grid: one card per truck.
  - Header: model, ID (mono), status badge.
  - Location: origin → destination or current deposit.
  - Fuel progress bar with percent.
  - Wear progress bar with percent.
  - Footer: cargo volume, refrigeration indicator, maintenance alert icon.

---

### Step 7: Fleet detail (`/fleet/[id]`)

**Components:** `Card`, `Badge`, `Progress`.

**Sections:**
- **Specs** — grid: model, refrigeration, speed, max volume, max weight, consumption.
- **Location** — origin/destination or current deposit, home deposit, ETA.
- **Cargo** — volume and weight Progress bars.
- **Fuel gauge** — large numeric percent + Progress bar + capacity/consumption note.
- **Wear gauge** — same structure, with maintenance alert if > 80%.
- **Performance** — key/value list: wear rate, avg speed, fuel/km.

---

### Step 8: Deposits (`/deposits`, `/deposits/[id]`)

**List:** card grid with capacity Progress bar, stock entry count, parked truck count, refrigeration indicator.

**Detail:** info grid + inventory list (product name, quantity, arrival date) + parked trucks card + inbound trucks card.

---

### Step 9: Products (`/products`)

Responsive table: name, flags (cold/fragile Badges), expiry, price, volume, weight. All `tabular-nums` on numeric columns.

---

### Step 10: Stock (`/stock`)

Summary row (total entries, in deposits, in transit) + responsive table: product, quantity, location, type (warehouse/transit Badge), arrived date.

---

### Step 11: Employees (`/employees`)

Responsive table: avatar (initials) + name, position, assigned deposit, status Badge (available/unavailable), hours/day, hourly cost.

---

### Step 12: Suppliers (`/suppliers`)

Responsive table: name, address, lat/lon. This is a new page not previously built. Simple CRUD display from the `supplier` table.

---

### Step 13: Reports (`/reports`)

Empty state placeholder with icon + message. To be populated once backend analytics endpoints exist.

---

## 5. Design Principles

### 5.1 Visual identity

- **Theme:** warm industrial dark. Deep slate backgrounds, amber/gold primary, muted text hierarchy.
- **Typography:** serif display font for page titles and large numbers (DM Serif Display). Sans-serif for body text (DM Sans). Monospace for IDs and data (JetBrains Mono).
- **Numbers:** always `tabular-nums` when in grids or tables.
- **Spacing scale:** use Tailwind's built-in scale consistently. No arbitrary pixel values except where Tailwind classes don't exist.
- **Border radius:** use shadcn's `--radius` variable for all components. Set once in `globals.css`.
- **Shadows:** minimal. The dark theme provides depth through background tiers (base → surface → elevated → hover) rather than shadows.

### 5.2 Responsive strategy

| Breakpoint | Behavior |
|-----------|----------|
| < 640px (mobile) | Single column. Sidebar hidden off-canvas. Tables scroll horizontally. Stat cards stack. |
| 640–1023px (tablet) | 2-column grids. Sidebar still off-canvas. |
| 1024px+ (desktop) | Full sidebar visible. 3–4 column grids. Tables comfortable. |

### 5.3 Accessibility requirements

- `lang="pt-BR"` on `<html>`.
- Global `:focus-visible` ring via shadcn's built-in focus styles.
- `prefers-reduced-motion: reduce` → disable all transitions/animations.
- `aria-label` on every icon-only button.
- `aria-current="page"` on active sidebar link (shadcn Sidebar does this).
- `scope="col"` on all `<th>`.
- Form labels tied to inputs via `htmlFor`/`id`.
- `role="alert"` on error messages.
- `role="progressbar"` with `aria-valuenow/min/max` on progress indicators.
- No hover-only affordances — all interactive elements always visible.

### 5.4 Component conventions

- **Never** use raw HTML where a shadcn component exists (e.g. always use `<Button>`, not `<button>`).
- **Never** hardcode Tailwind color classes for semantic meanings. Use CSS variable tokens: `text-primary`, `text-muted-foreground`, `bg-destructive`, etc.
- **Never** put emojis in the UI. Use Lucide icons exclusively.
- Extract repeated patterns into reusable components (InfoField, StatCard, DataTable wrapper, EmptyState).
- Server Components by default. Only add `"use client"` when state/interactivity is required.

### 5.5 Code quality

- Strict TypeScript (`"strict": true` in `tsconfig.json`).
- No `any` types.
- No `// ...` placeholder comments. No narration comments.
- ESLint + Next.js recommended rules.
- Imports sorted: React → Next.js → external libs → internal `@/` paths.

---

## 6. Dependency Summary

| Package | Purpose |
|---------|---------|
| `next@16` | Framework (already installed) |
| `react@19` | UI library (already installed) |
| `tailwindcss@4` | Styling (already installed) |
| `shadcn/ui` | Component library (via CLI, copies code) |
| `lucide-react` | Icon set (already installed) |

No other runtime deps should be needed. `shadcn init` will add `tailwind-merge` and `clsx` (via `class-variance-authority`) internally.
