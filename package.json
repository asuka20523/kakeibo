import { useState, useEffect } from "react";

// ── パレット ──────────────────────────────────────────
const C = {
  bg:      "#0F0F13",
  surface: "#18181F",
  card:    "#1F1F2A",
  border:  "#2A2A38",
  accent:  "#A78BFA",
  blue:    "#38BDF8",
  green:   "#34D399",
  red:     "#F87171",
  yellow:  "#FCD34D",
  text:    "#F0EFF6",
  muted:   "#7B7A8E",
};

// ── 初期カテゴリ ──────────────────────────────────────
const initCategories = [
  { id: "food",    name: "食費",   color: "#A78BFA", subs: [{ id: "f1", name: "外食" }, { id: "f2", name: "スーパー" }, { id: "f3", name: "カフェ" }] },
  { id: "beauty",  name: "美容",   color: "#F472B6", subs: [{ id: "b1", name: "エステ" }, { id: "b2", name: "コスメ" }, { id: "b3", name: "美容院" }] },
  { id: "traffic", name: "交通費", color: "#60A5FA", subs: [{ id: "t1", name: "電車" }, { id: "t2", name: "タクシー" }] },
  { id: "misc",    name: "雑費",   color: "#FCD34D", subs: [{ id: "m1", name: "日用品" }, { id: "m2", name: "その他" }] },
  { id: "income",  name: "収入",   color: "#34D399", subs: [{ id: "i1", name: "給料" }, { id: "i2", name: "副業" }] },
];

const initBudgets = { food: 30000, beauty: 20000, traffic: 10000, misc: 10000 };

const TODAY = new Date();
const pad = n => String(n).padStart(2, "0");
const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fmtJP = d => `${d.getMonth()+1}月${d.getDate()}日`;

function uid() { return Math.random().toString(36).slice(2, 9); }

function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : init;
    } catch { return init; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal];
}

// ── メイン ──────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("record");
  const [records, setRecords] = useLocalStorage("kakeibo_records", []);
  const [categories, setCategories] = useLocalStorage("kakeibo_categories", initCategories);
  const [budgets, setBudgets] = useLocalStorage("kakeibo_budgets", initBudgets);
  const [viewMonth, setViewMonth] = useState({ y: TODAY.getFullYear(), m: TODAY.getMonth() });

  const monthStr = `${viewMonth.y}-${pad(viewMonth.m+1)}`;
  const monthRecords = records.filter(r => r.date.startsWith(monthStr));

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Noto Sans JP', sans-serif", maxWidth: 480, margin: "0 auto", paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>Kakeibo</div>
          <MonthNav viewMonth={viewMonth} setViewMonth={setViewMonth} />
        </div>
        <MonthSummary records={monthRecords} />
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {tab === "record"   && <RecordTab   records={monthRecords} allRecords={records} setRecords={setRecords} categories={categories} />}
        {tab === "budget"   && <BudgetTab   records={monthRecords} budgets={budgets} setBudgets={setBudgets} categories={categories} />}
        {tab === "calendar" && <CalendarTab records={monthRecords} categories={categories} viewMonth={viewMonth} />}
        {tab === "settings" && <SettingsTab categories={categories} setCategories={setCategories} />}
      </div>

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

function MonthNav({ viewMonth, setViewMonth }) {
  const prev = () => setViewMonth(v => { let m = v.m - 1, y = v.y; if (m < 0) { m=11; y--; } return {y,m}; });
  const next = () => setViewMonth(v => { let m = v.m + 1, y = v.y; if (m > 11) { m=0; y++; } return {y,m}; });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
      <button onClick={prev} style={navBtn}>‹</button>
      <span style={{ fontSize: 18, fontWeight: 700 }}>{viewMonth.y}年{viewMonth.m+1}月</span>
      <button onClick={next} style={navBtn}>›</button>
    </div>
  );
}
const navBtn = { background: "none", border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16, display:"flex", alignItems:"center", justifyContent:"center" };

