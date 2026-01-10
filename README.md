# DH12 Notetaking App

An advanced notetaking platform with live transcription, threaded AI explanations, and drawing capabilities.

## Features

- **Notebooks & Notes**: Organize your notes in notebooks with rich text editing
- **Live Transcription**: Real-time lecture transcription using Assembly AI
- **Threaded AI Conversations**: Ask questions about your notes with context-aware AI responses
- **Drawing Board**: Create drawings with tldraw and sync via QR codes

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript and Tailwind CSS
- **Database**: Convex
- **Authentication**: Clerk
- **Transcription**: Assembly AI
- **Drawing**: tldraw
- **Rich Text**: TipTap

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Convex account (free tier available)
- Clerk account (free tier available)
- Assembly AI account (free tier available)
- Cloudflare account with a domain (for tunnel access)
- Cloudflared CLI installed ([Download](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd DH12
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Get from [Clerk Dashboard](https://dashboard.clerk.com)
- `CLERK_SECRET_KEY`: Get from [Clerk Dashboard](https://dashboard.clerk.com)
- `NEXT_PUBLIC_CONVEX_URL`: Get from Convex dashboard after project creation
- `CONVEX_DEPLOY_KEY`: Get from Convex dashboard
- `ASSEMBLYAI_API_KEY`: Get from [Assembly AI Dashboard](https://www.assemblyai.com/app)

4. Set up Convex:
```bash
npx convex dev
```

This will:
- Create a new Convex project (if you don't have one)
- Generate TypeScript types
- Start the Convex development server

5. Set up Cloudflare Tunnel (for remote access):
```bash
# Install cloudflared if you haven't already
# Windows: Download from https://github.com/cloudflare/cloudflared/releases
# macOS: brew install cloudflared
# Linux: Download from releases or use package manager

# Login to Cloudflare (creates .cloudflared/credentials.json)
npm run tunnel:login

# Create a tunnel (only needed once)
npm run tunnel:create

# This will output a tunnel ID. Copy it and update cloudflared-config.yml:
# - Copy cloudflared-config.yml.example to cloudflared-config.yml
# - Replace <TUNNEL_ID> with your actual tunnel ID

# Route DNS to your tunnel (only needed once)
npm run tunnel:route

# Check prerequisites before starting (optional but recommended)
npm run tunnel:check
```

6. Run the development server with tunnel:
```bash
npm run dev:tunnel
```

Or run them separately:
```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start tunnel
npm run tunnel
```

Access your app at [https://DH.nicholasching.ca](https://DH.nicholasching.ca)

**Note**: Make sure to add `https://DH.nicholasching.ca` to your Clerk Dashboard's allowed origins.

## Project Structure

```
DH12/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   ├── notebooks/         # Notebook components
│   ├── notes/             # Note components
│   ├── transcription/     # Transcription components
│   ├── ai-conversation/   # AI conversation components
│   ├── drawing/           # Drawing board components
│   └── qr-code/           # QR code components
├── lib/                   # Utilities and clients
│   ├── convex/           # Convex client setup
│   ├── clerk/            # Clerk utilities
│   └── assemblyai/       # Assembly AI client
├── convex/                # Convex backend functions
│   ├── schema.ts         # Database schema
│   ├── notebooks.ts      # Notebook CRUD
│   ├── notes.ts          # Note CRUD
│   ├── transcriptions.ts # Transcription functions
│   ├── conversations.ts  # AI conversation functions
│   └── drawings.ts       # Drawing functions
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## Development

### Available Scripts

- `npm run dev` - Start Next.js development server (localhost only)
- `npm run dev:tunnel` - Start Next.js dev server and Cloudflare tunnel together
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run convex:dev` - Start Convex development server
- `npm run convex:deploy` - Deploy Convex functions
- `npm run tunnel` - Start Cloudflare tunnel only
- `npm run tunnel:login` - Login to Cloudflare (one-time setup, creates credentials)
- `npm run tunnel:create` - Create a new tunnel (one-time setup)
- `npm run tunnel:route` - Configure DNS routing (one-time setup)
- `npm run tunnel:check` - Verify tunnel prerequisites are met
- `npm run tunnel:preflight` - Check prerequisites then start tunnel

### Database Schema

The app uses Convex with the following main tables:
- `notebooks` - User notebooks
- `notes` - Individual notes within notebooks
- `transcriptions` - Lecture transcriptions
- `conversations` - Threaded AI conversations
- `drawings` - Drawing board data

See `convex/schema.ts` for the full schema definition.

## Features in Development

- QR code scanning for drawing board sync
- AI integration for conversation responses
- Real-time collaboration
- Export notes to PDF/Markdown

## Contributing

This is a hackathon project. Contributions and suggestions are welcome!

## License

MIT
