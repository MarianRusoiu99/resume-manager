# AI Resume Optimizer Platform

An intelligent resume generation platform that uses AI to create tailored, ATS-optimized resumes based on job descriptions. Built with Next.js 16, LangGraph, and OpenAI.

## Features

- 🤖 **AI-Powered Resume Generation**: Multi-agent LangGraph workflow that analyzes job postings and tailors resumes
- 📝 **Profile Management**: Comprehensive user profile system for experience, education, and skills
- 🔒 **Secure API Key Management**: Encrypted storage of AI provider API keys
- 📄 **PDF Export**: Generate ATS-friendly PDF resumes with customizable formatting
- 💬 **Cover Letter Generation**: AI-generated personalized cover letters with tone adaptation
- 📊 **Resume History**: Track and manage multiple generated resumes
- 🔍 **ATS Optimization**: Ensures resumes pass Applicant Tracking Systems

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Database**: PostgreSQL with Prisma ORM
- **AI Framework**: LangGraph + LangChain
- **AI Provider**: OpenAI (extensible to Anthropic, Google)
- **PDF Generation**: @react-pdf/renderer
- **Styling**: Tailwind CSS v4
- **Validation**: Zod
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd resume-optimizer
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```
   Note: `--legacy-peer-deps` is required due to Next.js 16 compatibility.

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/resume_optimizer"
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Encryption (for API keys)
   ENCRYPTION_KEY="your-32-character-encryption-key"
   ```

4. **Set up the database**
   ```bash
   # Run migrations
   npx prisma migrate dev
   
   # (Optional) Open Prisma Studio to view data
   npx prisma studio
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### 1. Register and Login

- Create an account at `/register`
- Login at `/login`

### 2. Set Up Your Profile

- Navigate to `/profile`
- Fill in your personal information, experience, education, and skills
- This data will be used to generate tailored resumes

### 3. Add AI Provider API Key

- Go to `/settings`
- Add your OpenAI API key
- The key is encrypted and stored securely

### 4. Generate a Resume

- Navigate to `/generate`
- Paste a job description
- Optionally enable cover letter generation
- Click "Generate Resume"
- The AI workflow will:
  - Analyze the job requirements
  - Match your profile to the job
  - Optimize content for ATS
  - Validate formatting
  - Generate a tailored resume

### 5. Export and Manage

- View generated resumes at `/resumes`
- Click on any resume to view details
- Export as PDF with the "Export PDF" button
- Copy cover letter text if generated
- Delete old resumes as needed

## Project Structure

```
resume-optimizer/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── profile/         # Profile management
│   │   ├── resumes/         # Resume generation & management
│   │   └── settings/        # Settings & API keys
│   ├── dashboard/           # Dashboard page
│   ├── generate/            # Resume generation UI
│   ├── login/               # Login page
│   ├── profile/             # Profile management UI
│   ├── register/            # Registration page
│   ├── resumes/             # Resume history & detail views
│   └── settings/            # Settings page
├── lib/
│   ├── ai/                  # AI agents and workflow
│   │   ├── agents/          # Individual AI agents
│   │   │   ├── analyze-job.agent.ts
│   │   │   ├── cover-letter.agent.ts
│   │   │   ├── profile-matching.agent.ts
│   │   │   ├── content-optimization.agent.ts
│   │   │   └── format-validation.agent.ts
│   │   └── workflow/        # LangGraph workflow
│   │       ├── graph.ts     # State graph definition
│   │       ├── types.ts     # State interfaces
│   │       └── agents/      # Workflow node wrappers
│   ├── encryption/          # API key encryption utilities
│   ├── pdf/                 # PDF generation components
│   ├── repositories/        # Data access layer
│   ├── services/            # Business logic layer
│   ├── validations/         # Zod schemas
│   └── db.ts                # Prisma client instance
├── prisma/
│   └── schema.prisma        # Database schema
├── public/                  # Static assets
└── tests/                   # Test files
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth endpoints (login, logout, session)

### Profile
- `GET /api/profile` - Get user profile
- `POST /api/profile` - Create profile
- `PUT /api/profile` - Update/upsert profile
- `DELETE /api/profile` - Delete profile

### API Keys
- `GET /api/settings/api-keys` - List API keys (masked)
- `POST /api/settings/api-keys` - Add new API key
- `DELETE /api/settings/api-keys/[id]` - Remove API key
- `POST /api/settings/api-keys/[id]/validate` - Validate API key

### Resumes
- `POST /api/resume/generate` - Generate new resume
- `GET /api/resume` - List user's resumes
- `GET /api/resume/[id]` - Get resume details
- `DELETE /api/resume/[id]` - Delete resume
- `POST /api/resume/[id]/export` - Export resume as PDF

## AI Workflow

The resume generation uses a LangGraph-based multi-agent workflow:

1. **Job Analysis Agent**: Extracts requirements, skills, and keywords from job description
2. **Profile Matching Agent**: Scores profile relevance and identifies gaps
3. **Content Optimization Agent**: Tailors experience descriptions and optimizes for ATS
4. **Format Validation Agent**: Ensures ATS compliance and proper formatting
5. **Output Generator**: Assembles final structured resume data
6. **Cover Letter Agent** (optional): Generates personalized cover letter with tone matching

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

Current test coverage:
- Repository layer: ProfileRepository (5 tests)
- Utility functions: Validation and encryption (4 tests)

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Database Management

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Generate Prisma Client
npx prisma generate
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js session encryption | Yes |
| `NEXTAUTH_URL` | Base URL of the application | Yes |
| `ENCRYPTION_KEY` | 32-character key for API key encryption | Yes |

## Security Considerations

- ✅ API keys are encrypted at rest using AES-256-GCM
- ✅ Passwords are hashed with bcrypt
- ✅ NextAuth.js handles session management securely
- ✅ API routes check authentication before processing
- ✅ Input validation with Zod schemas
- ⚠️ Ensure `ENCRYPTION_KEY` and `NEXTAUTH_SECRET` are strong and kept secret
- ⚠️ Use HTTPS in production
- ⚠️ Configure CORS appropriately for production

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Database Options

- **Vercel Postgres**: Integrated PostgreSQL
- **Neon**: Serverless PostgreSQL
- **Supabase**: PostgreSQL with additional features
- **Self-hosted**: Any PostgreSQL instance

## Troubleshooting

### Installation Issues

**Problem**: `npm install` fails with peer dependency errors

**Solution**: Use `npm install --legacy-peer-deps`

### Database Connection Issues

**Problem**: Cannot connect to database

**Solution**: 
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall settings

### API Key Validation Fails

**Problem**: "Invalid API key" error when testing

**Solution**:
- Verify the API key is correct
- Check provider selection matches key type
- Ensure network connectivity to AI provider

### Resume Generation Fails

**Problem**: Generation times out or fails

**Solution**:
- Check API key is valid and has credits
- Verify profile is complete with experience and skills
- Check job description is not empty
- Review server logs for specific errors

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT License](LICENSE)

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

## Roadmap

- [ ] Additional resume templates
- [ ] Resume editing and version control
- [ ] Template customization (colors, fonts)
- [ ] Support for more AI providers (Anthropic, Google)
- [ ] Resume analytics and improvement suggestions
- [ ] LinkedIn profile import
- [ ] Job application tracking
- [ ] Browser extension for one-click generation

---

Built with ❤️ using Next.js and AI
