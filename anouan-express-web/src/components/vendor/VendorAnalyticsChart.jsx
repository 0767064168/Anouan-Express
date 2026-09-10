// src/components/vendor/VendorAnalyticsChart.jsx
// Graphiques Recharts pour le tableau de bord vendeur
import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, BarChart2, PieChart as PieChartIcon } from "lucide-react";

const SALES_DATA_7D = [
  { day: "Lun", ventes: 85000, commandes: 4 },
  { day: "Mar", ventes: 120000, commandes: 6 },
  { day: "Mer", ventes: 95000, commandes: 5 },
  { day: "Jeu", ventes: 165000, commandes: 8 },
  { day: "Ven", ventes: 210000, commandes: 11 },
  { day: "Sam", ventes: 320000, commandes: 16 },
  { day: "Dim", ventes: 255000, commandes: 13 },
];

const CATEGORY_DATA = [
  { name: "Mode & Pagne", value: 42, color: "#f97316" },
  { name: "Electronique", value: 28, color: "#3b82f6" },
  { name: "Maison", value: 18, color: "#10b981" },
  { name: "Accessoires", value: 12, color: "#a855f7" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const fmt = (v, n) =>
    n === "ventes"
      ? new Intl.NumberFormat("fr-CI").format(v) + " FCFA"
      : `${v} commandes`;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-xl">
      <p className="text-xs font-bold text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color || "#f97316" }}>
          {fmt(p.value, p.dataKey)}
        </p>
      ))}
    </div>
  );
};

export default function VendorAnalyticsChart() {
  const [activeTab, setActiveTab] = useState("area");

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">Performances de la semaine</h3>
          <p className="text-xs text-slate-500 mt-0.5">Ventes et commandes — 7 derniers jours</p>
        </div>
        <div className="flex gap-1 bg-slate-800 rounded-2xl p-1">
          {[
            { id: "area", icon: TrendingUp,    label: "Ventes" },
            { id: "bar",  icon: BarChart2,      label: "Cdes" },
            { id: "pie",  icon: PieChartIcon,   label: "Categ." },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 ${
                activeTab === id ? "bg-orange-500 text-white shadow" : "text-slate-400 hover:text-white"
              }`}>
              <Icon size={11} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48">
        {activeTab === "area" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SALES_DATA_7D}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                     tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ventes" name="ventes" stroke="#f97316" strokeWidth={2} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
        {activeTab === "bar" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={SALES_DATA_7D}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="commandes" name="commandes" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {activeTab === "pie" && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={CATEGORY_DATA} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}>
                {CATEGORY_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`}
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, fontSize: 11 }} />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 10 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
