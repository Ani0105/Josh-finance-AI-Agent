# Finance Agent Backend

This is the backend for the NextGen Finance Agent. It consists of two parts:

- `agent_backend.js`: Handles expense and budget logic using Bun's native server
- `ai-agent.js`: Express server that connects to Groq AI to parse natural language finance commands

## 🛠 Technologies Used
- Bun (for native backend)
- Express.js (for AI routing)
- dotenv (for env vars)
- Groq SDK (for AI)
- CORS & body-parser for API handling

## 🚀 Getting Started

### 1. Install Bun (if not already)
https://bun.sh/docs/installation

### 2. Create a `.env` file
```bash
cp .env.example .env
# Add your GROQ API key to .env
```

### 3. Start Servers
```bash
# Start backend logic
bun run agent_backend.js

# Start AI agent
bun ai-agent.js
```

## 📦 Environment Variables (`.env`)
```env
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=mixtral-8x7b-32768
```

## ⚠️ DO NOT commit your real `.env` file to GitHub.
