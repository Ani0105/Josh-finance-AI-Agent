// ✅ FINAL ai-agent.js
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

    // ✅ ADD EXPENSE
    if (parsed.action === "add" && parsed.name && parsed.amount) {
      const backendRes = await fetch("http://localhost:3001/add-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: parsed.name, amount: parsed.amount }),
      });
      if (!backendRes.ok) throw new Error("Failed to save expense");
      return res.json({ reply: `Added ₹${parsed.amount} for ${parsed.name}.` });
    }

    // ✅ SET BUDGET (parse safely)
    if (parsed.action === "set_budget" && parsed.budget) {
      const budgetValue = Number(parsed.budget);
      if (isNaN(budgetValue)) {
        return res.json({ reply: "⚠️ Budget value is invalid." });
      }

      const backendRes = await fetch("http://localhost:3001/set-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: budgetValue }),
      });

      if (!backendRes.ok) throw new Error("Failed to set budget");

      return res.json({ reply: `Monthly budget set to ₹${budgetValue}` });
    }

    // ✅ DELETE EXPENSE
    if (parsed.action === "delete" && parsed.name && parsed.amount) {
      const backendRes = await fetch("http://localhost:3001/delete-expense-by-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: parsed.name, amount: parsed.amount }),
      });
      if (!backendRes.ok) throw new Error("Failed to delete expense");
      return res.json({ reply: `Deleted ₹${parsed.amount} of ${parsed.name}.` });
    }

    return res.json({ reply: "Sorry, I couldn’t understand that." });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ reply: "Something went wrong." });
  }
});

app.listen(3002, () => {
  console.log("🧠 AI agent server running at http://localhost:3002");
});
