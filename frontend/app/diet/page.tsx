"use client";

import { useEffect, useState } from "react";
import DietUpload from "../components/DietUpload";

interface DietHistoryItem {
  id: number;
  timestamp: string;
  food_items: any[];
  total_kcal: number;
}

export default function DietPage() {
  const [history, setHistory] = useState<DietHistoryItem[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/diet/history?user_id=1")
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(err => console.error("Error fetching diet history:", err));
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col p-6">
        <h1 className="text-2xl font-bold text-emerald-600 mb-8">VibeHealth</h1>
        <nav className="space-y-4">
          <a href="/" className="block px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">Dashboard</a>
          <a href="/diet" className="block px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-medium">Diet Log</a>
          <a href="/exercise" className="block px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">Exercise</a>
          <a href="/plan" className="block px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">✨ Personal Plan</a>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <header className="max-w-2xl mx-auto mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Food Logger</h1>
          <p className="text-slate-500">Snap a photo of your meal. AI will handle the rest.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <DietUpload />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 h-fit">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center">
              <span className="mr-2">📅</span> Recent Logs
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {history.length === 0 ? (
                <p className="text-slate-400 text-sm">No records found yet.</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-semibold text-slate-400">
                        {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <span className="text-sm font-bold text-emerald-600">{item.total_kcal} kcal</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {item.food_items.map((food, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white dark:bg-slate-700 text-[10px] rounded-md border border-slate-100 dark:border-slate-600">
                          {food.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
