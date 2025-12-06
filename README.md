# AI-Powered RFP Management System

A web application to streamline procurement workflows using AI to create, manage, and evaluate RFPs.

## Tech Stack

- **Frontend**: React.js, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **AI**: Google Gemini
- **Email**: Nodemailer (SMTP)

## Prerequisites

- Node.js (v16+)
- Docker & Docker Compose
- OpenAI API Key
- Gmail account (for email integration)

## Setup Instructions

### 1. Clone Repository

\`\`\`bash
git clone <your-repo-url>
cd rfp-management-system
\`\`\`

### 2. Start PostgreSQL

\`\`\`bash
docker-compose up -d
\`\`\`

### 3. Backend Setup

\`\`\`bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
\`\`\`

### 4. Frontend Setup

\`\`\`bash
cd frontend
npm install
npm start
\`\`\`

## Environment Variables

See `.env.example` in backend folder.

---

Built by Chinmay Shinde
