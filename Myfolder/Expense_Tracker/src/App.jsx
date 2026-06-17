import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const CATEGORY_META = {
  Food:          { color: "#D85A30", bg: "#FAECE7", icon: "🍜" },
  Transport:     { color: "#378ADD", bg: "#E6F1FB", icon: "🚗" },
  Shopping:      { color: "#7F77DD", bg: "#EEEDFE", icon: "🛍️" },
  Health:        { color: "#1D9E75", bg: "#E1F5EE", icon: "💊" },
  Entertainment: { color: "#D4537E", bg: "#FBEAF0", icon: "🎬" },
  Utilities:     { color: "#BA7517", bg: "#FAEEDA", icon: "⚡" },
  Other:         { color: "#888780", bg: "#F1EFE8", icon: "📦" },
};

const MOCK_API_DATA = [
  { id: 1, title: "Grocery Store",     amount: 2400, category: "Food",          date: "2025-06-10", note: "Weekly groceries" },
  { id: 2, title: "Metro Card",        amount: 800,  category: "Transport",     date: "2025-06-09", note: "Monthly pass" },
  { id: 3, title: "Amazon Order",      amount: 3200, category: "Shopping",      date: "2025-06-08", note: "Books and stationery" },
  { id: 4, title: "Clinic Visit",      amount: 500,  category: "Health",        date: "2025-06-07", note: "" },
  { id: 5, title: "Movie Tickets",     amount: 600,  category: "Entertainment", date: "2025-06-06", note: "Saturday outing" },
  { id: 6, title: "Electricity Bill",  amount: 1200, category: "Utilities",     date: "2025-06-05", note: "June bill" },
  { id: 7, title: "Restaurant Dinner", amount: 1800, category: "Food",          date: "2025-06-04", note: "Family dinner" },
  { id: 8, title: "Cab Ride",          amount: 350,  category: "Transport",     date: "2025-06-03", note: "" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CATEGORIES = Object.keys(CATEGORY_META);

function formatINR(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function Badge({ category }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Other;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: meta.bg, color: meta.color,
      fontSize: 11, fontWeight: 500, padding: "2px 8px",
      borderRadius: 20, whiteSpace: "nowrap"
    }}>
      {meta.icon} {category}
    </span>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#ffffff",
      border: "0.5px solid #e0e0e0",
      borderRadius: 12,
      padding: "1rem 1.25rem",
      borderLeft: accent ? `3px solid ${accent}` : undefined,
    }}>
      <p style={{ margin: 0, fontSize: 12, color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
      <p style={{ margin: "6px 0 2px", fontSize: 22, fontWeight: 500, color: "#111" }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{sub}</p>}
    </div>
  );
}

