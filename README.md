# Servantra

**Your City. Your Services. One App.**

Servantra is a full-stack service marketplace platform connecting customers with local service providers (plumbers, electricians, cleaners, and more) across India.

## Features

- 🔐 **Authentication** — Email/password and Google OAuth via Supabase
- 🌐 **Multi-language Support** — Hindi, English, Bengali, Tamil, Telugu, Marathi, Gujarati, Spanish, French and Gen-Z slang
- 📦 **Service Booking** — Multi-step booking flow with date, time, address, and payment
- 🚨 **Emergency Dispatch** — One-tap emergency service dispatch
- 🗺️ **Live Tracking** — Real-time vendor location tracking via Leaflet maps
- 💬 **In-app Chat** — Real-time chat between customer and vendor per booking
- ⭐ **Reviews & Ratings** — Two-way rating system
- 🔔 **Notifications** — Real-time updates via Supabase channels
- 🛡️ **Admin Panel** — Full admin dashboard with bookings, users, revenue, SOS alerts, and more
- 💼 **Vendor Dashboard** — Accept/manage bookings, track earnings, withdraw funds
- 📱 **Capacitor Ready** — Can be wrapped as a native Android/iOS app

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18, TypeScript, Vite          |
| Styling     | Tailwind CSS, shadcn/ui             |
| Backend     | Supabase (Postgres + Realtime + Auth) |
| Maps        | Leaflet / OpenStreetMap             |
| Routing     | React Router v6                     |
| State       | TanStack Query v5                   |
| Forms       | React Hook Form + Zod               |

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- A Supabase project (see `.env` setup)

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/ad45singh/servantra.git
   cd servantra
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   
   Create a `.env` file in the root:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:8080`

## Deployment

Build for production:
```bash
npm run build
```

The `dist/` folder can be deployed to any static host (Vercel, Netlify, Cloudflare Pages, etc.).

## License

MIT
