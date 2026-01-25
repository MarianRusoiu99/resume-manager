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
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env`

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
   Create a `.env` file with your required secrets

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

## ✨ Key Features

### 📝 Resume Editor
| Feature | Description |
| :--- | :--- |
| **Rich Text Editor** | TipTap-powered editor with formatting, lists, and more |
| **Section Management** | Organize experience, education, skills, projects, and certifications |
| **Real-time Preview** | See changes instantly as you edit |
| **Multiple Profiles** | Maintain different resume versions for various career paths |

### 🎨 Templates & Export
| Feature | Description |
| :--- | :--- |
| **Custom Templates** | Choose from built-in templates or create your own with Handlebars |
| **PDF Export** | Generate professional, print-ready PDF documents |
| **JSON Resume Standard** | Import/export using the [JSON Resume](https://jsonresume.org/) format |


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
