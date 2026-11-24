# KoronKorko Remastered

<div>
    <a href="https://www.omarkraidie.com/projects">
        <img src="https://img.shields.io/badge/✨%20portfolio-1b1b1b?style=for-the-badge" />
    </a>
    <a href="https://www.linkedin.com/in/omarkraidie/">
        <img src="https://img.shields.io/badge/LinkedIn-%230073b1?style=for-the-badge&logo=linkedin&logoColor=white" />
    </a>
</div>

## What is KoronKorko?

[KoronKorko][site] was previously created using the MERN stack with vanilla JavaScript & CSS. However, this implementation is a remastered version of the previous one and is developed using Next.js, NextAuth, MongoDB with Prisma, TypeScript and Tailwind CSS.

Check out the [previous version][KoronKorkoOld] of KoronKorko or its [source code][KoronKorkoCodeOld].

[KoronKorko][site] is a full-stack web-app developed by [Omar Kraidié][dev]. KoronKorko has finance and aviation calculators. All the available calculators are listed below in this `README.md` file.

The users of KoronKorko can select a preferred currency in which all the monetary values are printed. The preferred currency will be saved either in local storage or in the authenticated users preferences.

Users can also choose their preferred units (speed, altitude, temperature, pressure, fuel and distance) for the aviation calculators. The unit preferences are stored the same way as the preferred currency.

Authenticated users can:

- create new and save new calculations
- edit existing calculations
- import previously saved calculations
- delete previously saved calculations

## Calculators of KoronKorko

### [Compound Interest Calculator][1]

Calculate the compound interest of an investment or determine how long your invested money can last.

The compound interest is calculated from various inputs such as starting balance, interest rate, duration, contribution and more. The calculated interest data can be viewed in both numerical and visual form.

---

### [Annualized Return Calculator][2]

Calculate the annualized return (CAGR), total percent return, and total profit of an investment.

### [Present Value Calculator][3]

Calculate the present value of an investment with a specified discount rate.

---

### [Investment Time Calculator][4]

Calculate the amount of time needed to grow an investment to a certain future value given an annual interest rate.

---

### [Break Even Point Calculator][5]

Calculate the point at which total cost equals total revenue, indicating neither profit nor loss for your business.

---

### [Markup Calculator][6]

Calculate the difference between the cost and the selling price of your product.

---

### [Event Probability Calculator][7]

Calculate the probability of an event occurring at least once, more than once, or exactly once in a given number of attempts.

---

### [Price to Earnings Ratio Calculator][8]

Calculate the price-to-earnings (P/E) ratio of a company to determine if its stock is overvalued or undervalued.

---

### [Dollar Cost Average Calculator][9]

Calculate the average cost of an investment over a time period, given an interest rate, initial investment amount and a series of periodic investments.

---

### [Enterprise Value Calculator][10]

Calculate the enterprise value of a company, given its market capitalization, total debt, and total cash.

---

### [Liquidation Price Calculator][11]

Calculate the liquidation price of an asset, given its entry price and the leverage ratio of the investment.

---

### [Dividend Yield Calculator][12]

Calculate the dividend yield of a stock, given its dividend amount, frequency, and share price.

---

## Aviation Calculators

Calculators for pilots and student pilots. Values can be entered and shown in the units chosen in the unit preferences.

### [Crosswind Calculator][13]

Calculate the crosswind and headwind or tailwind components for a runway, given the runway heading and the wind direction and speed, including gust components when a gust speed is given.

### [Wind Triangle Calculator][14]

Calculate the true heading, wind correction angle and groundspeed, given the true course, true airspeed and the wind direction and speed.

### [Density Altitude Calculator][15]

Calculate the pressure altitude, ISA temperature deviation and density altitude, given the field elevation, QNH and outside air temperature.

### [Fuel Planning Calculator][16]

Calculate the trip fuel, reserve fuel and total fuel by volume or mass, given the fuel burn rate, flight time, reserve time, optional taxi and extra fuel, and fuel type (AVGAS or Jet A).

### [True Airspeed Calculator][17]

Calculate the true airspeed, Mach number and density altitude, given the calibrated airspeed, pressure altitude and outside air temperature.

### [Time Speed Distance Calculator][18]

Calculate the distance, groundspeed or flight time, given the other two.

### [True, Magnetic and Compass Heading Calculator][19]

Calculate the magnetic and compass heading, given the true heading, magnetic variation and compass deviation correction.

---

## How to set up the project locally

### Prerequisites

