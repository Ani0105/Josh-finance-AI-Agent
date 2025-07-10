
// ✅ MERGED ai-agent.js WITH agent_backend.js
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// In-memory backend data
let expenses = [];
let incomes = [];
let budget = 0;

function getTotalExpense() {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

function getMoneyBalance() {
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  return (budget + totalIncome) - getTotalExpense();
}

function getWeeklyExpenses() {
  const grouped = {};
  for (const e of expenses) {
    const d = new Date(e.date);
    const week = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
    if (!grouped[week]) grouped[week] = [];
    grouped[week].push(e);
  }
  return grouped;
}

// Backend APIs
app.post("/add-expense", (req, res) => {
  const data = req.body;
  data.id = crypto.randomUUID();
  expenses.push({ ...data, date: new Date() });
  res.json({ success: true });
});

app.post("/add-income", (req, res) => {
  const data = req.body;
  incomes.push({ ...data, date: new Date() });
  res.json({ success: true });
});

app.post("/set-budget", (req, res) => {
  budget = req.body.budget;
  res.json({ success: true });
});

app.get("/get-budget", (req, res) => {
  res.json({ budget });
});

app.get("/get-balance", (req, res) => {
  res.json({ balance: getMoneyBalance() });
});

app.get("/get-weekly-expense", (req, res) => {
  res.json(getWeeklyExpenses());
});

app.post("/delete-expense", (req, res) => {
  const { id } = req.body;
  expenses = expenses.filter(e => e.id !== id);
  res.json({ success: true });
});

app.post("/delete-expense-by-name", (req, res) => {
  const { name, amount } = req.body;
  let deleted = false;
  expenses = expenses.filter((e) => {
    if (!deleted && e.name.toLowerCase() === name.toLowerCase() && e.amount === amount) {
      deleted = true;
      return false;
    }
    return true;
  });
  res.json({ success: true });
});

app.post("/update-expense", (req, res) => {
  const { id, name, amount } = req.body;
  expenses = expenses.map(e => e.id === id ? { ...e, name, amount: parseFloat(amount) } : e);
  res.json({ success: true });
});

// AI Agent Logic
app.post("/", async (req, res) => {
  const { message } = req.body;
  console.log("🧠 Received message:", message);

  try {
    const prompt = `
You are a smart finance assistant. Your job is to extract user's intent and return ONLY JSON. No explanations.

Examples:
1. Add expense: "Add 100 for chai"
{
  "action": "add",
  "name": "chai",
  "amount": 100
}

2. Set budget: "Set my monthly budget to 500"
{
  "action": "set_budget",
  "budget": 500
}

3. Delete: "Delete 100 of chai"
{
  "action": "delete",
  "name": "chai",
  "amount": 100
}

If unclear or unsupported, return:
{ "action": "unknown" }

User: ${message}
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-70b-8192",
    });

    const responseText = chatCompletion.choices[0]?.message?.content?.trim();
    console.log("🤖 Groq response:", responseText);

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      console.error("❌ Failed to parse JSON:", e);
      return res.json({ reply: "Sorry, I couldn't understand that." });
    }

    console.log("🤖 Parsed intent:", parsed);

    // Handle actions
    if (parsed.action === "add" && parsed.name && parsed.amount) {
      expenses.push({
        id: crypto.randomUUID(),
        name: parsed.name,
        amount: parsed.amount,
        date: new Date(),
      });
      return res.json({ reply: `Added ₹${parsed.amount} for ${parsed.name}.` });
    }

    if (parsed.action === "set_budget" && parsed.budget) {
      const budgetValue = Number(parsed.budget);
      if (isNaN(budgetValue)) {
        return res.json({ reply: "⚠️ Budget value is invalid." });
      }
      budget = budgetValue;
      return res.json({ reply: `Monthly budget set to ₹${budgetValue}` });
    }

    if (parsed.action === "delete" && parsed.name && parsed.amount) {
      let deleted = false;
      expenses = expenses.filter((e) => {
        if (!deleted && e.name.toLowerCase() === parsed.name.toLowerCase() && e.amount === parsed.amount) {
          deleted = true;
          return false;
        }
        return true;
      });
      return res.json({ reply: `Deleted ₹${parsed.amount} of ${parsed.name}.` });
    }

    return res.json({ reply: "Sorry, I couldn’t understand that." });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ reply: "Something went wrong." });
  }
});

app.listen(3002, () => {
  console.log("🚀 Full-stack AI agent + backend running at http://localhost:3002");
});
