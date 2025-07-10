import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { format } from "date-fns";
import { motion } from "framer-motion";
import ChatBox from "@/components/ChatBox.jsx";


const COLORS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6", "#F43F5E"];

export default function FinanceAgentApp() {
  const [budget, setBudget] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ name: "", amount: "" });
  const [balance, setBalance] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: "", amount: "" });
  const [currency, setCurrency] = useState("₹");
  const [showSavings, setShowSavings] = useState(false);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
  const res = await fetch("/get-weekly-expense");
  const weekly = await res.json();
  const flat = Object.values(weekly).flat();
  setExpenses(flat);

  const bal = await fetch("/get-balance").then(r => r.json());
  setBalance(bal.balance);

  const bud = await fetch("/get-budget").then(r => r.json());
  setBudget(bud.budget); // ✅ syncs chat-based budget
};



  const handleAddExpense = async () => {
    const amt = parseFloat(newExpense.amount);
    if (newExpense.name && !isNaN(amt) && amt > 0) {
      await fetch("/add-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newExpense.name, amount: amt })
      });
      setNewExpense({ name: "", amount: "" });
      fetchData();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleAddExpense();
  };

  const handleDeleteExpense = async (id) => {
    await fetch("/delete-expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    fetchData();
  };

  const handleEditExpense = (expense) => {
    setEditingId(expense.id);
    setEditData({ name: expense.name, amount: expense.amount });
  };

  const handleSaveEdit = async (id) => {
    await fetch("/update-expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editData })
    });
    setEditingId(null);
    fetchData();
  };

  const totalSpent = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalAvailable = Math.max(budget - totalSpent, 0);

  const expenseMap = expenses.reduce((map, e) => {
    map[e.name] = (map[e.name] || 0) + e.amount;
    return map;
  }, {});

  const pieData = [
    ...Object.entries(expenseMap).map(([name, value]) => ({ name, value })),
    { name: "Available", value: totalAvailable },
  ];

  const savingsPerMonth = expenses.reduce((acc, e) => {
    const d = new Date(e.date);
    const month = format(d, "yyyy-MM");
    acc[month] = (acc[month] || 0) + e.amount;
    return acc;
  }, {});

  const barData = Object.entries(savingsPerMonth).map(([month, spent]) => ({
    month,
    saved: Math.max(budget - spent, 0),
  }));

  const trendInsight = () => {
    const highSpend = Object.entries(expenseMap).sort((a, b) => b[1] - a[1]);
    if (highSpend.length === 0) return "Not enough data to generate trend insights.";
    const topCategory = highSpend[0][0];
    return `🧠 Trend Insight: You’re spending most on “${topCategory}”. Consider reviewing this category for savings.`;
  };

  return (
    <motion.div
      className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-indigo-800 to-purple-900 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h1 className="text-2xl font-bold text-center sm:text-left">💰 Finance Agent</h1>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="text-black rounded px-2 py-1">
          <option value="₹">₹ INR</option>
          <option value="$">$ USD</option>
          <option value="€">€ EUR</option>
          <option value="£">£ GBP</option>
        </select>
      </div>

      <p className="text-center italic mb-6">{format(date, "PPpp")}</p>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card className="bg-white/10">
          <CardContent className="space-y-3">
            <Input placeholder="Monthly Budget" type="number" value={budget || ""} onChange={(e) => setBudget(Number(e.target.value))} />
            <Input placeholder="Expense name" value={newExpense.name} onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })} />
            <Input placeholder="Amount" type="number" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} onKeyDown={handleKeyPress} />
            <Button onClick={handleAddExpense}>➕ Add</Button>
          </CardContent>
        </Card>

        <Card className="bg-white/10">
          <CardContent>
            <h2 className="text-lg font-semibold mb-2">Pie Chart</h2>
            <div className="overflow-x-auto">
              <PieChart width={300} height={250}>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 space-y-3">
        <h2 className="text-xl font-bold">📝 Expense Log</h2>
        {expenses.map((e) => (
          <div key={e.id} className="flex flex-wrap items-center gap-2 bg-white/10 p-2 rounded-lg">
            {editingId === e.id ? (
              <>
                <Input value={editData.name} onChange={(ev) => setEditData({ ...editData, name: ev.target.value })} />
                <Input type="number" value={editData.amount} onChange={(ev) => setEditData({ ...editData, amount: ev.target.value })} />
                <Button onClick={() => handleSaveEdit(e.id)}>💾</Button>
                <Button onClick={() => setEditingId(null)}>❌</Button>
              </>
            ) : (
              <>
                <span className="flex-1">{format(new Date(e.date), "yyyy-MM-dd")} — {e.name} — {currency}{e.amount}</span>
                <Button onClick={() => handleEditExpense(e)}>✏️</Button>
                <Button onClick={() => handleDeleteExpense(e.id)}>🗑️</Button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Button onClick={() => setShowSavings(!showSavings)}>
          {showSavings ? "📉 Hide Savings" : "📈 Show Monthly Savings"}
        </Button>
        {showSavings && (
          <div className="overflow-x-auto mt-4">
            <BarChart width={500} height={250} data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="saved" fill="#34D399" />
            </BarChart>
          </div>
        )}
      </div>

      <div className="mt-10 p-4 bg-white/10 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">🧠 AI Trend Insight</h2>
        <p>{trendInsight()}</p>
      </div>
      <ChatBox onReply={fetchData} />

    </motion.div>
  );
}

