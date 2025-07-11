// ✅ Final agent_backend.js (pure backend logic)
import { serve } from "bun";

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

serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    if (path === "/add-expense" && method === "POST") {
      const data = await req.json();
      data.id = crypto.randomUUID();
      expenses.push({ ...data, date: new Date() });
      return Response.json({ success: true });
    }

    if (path === "/add-income" && method === "POST") {
      const data = await req.json();
      incomes.push({ ...data, date: new Date() });
      return Response.json({ success: true });
    }

    if (path === "/set-budget" && method === "POST") {
      const { budget: b } = await req.json();
      budget = b;
      return Response.json({ success: true });
    }

    if (path === "/get-budget") {
      return Response.json({ budget });
    }

    if (path === "/get-balance") {
      return Response.json({ balance: getMoneyBalance() });
    }

    if (path === "/get-weekly-expense") {
      return Response.json(getWeeklyExpenses());
    }

    if (path === "/delete-expense" && method === "POST") {
      const { id } = await req.json();
      expenses = expenses.filter(e => e.id !== id);
      return Response.json({ success: true });
    }

    if (path === "/delete-expense-by-name" && method === "POST") {
      const { name, amount } = await req.json();
      let deleted = false;
      expenses = expenses.filter((e) => {
        if (!deleted && e.name.toLowerCase() === name.toLowerCase() && e.amount === amount) {
          deleted = true;
          return false;
        }
        return true;
      });
      return Response.json({ success: true });
    }

    if (path === "/update-expense" && method === "POST") {
      const { id, name, amount } = await req.json();
      expenses = expenses.map(e => e.id === id ? { ...e, name, amount: parseFloat(amount) } : e);
      return Response.json({ success: true });
    }

    return new Response("Not Found", { status: 404 });
  },
});
