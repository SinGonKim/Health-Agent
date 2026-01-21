"use client";

import { useEffect, useState } from "react";

interface DashboardSummary {
  total_calories: number;
  goal_calories: number;
  percentage: number;
}

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dailyRec, setDailyRec] = useState<{ meal: string; workout: string } | null>(null);

  useEffect(() => {
    // Fetch summary
    fetch("http://localhost:8000/api/v1/dashboard/summary?user_id=1")
      .then((res) => res.json())
      .then((data) => setSummary(data))
      .catch((err) => console.error("Error fetching dashboard summary:", err));

    // Fetch daily recommendations
    fetch("http://localhost:8000/api/v1/dashboard/daily-recommendations?user_id=1")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load suggestions");
        return res.json();
      })
      .then((data) => {
        if (data && data.meal && data.workout) {
          setDailyRec(data);
        } else {
          console.warn("Incomplete recommendation data received:", data);
        }
      })
      .catch((err) => {
        console.error("Error fetching daily recs:", err);
        // Optional: set a fallback state if desired
      });
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900">
      {/* Sidebar (Mockup) */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col p-6">
        <h1 className="text-2xl font-bold text-emerald-600 mb-8">VibeHealth</h1>
        <nav className="space-y-4">
          <a href="/" className="block px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-medium">Dashboard</a>
          <a href="/diet" className="block px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">Diet Log</a>
          <a href="/exercise" className="block px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">Exercise</a>
          <a href="/plan" className="block px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-emerald-600">✨ Plan Evaluator</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Good Evening</h2>
            <p className="text-slate-500">Here is your daily health summary.</p>
          </div>
          <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
            U
          </div>
        </header>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <a href="/diet" className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-all">
                <span className="text-4xl mb-2">📸</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">Log Meal</span>
              </a>
              <a href="/exercise" className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-all">
                <span className="text-4xl mb-2">💪</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">Log Exercise</span>
              </a>
            </div>

            <a href="/plan" className="block bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer hover:shadow-lg transition-all text-white">
              <div className="flex items-center">
                <span className="text-2xl mr-4">🎯</span>
                <div>
                  <p className="font-bold">AI Plan Evaluator</p>
                  <p className="text-xs opacity-90">Critique your health plan based on history</p>
                </div>
              </div>
              <span className="text-xl">→</span>
            </a>

            {/* Daily Recommendations */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                <span className="mr-2">✨</span> Today's AI Suggestions
              </h3>
              {dailyRec ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Recommended Meal</p>
                    <p className="text-slate-700 dark:text-slate-200 font-medium">{dailyRec.meal}</p>
                  </div>
                  <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800">
                    <p className="text-xs font-bold text-teal-600 uppercase mb-1">Recommended Workout</p>
                    <p className="text-slate-700 dark:text-slate-200 font-medium">{dailyRec.workout}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 text-slate-400 animate-pulse">
                  <div className="w-4 h-4 bg-slate-200 rounded-full"></div>
                  <p className="text-sm">Generating your custom suggestions...</p>
                </div>
              )}
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-500 mb-4">Daily Calories</h3>
            <div className="text-4xl font-bold text-emerald-600">
              {summary ? summary.total_calories.toLocaleString() : "..."}
              <span className="text-sm text-slate-400 font-normal"> / {summary ? summary.goal_calories.toLocaleString() : "2,000"}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-4">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${summary ? summary.percentage : 0}%` }}
              ></div>
            </div>
            {summary && (
              <p className="text-xs text-slate-400 mt-2">{summary.percentage}% of daily goal</p>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