export default function App() {
  // useState — form fields, list, UI state
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", amount: "", category: "Food", date: new Date().toISOString().split("T")[0], note: "" });
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);

  // useRef — focus management and mutable counter
  const titleRef = useRef(null);
  const nextId = useRef(100);

  // useEffect — mock API fetch on mount
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setExpenses(MOCK_API_DATA);
      setLoading(false);
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  // useEffect — auto-focus title field when form opens
  useEffect(() => {
    if (showForm && titleRef.current) {
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [showForm]);

  // useEffect — auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  // useCallback — stable event handlers
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(err => ({ ...err, [name]: "" }));
  }, []);

  const validate = useCallback(() => {
    const e = {};
    if (!form.title.trim()) e.title = "Name is required";
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) e.amount = "Enter a valid amount";
    if (!form.date) e.date = "Date is required";
    return e;
  }, [form]);

  const handleSubmit = useCallback(() => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (editId !== null) {
      setExpenses(prev => prev.map(ex => ex.id === editId ? { ...ex, ...form, amount: Number(form.amount) } : ex));
      setToast({ type: "success", msg: "Expense updated" });
    } else {
      const newExp = { ...form, amount: Number(form.amount), id: nextId.current++ };
      setExpenses(prev => [newExp, ...prev]);
      setToast({ type: "success", msg: "Expense added" });
    }
    setForm({ title: "", amount: "", category: "Food", date: new Date().toISOString().split("T")[0], note: "" });
    setEditId(null);
    setShowForm(false);
  }, [form, editId, validate]);

  const handleEdit = useCallback((ex) => {
    setForm({ title: ex.title, amount: String(ex.amount), category: ex.category, date: ex.date, note: ex.note || "" });
    setEditId(ex.id);
    setErrors({});
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    setToast({ type: "danger", msg: "Expense deleted" });
  }, []);

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditId(null);
    setErrors({});
    setForm({ title: "", amount: "", category: "Food", date: new Date().toISOString().split("T")[0], note: "" });
  }, []);

  // useMemo — filtered + sorted list, derived stats
  const filteredExpenses = useMemo(() => {
    let list = [...expenses];
    if (filter !== "All") list = list.filter(e => e.category === filter);
    if (search.trim()) list = list.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === "date")   list.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sortBy === "amount") list.sort((a, b) => b.amount - a.amount);
    if (sortBy === "name")   list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [expenses, filter, search, sortBy]);

  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const now = new Date();
    const thisMonth = expenses
      .filter(e => { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
      .reduce((s, e) => s + e.amount, 0);
    const byCategory = CATEGORIES.map(cat => ({
      name: cat,
      value: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
      color: CATEGORY_META[cat].color,
    })).filter(c => c.value > 0);
    const highest = expenses.length ? expenses.reduce((max, e) => e.amount > max.amount ? e : max, expenses[0]) : null;
    const byMonth = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const m = d.getMonth(), y = d.getFullYear();
      return {
        name: MONTHS[m],
        total: expenses
          .filter(e => { const ed = new Date(e.date); return ed.getMonth() === m && ed.getFullYear() === y; })
          .reduce((s, e) => s + e.amount, 0),
      };
    });
    return { total, thisMonth, byCategory, highest, byMonth };
  }, [expenses]);

  const inputStyle = (field) => ({
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 10px",
    fontSize: 14,
    border: errors[field] ? "1px solid #E24B4A" : "1px solid #ddd",
    borderRadius: 8,
    background: "#fff",
    color: "#111",
    outline: "none",
    fontFamily: "inherit",
  });

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 740, margin: "0 auto", padding: "2rem 1rem 4rem", background: "#f9f9f8", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#111" }}>💸 Expense Tracker</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>Track, analyse and manage your spending</p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setEditId(null); setErrors({}); }}
          style={{ background: "#534AB7", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
        >
          + Add expense
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          background: toast.type === "success" ? "#E1F5EE" : "#FCEBEB",
          color: toast.type === "success" ? "#085041" : "#791F1F",
          border: `1px solid ${toast.type === "success" ? "#5DCAA5" : "#F09595"}`,
          borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 500, marginBottom: "1rem"
        }}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
          <p style={{ margin: "0 0 1rem", fontWeight: 600, fontSize: 15, color: "#111" }}>
            {editId !== null ? "Edit expense" : "New expense"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Name *</label>
              <input
                ref={titleRef}
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Swiggy order"
                style={inputStyle("title")}
              />
              {errors.title && <p style={{ margin: "3px 0 0", fontSize: 11, color: "#E24B4A" }}>{errors.title}</p>}
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Amount (₹) *</label>
              <input
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="0"
                type="number"
                min="0"
                style={inputStyle("amount")}
              />
              {errors.amount && <p style={{ margin: "3px 0 0", fontSize: 11, color: "#E24B4A" }}>{errors.amount}</p>}
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Category</label>
              <select name="category" value={form.category} onChange={handleChange} style={inputStyle("category")}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Date *</label>
              <input
                name="date"
                value={form.date}
                onChange={handleChange}
                type="date"
                style={inputStyle("date")}
              />
              {errors.date && <p style={{ margin: "3px 0 0", fontSize: 11, color: "#E24B4A" }}>{errors.date}</p>}
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Note (optional)</label>
              <input
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Add a short note..."
                style={inputStyle("note")}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: "1rem" }}>
            <button
              onClick={handleSubmit}
              style={{ background: "#534AB7", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
            >
              {editId !== null ? "Save changes" : "Add expense"}
            </button>
            <button
              onClick={handleCancel}
              style={{ background: "transparent", color: "#888", border: "1px solid #ddd", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#888", fontSize: 14 }}>
          Loading your expenses…
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
            <StatCard label="Total spent"     value={formatINR(stats.total)}      sub={`${expenses.length} transactions`} accent="#534AB7" />
            <StatCard label="This month"      value={formatINR(stats.thisMonth)}  sub="June 2025"                         accent="#1D9E75" />
            <StatCard label="Categories"      value={stats.byCategory.length}     sub="active"                            accent="#D85A30" />
            {stats.highest && <StatCard label="Largest expense" value={formatINR(stats.highest.amount)} sub={stats.highest.title} accent="#D4537E" />}
          </div>

          {/* Charts */}
          {expenses.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.5rem" }}>
              <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: "1rem" }}>
                <p style={{ margin: "0 0 0.75rem", fontSize: 13, fontWeight: 500, color: "#888" }}>By category</p>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={stats.byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                      {stats.byCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatINR(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 8 }}>
                  {stats.byCategory.map(c => (
                    <span key={c.name} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#888" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }}></span>
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: "1rem" }}>
                <p style={{ margin: "0 0 0.75rem", fontSize: 13, fontWeight: 500, color: "#888" }}>Last 6 months</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={stats.byMonth} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1000 ? `₹${v / 1000}k` : `₹${v}`} />
                    <Tooltip formatter={(v) => [formatINR(v), "Total"]} />
                    <Bar dataKey="total" fill="#7F77DD" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search expenses…"
              style={{ flex: 1, minWidth: 140, padding: "7px 10px", fontSize: 13, border: "1px solid #ddd", borderRadius: 8, background: "#fff", color: "#111", fontFamily: "inherit" }}
            />
            <select value={filter} onChange={e => setFilter(e.target.value)}
              style={{ padding: "7px 10px", fontSize: 13, border: "1px solid #ddd", borderRadius: 8, background: "#fff", color: "#111", fontFamily: "inherit" }}>
              <option value="All">All categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding: "7px 10px", fontSize: 13, border: "1px solid #ddd", borderRadius: 8, background: "#fff", color: "#111", fontFamily: "inherit" }}>
              <option value="date">Sort: Latest</option>
              <option value="amount">Sort: Highest</option>
              <option value="name">Sort: A–Z</option>
            </select>
          </div>

          {/* Expense List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredExpenses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem", color: "#888", fontSize: 14, border: "1px dashed #ddd", borderRadius: 12 }}>
                {search || filter !== "All" ? "No expenses match your filters." : "No expenses yet — add your first one above."}
              </div>
            ) : filteredExpenses.map(ex => (
              <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: CATEGORY_META[ex.category]?.bg || "#F1EFE8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {CATEGORY_META[ex.category]?.icon || "📦"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 500, fontSize: 14, color: "#111" }}>{ex.title}</span>
                    <Badge category={ex.category} />
                  </div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                    {new Date(ex.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {ex.note && <> · {ex.note}</>}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 15, color: "#111" }}>{formatINR(ex.amount)}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, justifyContent: "flex-end" }}>
                    <button onClick={() => handleEdit(ex)}
                      style={{ background: "transparent", border: "1px solid #ddd", borderRadius: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer", color: "#555", fontFamily: "inherit" }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(ex.id)}
                      style={{ background: "transparent", border: "1px solid #F09595", borderRadius: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer", color: "#A32D2D", fontFamily: "inherit" }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredExpenses.length > 0 && (
            <p style={{ textAlign: "right", fontSize: 12, color: "#888", marginTop: "0.75rem" }}>
              Showing {filteredExpenses.length} of {expenses.length} expenses · Total:{" "}
              <strong>{formatINR(filteredExpenses.reduce((s, e) => s + e.amount, 0))}</strong>
            </p>
          )}
        </>
      )}
    </div>
  );
}