function MonthSummary({ records }) {
  const income  = records.filter(r => r.type === "income").reduce((s,r) => s+r.amount, 0);
  const expense = records.filter(r => r.type === "expense").reduce((s,r) => s+r.amount, 0);
  const bal = income - expense;
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 11, color: C.muted }}>収支</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: bal >= 0 ? C.green : C.red }}>
        {bal >= 0 ? "+" : ""}{bal.toLocaleString()}円
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// タブ①: 記録
// ══════════════════════════════════════════════════════
function RecordTab({ records, allRecords, setRecords, categories }) {
  const [form, setForm] = useState({ date: fmt(TODAY), catId: categories[0]?.id || "", subId: "", amount: "", note: "", type: "expense" });

  const cat = categories.find(c => c.id === form.catId);
  const subs = cat?.subs || [];

  const save = () => {
    if (!form.amount || !form.catId) return;
    const sub = subs.find(s => s.id === form.subId) || subs[0];
    setRecords(r => [{ ...form, id: uid(), subId: sub?.id || "", amount: Number(form.amount), type: form.type }, ...r]);
    setForm(f => ({ ...f, amount: "", note: "" }));
  };

  const del = id => setRecords(r => r.filter(x => x.id !== id));
  const sorted = [...records].sort((a,b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 16, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {["expense","income"].map(t => (
            <button key={t} onClick={() => setForm(f=>({...f, type:t, catId: t==="income" ? "income" : f.catId === "income" ? categories.find(c=>c.id!=="income")?.id||"" : f.catId }))}
              style={{ flex:1, padding:"8px 0", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600, fontSize:13,
                background: form.type===t ? (t==="income"?C.green:C.accent) : C.border,
                color: form.type===t ? "#fff" : C.muted }}>
              {t==="expense"?"支出":"収入"}
            </button>
          ))}
        </div>
        <Row><label style={lbl}>日付</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inp} /></Row>
        <Row>
          <label style={lbl}>大カテゴリ</label>
          <select value={form.catId} onChange={e=>setForm(f=>({...f,catId:e.target.value,subId:""}))} style={inp}>
            {categories.filter(c => form.type==="income" ? c.id==="income" : c.id!=="income").map(c=>(
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Row>
        {subs.length > 0 && (
          <Row>
            <label style={lbl}>小カテゴリ</label>
            <select value={form.subId} onChange={e=>setForm(f=>({...f,subId:e.target.value}))} style={inp}>
              <option value="">選択なし</option>
              {subs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Row>
        )}
        <Row>
          <label style={lbl}>金額</label>
          <div style={{ position:"relative", flex:1 }}>
            <input type="number" placeholder="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} style={{...inp, paddingRight:28}} />
            <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:C.muted, fontSize:13 }}>円</span>
          </div>
        </Row>
        <Row><label style={lbl}>メモ</label><input placeholder="任意" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} style={inp} /></Row>
        <button onClick={save} style={{ width:"100%", marginTop:10, padding:"12px 0", borderRadius:10, border:"none", background: C.accent, color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer" }}>
          追加する
        </button>
      </div>

      <div style={{ fontSize:12, color:C.muted, marginBottom:8, letterSpacing:"0.1em" }}>HISTORY</div>
      {sorted.length === 0 && <Placeholder text="まだ記録がありません" />}
      {sorted.map(r => <RecordRow key={r.id} r={r} categories={categories} onDel={()=>del(r.id)} />)}
    </div>
  );
}

function RecordRow({ r, categories, onDel }) {
  const cat = categories.find(c => c.id === r.catId);
  const sub = cat?.subs.find(s => s.id === r.subId);
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:36, height:36, borderRadius:10, background: cat?.color+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <span style={{ fontSize:11, fontWeight:700, color: cat?.color }}>{cat?.name?.slice(0,2)}</span>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600 }}>{sub?.name || cat?.name || r.catId}</div>
        <div style={{ fontSize:11, color:C.muted }}>{fmtJP(new Date(r.date+"T00:00:00"))}　{r.note}</div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontSize:15, fontWeight:700, color: r.type==="income" ? C.green : C.text }}>
          {r.type==="income"?"+":"-"}{r.amount.toLocaleString()}円
        </div>
      </div>
      <button onClick={onDel} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:16, padding:"0 4px" }}>×</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// タブ②: 予算
