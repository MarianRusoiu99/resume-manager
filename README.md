# Resume Optimizer

> **Create tailored, ATS-optimized resumes in minutes with the power of AI.**

Resume Optimizer is an intelligent platform that helps you land your dream job by analyzing job descriptions and automatically tailoring your resume to match. Built with modern web technologies and advanced AI agents, it ensures your application stands out and passes Applicant Tracking Systems (ATS).

## 🚀 Quick Start

### Option 1: Run Locally

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/resume-optimizer.git
    cd resume-optimizer
    ```

2.  **Install dependencies**
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **Set up environment variables**
    Copy `.env.example` to `.env` and fill in your secrets:
    ```bash
    cp .env.example .env
    ```

4.  **Run database migrations**
    ```bash
    npx prisma migrate dev
    ```

5.  **Start the development server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Run with Docker 🐳

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/resume-optimizer.git
    cd resume-optimizer
    ```

2.  **Configure environment**
    Create a `.env` file with your secrets (see `.env.example`).

3.  **Start with Docker Compose**
    ```bash
    docker-compose up -d
    ```
    The app will be available at [http://localhost:3000](http://localhost:3000).

## ✨ Key Features

*   **🤖 AI-Powered Tailoring**: Automatically analyzes job descriptions and optimizes your resume content.
*   **📄 ATS-Friendly PDF Export**: Generates professionally formatted PDFs that pass automated screening.
*   **📝 Smart Cover Letters**: Creates personalized cover letters matching the job's tone and requirements.
*   **💼 Profile Management**: Centralized storage for your experience, education, and skills.
*   **🔒 Secure & Private**: API keys are encrypted at rest; your data stays yours.
*   **📊 Resume History**: Keep track of every version of your resume you've generated.

## 🛠️ Tech Stack

*   **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, Shadcn UI
*   **Backend**: Next.js API Routes, Prisma ORM
*   **Database**: PostgreSQL
*   **AI/LLM**: OpenAI API
*   **Auth**: NextAuth.js v5
*   **PDF**: @react-pdf/renderer

## ⚙️ Environment Variables

| Variable | Description | Required |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for session encryption | Yes |
| `NEXTAUTH_URL` | Base URL (e.g., http://localhost:3000) | Yes |
| `ENCRYPTION_KEY` | 32-char key for encrypting API keys | Yes |
| `OPENAI_API_KEY` | (Optional) Default OpenAI key | No |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
