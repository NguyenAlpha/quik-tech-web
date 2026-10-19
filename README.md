# QuikTech POS — Web

**English** | [Tiếng Việt](README.vi.md)

Web frontend for **QuikTech POS**: sales, inventory and debt tracking for small businesses with one or many stores, in English and Vietnamese.

- Demo: [pos.nhatnguyenhuynh.com](https://pos.nhatnguyenhuynh.com)
- Backend: [NguyenAlpha/omniflow-backend](https://github.com/NguyenAlpha/omniflow-backend)

![QuikTech POS dashboard](public/landing/app-dashboard.png)

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS 4**, shadcn/ui (Radix UI), lucide-react
- Recharts (charts), react-hook-form + zod (forms), @zxing/browser (barcode scanning)
- Vitest (unit tests), ESLint 9
- **pnpm** (npm is blocked in `package.json`)

## Features

- **Landing page**, sign up / sign in, first-time business setup (`/setup`)
- **Sales:** create orders, barcode scanning, payments, returns
- **Inventory:** products, categories, units, multiple warehouses, transfers, stock adjustments, CSV import
- **Purchasing** from suppliers
- **Customers & suppliers:** debt tracking, recording payments
- **Dashboard** for revenue and orders; Excel export
- **Team:** members and roles per store
- **Plans** Free / Basic / Pro, upgrade via QR bank transfer
- **System admin panel** at `/admin` (separate sign-in)
- English / Vietnamese, light / dark theme

## Running locally

**Requirements:** Node.js 20.9+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

The app calls the backend through `NEXT_PUBLIC_API_URL`, which defaults to `http://localhost:8080`. Run the backend locally by following the [backend README](https://github.com/NguyenAlpha/omniflow-backend), or point to another backend in `.env.local`:

```bash
# .env.local (gitignored)
NEXT_PUBLIC_API_URL=https://quiktech-pos-api-8217b2.azurewebsites.net
```

> Keep port **3000**. The backend only allows CORS from origins listed in `CORS_ORIGINS`, which defaults to `http://localhost:3000`.

With the backend's sample data, sign in as `user1` / `password` to get products, orders and customers out of the box.

## Scripts

| Command | Description |
|:--|:--|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Unit tests (Vitest) for `lib/` |

## Deployment

The demo is deployed on **Vercel** from the `main` branch:

1. Set the `NEXT_PUBLIC_API_URL` environment variable to the backend URL.
2. Add the web domain to the backend's `CORS_ORIGINS`; otherwise the browser blocks every request.

## Project structure

```text
app/
├── page.tsx         landing page
├── (auth)/          sign in, sign up, setup
├── (dashboard)/     store management pages
└── admin/           system admin panel
components/          shared components (ui/ is shadcn/ui)
lib/                 API client, auth, i18n (translations.ts), utilities
hooks/               React hooks
public/              logo, landing page images
docs/                documentation
```

## Documentation

The docs are written in Vietnamese.

| Doc | Topic |
|:--|:--|
| [OVERVIEW](docs/OVERVIEW.md) · [ARCHITECTURE](docs/ARCHITECTURE.md) | Overview, architecture |
| [FEATURES](docs/FEATURES.md) | Feature list |
| [API](docs/API.md) · [DATA_FLOW](docs/DATA_FLOW.md) | API calls, data flow |
| [AUTH](docs/AUTH.md) | Authentication, sessions |
| [COMPONENTS](docs/COMPONENTS.md) | Components |
| [I18N](docs/I18N.md) | Internationalization |
| [ADMIN_UI](docs/ADMIN_UI.md) | Admin panel |
| [PRODUCTS](docs/PRODUCTS.md) · [NOTIFICATIONS](docs/NOTIFICATIONS.md) · [PAYMENT_ACCOUNTS](docs/PAYMENT_ACCOUNTS.md) | Specific features |
| [RATE_LIMITING](docs/RATE_LIMITING.md) | Handling rate limits |