// ══════════════════════════════════════════════════════
function BudgetTab({ records, budgets, setBudgets, categories }) {
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState("");
  const expCats = categories.filter(c => c.id !== "income");

  return (
    <div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:12, letterSpacing:"0.1em" }}>MONTHLY BUDGET</div>
      {expCats.map(cat => {
        const spent = records.filter(r => r.catId === cat.id && r.type==="expense").reduce((s,r) => s+r.amount, 0);
        const budget = budgets[cat.id] || 0;
        const remain = budget - spent;
        const pct = budget > 0 ? Math.min(spent / budget, 1) : 0;
        const overBudget = remain < 0;
        return (
          <div key={cat.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:14, marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:cat.color }} />
                <span style={{ fontWeight:600, fontSize:14 }}>{cat.name}</span>
              </div>
              {editing === cat.id ? (
                <div style={{ display:"flex", gap:6 }}>
                  <input type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} style={{ ...inp, width:90, padding:"4px 8px", fontSize:13 }} />
                  <button onClick={()=>{ setBudgets(b=>({...b,[cat.id]:Number(editVal)})); setEditing(null); }}
                    style={{ background:C.accent, border:"none", borderRadius:6, color:"#fff", padding:"4px 10px", cursor:"pointer", fontSize:12, fontWeight:600 }}>保存</button>
                </div>
              ) : (
                <button onClick={()=>{ setEditing(cat.id); setEditVal(String(budget)); }}
                  style={{ background:C.border, border:"none", borderRadius:6, color:C.muted, padding:"4px 10px", cursor:"pointer", fontSize:11 }}>予算を編集</button>
              )}
            </div>
            <div style={{ height:6, background:C.border, borderRadius:99, overflow:"hidden", marginBottom:8 }}>
              <div style={{ height:"100%", width:`${pct*100}%`, borderRadius:99, background: overBudget ? C.red : C.blue, transition:"width 0.4s" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
              <span style={{ color:C.muted }}>使用: {spent.toLocaleString()}円 / {budget.toLocaleString()}円</span>
              <span style={{ fontWeight:700, color: overBudget ? C.red : C.blue }}>
                {overBudget ? `${Math.abs(remain).toLocaleString()}円オーバー` : `あと${remain.toLocaleString()}円`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// タブ③: カレンダー
// ══════════════════════════════════════════════════════
function CalendarTab({ records, categories, viewMonth }) {
  const { y, m } = viewMonth;
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m+1, 0).getDate();

  const dayMap = {};
  records.forEach(r => {
    const d = parseInt(r.date.split("-")[2]);
    if (!dayMap[d]) dayMap[d] = { income:0, expense:0 };
    if (r.type==="income") dayMap[d].income += r.amount;
    else dayMap[d].expense += r.amount;
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const [selected, setSelected] = useState(null);
  const selRecs = selected ? records.filter(r => parseInt(r.date.split("-")[2]) === selected) : [];

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:3, marginBottom:3 }}>
        {["日","月","火","水","木","金","土"].map((d,i) => (
          <div key={d} style={{ textAlign:"center", fontSize:11, color: i===0?C.red:i===6?C.accent:C.muted, padding:"4px 0", fontWeight:600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:3 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const data = dayMap[d];
          const isToday = d === TODAY.getDate() && m === TODAY.getMonth() && y === TODAY.getFullYear();
          const isSel = d === selected;
          return (
            <div key={d} onClick={()=>setSelected(isSel?null:d)} style={{
              borderRadius:10, padding:"6px 4px", cursor:"pointer", textAlign:"center", minHeight:60,
              background: isSel ? C.accent+"33" : isToday ? C.accent+"18" : C.card,
              border: `1px solid ${isSel ? C.accent : isToday ? C.accent+"66" : C.border}`,
              transition:"all 0.15s"
            }}>
              <div style={{ fontSize:12, fontWeight: isToday?700:400, color: isToday?C.accent:C.text, marginBottom:2 }}>{d}</div>
              {data?.income  > 0 && <div style={{ fontSize:8, color:C.green, fontWeight:600, lineHeight:1.3 }}>+{data.income.toLocaleString()}円</div>}
              {data?.expense > 0 && <div style={{ fontSize:8, color:C.red,   fontWeight:600, lineHeight:1.3 }}>-{data.expense.toLocaleString()}円</div>}
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={{ marginTop:14, background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:14 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:10, color:C.accent }}>{m+1}月{selected}日の記録</div>
          {selRecs.length === 0 ? <Placeholder text="記録なし" /> : selRecs.map(r => <RecordRow key={r.id} r={r} categories={categories} onDel={()=>{}} />)}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// タブ④: 設定
// ══════════════════════════════════════════════════════
function SettingsTab({ categories, setCategories }) {
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#A78BFA");
  const [editCat, setEditCat] = useState(null);
  const [addSub, setAddSub] = useState(null);
  const [newSubName, setNewSubName] = useState("");
  const [editSub, setEditSub] = useState(null);

  const addCat = () => {
    if (!newCatName.trim()) return;
    setCategories(c => [...c, { id:uid(), name:newCatName.trim(), color:newCatColor, subs:[] }]);
    setNewCatName("");
  };
  const delCat = id => setCategories(c => c.filter(x => x.id !== id));
  const saveCatName = () => {
    if (!editCat) return;
    setCategories(c => c.map(x => x.id===editCat.id ? {...x, name:editCat.name} : x));
    setEditCat(null);
  };
  const addSubCat = catId => {
    if (!newSubName.trim()) return;
    setCategories(c => c.map(x => x.id===catId ? {...x, subs:[...x.subs,{id:uid(),name:newSubName.trim()}]} : x));
    setNewSubName(""); setAddSub(null);
  };
  const delSub = (catId, subId) => setCategories(c => c.map(x => x.id===catId ? {...x, subs:x.subs.filter(s=>s.id!==subId)} : x));
  const saveSubName = () => {
    if (!editSub) return;
    setCategories(c => c.map(x => x.id===editSub.catId ? {...x, subs:x.subs.map(s=>s.id===editSub.subId?{...s,name:editSub.name}:s)} : x));
    setEditSub(null);
  };

  return (
    <div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:12, letterSpacing:"0.1em" }}>CATEGORIES</div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:14, marginBottom:14 }}>
        <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>新しい大カテゴリを追加</div>
        <div style={{ display:"flex", gap:8 }}>
          <input type="color" value={newCatColor} onChange={e=>setNewCatColor(e.target.value)} style={{ width:36, height:36, border:"none", background:"none", cursor:"pointer", borderRadius:8 }} />
          <input placeholder="カテゴリ名" value={newCatName} onChange={e=>setNewCatName(e.target.value)} style={{...inp, flex:1}} />
          <button onClick={addCat} style={{ background:C.accent, border:"none", borderRadius:8, color:"#fff", padding:"0 14px", cursor:"pointer", fontWeight:700, fontSize:14 }}>+</button>
        </div>
      </div>

      {categories.map(cat => (
        <div key={cat.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:14, marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{ width:12, height:12, borderRadius:"50%", background:cat.color, flexShrink:0 }} />
            {editCat?.id === cat.id ? (
              <>
                <input value={editCat.name} onChange={e=>setEditCat(v=>({...v,name:e.target.value}))} style={{...inp, flex:1, padding:"4px 8px", fontSize:13}} />
                <button onClick={saveCatName} style={smallBtn(C.accent)}>保存</button>
                <button onClick={()=>setEditCat(null)} style={smallBtn(C.border)}>取消</button>
              </>
            ) : (
              <>
                <span style={{ flex:1, fontWeight:600 }}>{cat.name}</span>
                <button onClick={()=>setEditCat({id:cat.id,name:cat.name})} style={smallBtn(C.border)}>編集</button>
                <button onClick={()=>delCat(cat.id)} style={smallBtn("#F8717122")}>削除</button>
              </>
            )}
          </div>
          <div style={{ paddingLeft:20 }}>
            {cat.subs.map(s => (
              <div key={s.id} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                <span style={{ color:C.muted, fontSize:12 }}>└</span>
                {editSub?.subId === s.id ? (
                  <>
                    <input value={editSub.name} onChange={e=>setEditSub(v=>({...v,name:e.target.value}))} style={{...inp, flex:1, padding:"3px 8px", fontSize:12}} />
                    <button onClick={saveSubName} style={smallBtn(C.accent)}>保存</button>
                    <button onClick={()=>setEditSub(null)} style={smallBtn(C.border)}>×</button>
                  </>
                ) : (
                  <>
                    <span style={{ flex:1, fontSize:13 }}>{s.name}</span>
                    <button onClick={()=>setEditSub({catId:cat.id,subId:s.id,name:s.name})} style={smallBtn(C.border)}>編集</button>
                    <button onClick={()=>delSub(cat.id,s.id)} style={smallBtn("#F8717122")}>×</button>
                  </>
                )}
              </div>
            ))}
            {addSub === cat.id ? (
              <div style={{ display:"flex", gap:6, marginTop:6 }}>
                <input placeholder="小カテゴリ名" value={newSubName} onChange={e=>setNewSubName(e.target.value)} style={{...inp, flex:1, padding:"4px 8px", fontSize:12}} />
                <button onClick={()=>addSubCat(cat.id)} style={smallBtn(C.accent)}>追加</button>
                <button onClick={()=>setAddSub(null)} style={smallBtn(C.border)}>×</button>
              </div>
            ) : (
              <button onClick={()=>{setAddSub(cat.id);setNewSubName("");}} style={{ background:"none", border:`1px dashed ${C.border}`, color:C.muted, fontSize:11, borderRadius:6, padding:"3px 10px", cursor:"pointer", marginTop:4 }}>
                + 小カテゴリを追加
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ボトムナビ ────────────────────────────────────────
const TABS = [
  { id:"record",   label:"記録",      icon:"✏️" },
  { id:"budget",   label:"予算",      icon:"📊" },
  { id:"calendar", label:"カレンダー", icon:"📅" },
  { id:"settings", label:"設定",      icon:"⚙️" },
];
function BottomNav({ tab, setTab }) {
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex" }}>
      {TABS.map(t => (
        <button key={t.id} onClick={()=>setTab(t.id)} style={{
          flex:1, padding:"10px 0 14px", background:"none", border:"none", cursor:"pointer",
          display:"flex", flexDirection:"column", alignItems:"center", gap:3
        }}>
          <span style={{ fontSize:20 }}>{t.icon}</span>
          <span style={{ fontSize:10, color: tab===t.id ? C.accent : C.muted, fontWeight: tab===t.id?700:400 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── ユーティリティ ─────────────────────────────────────
const inp = { background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, padding:"8px 12px", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box" };
const lbl = { fontSize:12, color:C.muted, width:80, flexShrink:0, paddingTop:9 };
const smallBtn = bg => ({ background:bg, border:"none", borderRadius:6, color:C.text, padding:"4px 10px", cursor:"pointer", fontSize:11, fontWeight:600 });
function Row({ children }) { return <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:8 }}>{children}</div>; }
function Placeholder({ text }) { return <div style={{ textAlign:"center", color:C.muted, fontSize:13, padding:"24px 0" }}>{text}</div>; }