- [Node.js](https://nodejs.org/) 24
- A [MongoDB](https://www.mongodb.com/) database (e.g. MongoDB Atlas; Prisma needs a replica set)
- A [Google OAuth](https://console.cloud.google.com/apis/credentials) client with the redirect URI `http://localhost:3000/api/auth/callback/google`
- A [GitHub OAuth app](https://github.com/settings/developers) with the callback URL `http://localhost:3000/api/auth/callback/github`
- A [Stripe](https://stripe.com/) account and the [Stripe CLI](https://docs.stripe.com/stripe-cli)

### Clone and install

```bash
git clone https://github.com/0mppula/koronkorko-remastered.git
cd koronkorko-remastered
npm install
```

### .env configuration

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```bash
DATABASE_URL=                            # MongoDB connection string
NEXTAUTH_SECRET=                         # Random secret used to sign NextAuth JWTs
NEXTAUTH_URL=http://localhost:3000       # App URL for NextAuth (local development only, not needed on Vercel)
GITHUB_ID=                               # GitHub OAuth app client ID
GITHUB_SECRET=                           # GitHub OAuth app client secret
GOOGLE_CLIENT_ID=                        # Google OAuth client ID
GOOGLE_CLIENT_SECRET=                    # Google OAuth client secret
STRIPE_SECRET_KEY=                       # Stripe secret API key
STRIPE_WEBHOOK_SECRET=                   # Webhook signing secret (printed by `stripe listen`)
STRIPE_WEEKLY_PREMIUM_PRICE_ID=          # Stripe price ID of the weekly premium plan
STRIPE_MONTHLY_PREMIUM_PRICE_ID=         # Stripe price ID of the monthly premium plan
STRIPE_YEARLY_PREMIUM_PRICE_ID=          # Stripe price ID of the yearly premium plan
NEXT_PUBLIC_STRIPE_WEEKLY_PREMIUM_LINK=  # Stripe payment link of the weekly premium plan
NEXT_PUBLIC_STRIPE_MONTHLY_PREMIUM_LINK= # Stripe payment link of the monthly premium plan
NEXT_PUBLIC_STRIPE_YEARLY_PREMIUM_LINK=  # Stripe payment link of the yearly premium plan
NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL=  # Stripe customer portal URL
```

### Setup Prisma

Push the schema to your database and generate the Prisma client:

```bash
npx prisma db push
npx prisma generate
```

### Forward Stripe events to your webhook

The webhook handles `checkout.session.completed`, `customer.subscription.updated` and `customer.subscription.deleted` events. Forward them to your local server and copy the printed signing secret to `STRIPE_WEBHOOK_SECRET`:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Start the development server

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Available commands

| Command                | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Start the development server                            |
| `npm run build`        | Generate the Prisma client and build for production     |
| `npm run start`        | Start the production server (after `npm run build`)     |
| `npm run lint`         | Lint the code with ESLint (`next lint`)                 |
| `npm run typecheck`    | Type-check the project with TypeScript (`tsc --noEmit`) |
| `npm run format`       | Format all files with Prettier                          |
| `npm run format:check` | Check that all files are formatted with Prettier        |
| `npm test`             | Run the tests once with Vitest                          |
| `npm run test:watch`   | Run the tests with Vitest in watch mode                 |

## Development

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

Before committing, run:

```bash
npm run lint
npm run typecheck
npm run format:check   # or `npm run format` to fix formatting
npm test
```

The [CI workflow](.github/workflows/ci.yml) runs the same checks (after `npx prisma generate`) on every pull request and push to `master`. Vercel builds every push.

## Tech stack

- [Next.js](https://nextjs.org/) 14 (App Router), [React](https://react.dev/) 18 and [TypeScript](https://www.typescriptlang.org/) 5
- [Prisma](https://www.prisma.io/) 5 with [MongoDB](https://www.mongodb.com/)
- [NextAuth.js](https://next-auth.js.org/) 4 (GitHub and Google)
- [Tailwind CSS](https://tailwindcss.com/) 3, [shadcn/ui](https://ui.shadcn.com/) (Radix UI), lucide-react and React Icons 5
- [TanStack Query](https://tanstack.com/query) 5 and axios 1
- [Zustand](https://zustand-demo.pmnd.rs/) 4
- [React Hook Form](https://react-hook-form.com/) 7 and [Zod](https://zod.dev/) 3
- [Stripe](https://stripe.com/) (stripe-node 16)
- [Recharts](https://recharts.org/) 2, date-fns 3, json-as-xlsx 2 and Sonner 1
- [Vercel Analytics](https://vercel.com/analytics) 1
- [Vitest](https://vitest.dev/) 5, ESLint 8 and Prettier 3

[dev]: https://github.com/0mppula
[site]: https://www.koronkorko.com/
[1]: https://www.koronkorko.com/compound-interest-calculator
[2]: https://www.koronkorko.com/annualized-return-calculator
[3]: https://www.koronkorko.com/present-value-calculator
[4]: https://www.koronkorko.com/investment-time-calculator
[5]: https://www.koronkorko.com/break-even-point-calculator
[6]: https://www.koronkorko.com/markup-calculator
[7]: https://www.koronkorko.com/event-probability-calculator
[8]: https://www.koronkorko.com/price-to-earnings-ratio-calculator
[9]: https://www.koronkorko.com/dollar-cost-average-calculator
[10]: https://www.koronkorko.com/enterprise-value-calculator
[11]: https://www.koronkorko.com/liquidation-price-calculator
[12]: https://www.koronkorko.com/dividend-yield-calculator
[13]: https://www.koronkorko.com/crosswind-calculator
[14]: https://www.koronkorko.com/wind-triangle-calculator
[15]: https://www.koronkorko.com/density-altitude-calculator
[16]: https://www.koronkorko.com/fuel-planning-calculator
[17]: https://www.koronkorko.com/true-airspeed-calculator
[18]: https://www.koronkorko.com/time-speed-distance-calculator
[19]: https://www.koronkorko.com/heading-calculator
[KoronKorkoOld]: https://koronkorko.herokuapp.com/
[KoronKorkoCodeOld]: https://github.com/0mppula/KoronKorko
