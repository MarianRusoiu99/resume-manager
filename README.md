# Resume Manager

> **Your complete resume management solution with powerful AI integrations.**

Resume Manager is a modern platform for creating, editing, and managing professional resumes. With an intuitive editor, customizable templates, and optional AI-powered enhancements, you have full control over crafting the perfect resume for any opportunity.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

## 🚀 Quick Start

### Option 1: Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/MarianRusoiu99/resume-optimizer.git
   cd resume-optimizer
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/resume_optimizer"
   NEXTAUTH_SECRET="your-secret-key-min-32-chars"  # Generate: openssl rand -base64 32
   NEXTAUTH_URL="http://localhost:3000"
   ENCRYPTION_KEY="your-encryption-key-32-chars"   # Generate: openssl rand -hex 32
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Run with Docker 🐳

1. **Clone the repository**
   ```bash
   git clone https://github.com/MarianRusoiu99/resume-optimizer.git
   cd resume-optimizer
   ```

2. **Configure environment**
   Create a `.env` file with your required secrets:
   ```env
   NEXTAUTH_SECRET="your-secret-key-min-32-chars"
   ENCRYPTION_KEY="your-encryption-key-32-chars"
   
   # Optional overrides
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=resume_optimizer
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

   Docker Compose includes:
   - **app**: Next.js application (production build)
   - **db**: PostgreSQL 15 database
   - **migrate**: Automatic database migrations on startup

## ✨ Key Features

### 📝 Resume Editor
| Feature | Description |
| :--- | :--- |
| **Rich Text Editor** | BlockNote-powered editor with formatting, lists, and more |
| **Section Management** | Organize experience, education, skills, projects, and certifications |
| **Real-time Preview** | See changes instantly as you edit |
| **Multiple Profiles** | Maintain different resume versions for various career paths |

### 🎨 Templates & Export
| Feature | Description |
| :--- | :--- |
| **Custom Templates** | Choose from built-in templates or create your own with Handlebars |
| **PDF Export** | Generate professional, print-ready PDF documents |
| **JSON Resume Standard** | Import/export using the [JSON Resume](https://jsonresume.org/) format |

### 🤖 AI Integrations (Optional)
| Feature | Description |
| :--- | :--- |
| **Content Enhancement** | AI suggestions to improve bullet points and descriptions |
| **Job Tailoring** | Optimize your resume for specific job descriptions |
| **Cover Letter Generation** | Create matching cover letters with AI assistance |
| **ATS Optimization** | Ensure compatibility with Applicant Tracking Systems |

### 🔐 Security & Privacy
| Feature | Description |
| :--- | :--- |
| **Your Data, Your Control** | All data stored securely in your own database |
| **Encrypted API Keys** | AI provider keys encrypted at rest |
| **No Data Sharing** | Your resume content is never shared with third parties |

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, BlockNote Editor |
| **Backend** | Next.js API Routes, Server Actions, Prisma ORM |
| **Database** | PostgreSQL |
| **AI/LLM** | OpenAI API via Vercel AI SDK (optional) |
| **Auth** | NextAuth.js v5 (credentials provider) |
| **PDF** | pdf-lib, Handlebars templates |
| **Testing** | Vitest (unit), Playwright (E2E) |



## ⚙️ Environment Variables

| Variable | Description | Required |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for session encryption (min 32 chars) | Yes |
| `NEXTAUTH_URL` | Base URL (e.g., `http://localhost:3000`) | Yes |
| `ENCRYPTION_KEY` | 32+ char key for encrypting API keys at rest | Yes |

> **Note**: AI features are optional. If you want to use AI integrations, configure your API keys through the in-app **Settings → API Keys** page.


## 📜 Available Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |


## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) for details.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
