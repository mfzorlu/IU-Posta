# IU Posta 📬

A secure, end-to-end encrypted group messaging application for Istanbul University students.

![End-to-End Encrypted](https://img.shields.io/badge/Encryption-AES--256--GCM-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB)
![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E)

## Features

- 🔒 **End-to-End Encryption** — Messages are encrypted with AES-256-GCM before leaving your device. The server never sees plaintext.
- 🔑 **RSA-AES Hybrid Encryption** — Each channel has a unique AES key, distributed to members using RSA-OAEP public key cryptography.
- 💬 **Realtime Messaging** — Instant message delivery via Supabase Realtime.
- 👥 **Group Channels** — Create channels and invite other students by email.
- 🛡️ **Zero-Knowledge Architecture** — Private keys never leave the browser. Supabase only stores encrypted ciphertext.

## Tech Stack

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Encryption:** Web Crypto API (native browser, no third-party crypto libs)

## How It Works

1. On signup, an RSA-2048 key pair is generated in the browser.
2. The public key is stored in Supabase. The private key stays in `localStorage`.
3. When a channel is created, a random AES-256 key is generated.
4. The AES key is encrypted with each member's RSA public key and stored in Supabase.
5. Messages are encrypted with the AES key before being sent. Only channel members can decrypt them.

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Installation

```bash
git clone https://github.com/your-username/iu-posta.git
cd iu-posta
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup

Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor to create the required tables and RLS policies.

### Run

```bash
npm run dev
```

## Security Notes

- Private keys are stored in `localStorage`. Clearing browser data will result in loss of access to previous messages.
- A key export/recovery feature is planned for future versions.
- All message content stored in Supabase is encrypted ciphertext — plaintext is never stored.

## License

MIT