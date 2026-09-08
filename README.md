# GenWeb.ai

### Turn an idea into a live website with AI.

GenWeb.ai is an AI-powered website builder that turns a plain-language prompt into a complete, responsive HTML website. Users can generate a site, preview it, edit it with natural-language instructions, deploy it instantly, and manage multiple projects from one dashboard.

## Live product

- **Web app:** [genweb-ai-delta.vercel.app](https://genweb-ai-delta.vercel.app)
- **Repository:** [github.com/mradul-08/Genweb.ai](https://github.com/mradul-08/Genweb.ai)

> The live application requires the configured backend, database, authentication, and AI provider environment variables. Do not commit production secrets to this repository.

## Product presentation

### Describe

Write what you want in normal language: a SaaS landing page, a restaurant website, a creative portfolio, or a startup launch page.

### Generate

GenWeb.ai uses a provider-fallback AI layer to generate polished, responsive, single-page HTML with layout, typography, colors, sections, interactions, and responsive behavior.

### Refine

Continue the conversation in the editor. Requests such as "add a dark mode toggle", "fix the mobile layout", or "add testimonials" are applied to the existing website while preserving the rest of the design.

### Deploy

Deploy a project to a shareable public URL served directly by the backend. The dashboard provides preview, copy, share, redeploy, and take-offline controls.

## Features

- AI website generation from natural-language prompts
- Prompt enhancement for turning short ideas into detailed briefs
- Multiple AI provider fallbacks with key rotation and availability tracking
- Natural-language website editing with targeted HTML patching
- Full HTML source viewer and direct editing mode
- Undo and redo history in the editor
- Responsive desktop, tablet, and mobile previews
- Project dashboard with search, filtering, thumbnails, and deployment status
- Public deployment URLs with a GenWeb.ai attribution ribbon
- Google authentication through Firebase
- Cookie-based JWT sessions
- Credit-based usage model
- Razorpay credit purchases with payment signature verification
- Dark, animated product interface built with React and Framer Motion

## Architecture

```text
React + Vite client
        │
        │ HTTP requests with credentialed JWT cookies
        ▼
Express API server
   ├── Authentication and user accounts
   ├── Website generation and editing
   ├── Project and deployment management
   └── Razorpay payment verification
        │
        ├── MongoDB / Mongoose
        ├── Firebase Authentication
        └── AI provider fallback layer
```

### Repository structure

```text
websiteBuilder/
├── client/              React/Vite frontend
│   └── src/
│       ├── components/   Login, deployment, shared UI
│       ├── pages/        Home, dashboard, generate, editor, pricing
│       ├── redux/        User state and store
│       └── hooks/        Authentication and user hooks
└── server/              Express backend
    ├── config/           Database and AI provider configuration
    ├── controllers/      Auth, website, user, and payment logic
    ├── middlewares/      JWT authentication middleware
    ├── models/           User and website schemas
    ├── routes/           REST API routes
    └── templates/        Website template assets
```

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Redux Toolkit |
| UI | Framer Motion, Lucide React, CSS, Tailwind tooling |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| Authentication | Firebase Google Auth + JWT HTTP-only cookies |
| AI | OpenAI-compatible provider integrations with fallbacks |
| Payments | Razorpay |
| Hosting | Vercel/Firebase-compatible frontend and Node server deployment |

## Run locally

### Requirements

- Node.js 18+
- MongoDB connection string
- Firebase web configuration
- At least one configured AI provider key
- Razorpay keys if payment flows are needed

### Start the backend

```bash
cd server
npm install
npm run dev
```

The API runs on `http://localhost:3002` by default.

### Start the frontend

```bash
cd client
npm install
npm run dev
```

The client runs on `http://localhost:5173` by default.

## Environment configuration

Create `server/.env` for private backend values:

```env
PORT=3002
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3002
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=use_a_long_random_secret

# Firebase / AI / payment provider values
# See server/config/openRouter.js and server/controllers/payment.controller.js
```

Create `client/.env.local` for browser-safe Vite values:

```env
VITE_API_URL=http://localhost:3002
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
```

Only values intentionally designed for browser exposure should use the `VITE_` prefix. Never put server API keys, JWT secrets, payment secrets, database URLs, or deployment tokens in frontend environment files.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/google` | Create/sign in a Google-authenticated user |
| `POST` | `/api/auth/email` | Create/sign in an email-based user |
| `GET` | `/api/user/current` | Read the current session user |
| `POST` | `/api/website/generate` | Generate a website from a prompt |
| `POST` | `/api/website/enhance-prompt` | Expand a short website idea |
| `GET` | `/api/website/:id` | Read a project |
| `PUT` | `/api/website/:id` | Apply an AI edit |
| `POST` | `/api/website/:id/deploy` | Publish a project |
| `GET` | `/s/:slug` | Serve a deployed website publicly |
| `POST` | `/api/payment/create-order` | Create a Razorpay order |
| `POST` | `/api/payment/verify` | Verify payment and add credits |

## Production checklist

- Configure `CLIENT_URL` with the exact deployed frontend origin.
- Configure `SERVER_URL` with the public backend origin.
- Use HTTPS in production.
- Rotate any credential that has ever been committed or exposed.
- Keep `.env`, `.env.local`, logs, `node_modules`, and build output out of Git.
- Restrict CORS to the actual frontend domains.
- Use a strong, unique `JWT_SECRET`.
- Configure MongoDB network access and backups.
- Confirm AI provider quotas and fallback keys before launch.
- Verify Razorpay signatures only on the server.
- Test generation, editing, preview, deployment, payment, logout, and mobile layouts after each release.

## Contributing

1. Create a feature branch.
2. Make focused changes.
3. Run the relevant frontend lint/build checks.
4. Verify both authenticated and unauthenticated flows.
5. Open a pull request with screenshots or a short demo for UI changes.

## Author

Built by **Mrdaul Garg**.

- GitHub: [@mradul-08](https://github.com/mradul-08)
- Email: [mradulgarg2005@gmail.com](mailto:mradulgarg2005@gmail.com)
- Project: [GenWeb.ai](https://github.com/mradul-08/Genweb.ai)

## License

No open-source license has been declared yet. Until a license is added, all rights are reserved by the project owner.
