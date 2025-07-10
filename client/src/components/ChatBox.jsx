import { useState } from "react";

export default function ChatBox({ onReply }) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput("");

    try {
      const res = await fetch("https://josh-finance-ai-agent.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });


      const data = await res.json();
      const agentReply = data.reply;

      setHistory((h) => [
        ...h,
        { role: "user", text: userText },
        { role: "agent", text: agentReply },
      ]);

      // ✅ Refresh only if data was added or budget set
      if (
        onReply &&
        (agentReply.toLowerCase().includes("added") ||
          agentReply.toLowerCase().includes("budget set"))
      ) {
        onReply();
      }
    } catch {
      setHistory((h) => [...h, { role: "agent", text: "⚠️ No response from agent." }]);
    }
  };

  const handleKey = (e) => e.key === "Enter" && handleSubmit();

  return (
    <div className="p-4 bg-white/10 mt-10 rounded-lg shadow text-white">
      <h2 className="text-lg font-semibold mb-2">💬 Talk to Josh (Your AI Agent)</h2>
      <div className="max-h-64 overflow-y-auto mb-4 space-y-2">
        {history.map((m, i) => (
          <div key={i} className={`${m.role === "user" ? "text-right" : "text-left"} text-sm`}>
            <span className={`inline-block px-3 py-2 rounded-xl ${m.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}>
              {m.text}
            </span>
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Add 200 for chai"
        className="w-full p-2 text-black rounded mb-2"
      />
      <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full">
        Send
      </button>
    </div>
  );
}
