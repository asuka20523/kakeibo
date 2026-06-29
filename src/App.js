import { useState, useEffect } from "react";

const C = {
  bg:"#F7F8FA", surface:"#FFFFFF", card:"#FFFFFF", border:"#E8EAF0",
  accent:"#6366F1", blue:"#3B82F6", green:"#10B981", red:"#EF4444",
  text:"#1A1A2E", muted:"#9098B1", purple:"#8B5CF6", teal:"#0D9488",
};

const ASSETS = ["現金","カード","PayPay","その他"];

const initWorks = [
  { id:"main", label:"本業", color:"#6366F1", bg:"#EEF2FF" },
  { id:"side", label:"副業", color:"#F59E0B", bg:"#FFFBEB" },
];

const initCategories = [
  { id:"food",    name:"食費",   color:"#6366F1", subs:[{id:"f1",name:"外食"},{id:"f2",name:"スーパー"},{id:"f3",name:"カフェ"}] },
  { id:"beauty",  name:"美容",   color:"#EC4899", subs:[{id:"b1",name:"エステ"},{id:"b2",name:"コスメ"},{id:"b3",name:"美容院"}] },
  { id:"traffic", name:"交通費", color:"#3B82F6", subs:[{id:"t1",name:"電車"},{id:"t2",name:"タクシー"}] },
  { id:"misc",    name:"雑費",   color:"#F59E0B", subs:[{id:"m1",name:"日用品"},{id:"m2",name:"その他"}] },
  { id:"income",  name:"収入",   color:"#10B981", subs:[{id:"i1",name:"給料"},{id:"i2",name:"副業収入"}] },
];
const initBudgets = {
  main:{ food:30000, beauty:20000, traffic:10000, misc:10000 },
  side:{ food:10000, beauty:5000,  traffic:5000,  misc:5000  },
};

const TODAY = new Date();
TODAY.setHours(0,0,0,0);
const pad = n => String(n).padStart(2,"0");
const fmtDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const TODAY_STR = fmtDate(TODAY);
const isFuture = dateStr => dateStr > TODAY_STR;
const isPast   = dateStr => dateStr <= TODAY_STR;

function uid() { return Math.random().toString(36).slice(2,9); }

function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

function WorkToggle({ works, work, setWork }) {
  return (
    <div style={{ display:"flex", background:C.bg, borderRadius:10, padding:3, gap:3, marginBottom:16 }}>
      {works.map(w => (
        <button key={w.id} onClick={()=>setWork(w.id)} style={{
          flex:1, padding:"7px 0", borderRadius:8, border:"none", cursor:"pointer",
          fontWeight:700, fontSize:13, transition:"all 0.15s",
          background: work===w.id ? w.color : "transparent",
          color:       work===w.id ? "#fff"  : C.muted,
          boxShadow:   work===w.id ? `0 2px 8px ${w.color}44` : "none",
        }}>{w.label}</button>
      ))}
    </div>
  );
}

// 資産ピル選択
function AssetPicker({ value, onChange }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:6, flex:1, paddingTop:4 }}>
      {ASSETS.map(a => (
        <button key={a} onClick={()=>onChange(a)} style={{
          padding:"6px 12px", borderRadius:20, fontSize:12, cursor:"pointer",
          border:`1.5px solid ${value===a?C.purple:C.border}`,
          background: value===a?`#CCFBF1`:"transparent",
          color:       value===a?C.purple:C.muted,
          fontWeight:  value===a?700:400,
        }}>{a}</button>
      ))}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("record");
  const [records, setRecords] = useLocalStorage("kakeibo_records_v2", []);
  const [categories, setCategories] = useLocalStorage("kakeibo_categories", initCategories);
  const [budgets, setBudgets] = useLocalStorage("kakeibo_budgets", initBudgets);
  const [works, setWorks] = useLocalStorage("kakeibo_works", initWorks);
  const [viewMonth, setViewMonth] = useState({ y:TODAY.getFullYear(), m:TODAY.getMonth() });
  const [work, setWork] = useState("main");

  const monthStr = `${viewMonth.y}-${pad(viewMonth.m+1)}`;
  const allMonthRecs = records.filter(r => r.date.startsWith(monthStr) && (r.work||"main")===work);
  const monthRecords = allMonthRecs.filter(r => isPast(r.date));   // 今日以前
  const futureRecs   = allMonthRecs.filter(r => isFuture(r.date)); // 未来

  const futureInc = futureRecs.filter(r=>r.type==="income").reduce((s,r)=>s+r.amount,0);
  const futureExp = futureRecs.filter(r=>r.type==="expense").reduce((s,r)=>s+r.amount,0);

  const wInfo = works.find(w=>w.id===work) || works[0];

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:"'Noto Sans JP','Hiragino Sans',sans-serif", maxWidth:480, margin:"0 auto", paddingBottom:80 }}>
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"16px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <MonthNav viewMonth={viewMonth} setViewMonth={setViewMonth} />
          <div style={{ background:wInfo.bg, border:`1px solid ${wInfo.color}44`, borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:700, color:wInfo.color }}>{wInfo.label}</div>
        </div>
        <MonthlySummaryBar records={monthRecords} futureInc={futureInc} futureExp={futureExp} wColor={wInfo.color} />
      </div>
      <div style={{ padding:"16px" }}>
        {tab==="record"   && <RecordTab   monthRecords={monthRecords} futureRecs={futureRecs} allRecords={records} setRecords={setRecords} categories={categories} works={works} work={work} setWork={setWork} />}
        {tab==="budget"   && <BudgetTab   records={[...monthRecords,...futureRecs]} budgets={budgets} setBudgets={setBudgets} categories={categories} works={works} work={work} setWork={setWork} />}
        {tab==="calendar" && <CalendarTab records={monthRecords} futureRecs={futureRecs} categories={categories} viewMonth={viewMonth} allRecords={records} setRecords={setRecords} works={works} work={work} setWork={setWork} />}
        {tab==="settings" && <SettingsTab categories={categories} setCategories={setCategories} works={works} setWorks={setWorks} />}
      </div>
      <BottomNav tab={tab} setTab={setTab} todayStr={`${TODAY.getMonth()+1}/${TODAY.getDate()}`} />
    </div>
  );
}

function MonthNav({ viewMonth, setViewMonth }) {
  const prev = () => setViewMonth(v => { let m=v.m-1,y=v.y; if(m<0){m=11;y--;} return {y,m}; });
  const next = () => setViewMonth(v => { let m=v.m+1,y=v.y; if(m>11){m=0;y++;} return {y,m}; });
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <button onClick={prev} style={navBtn}>‹</button>
      <span style={{ fontSize:17, fontWeight:700, color:C.text }}>{viewMonth.y}年{viewMonth.m+1}月</span>
      <button onClick={next} style={navBtn}>›</button>
    </div>
  );
}
const navBtn = { background:"none", border:`1px solid ${C.border}`, color:C.text, borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" };

function MonthlySummaryBar({ records, futureInc, futureExp, wColor }) {
  const income  = records.filter(r=>r.type==="income").reduce((s,r)=>s+r.amount,0);
  const expense = records.filter(r=>r.type==="expense").reduce((s,r)=>s+r.amount,0);
  const total   = income - expense;
  return (
    <div>
      <div style={{ background:C.bg, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <SummaryItem label="収入" value={income} color={C.green} />
        <span style={{ color:C.muted, fontSize:15 }}>−</span>
        <SummaryItem label="支出" value={expense} color={C.red} />
        <span style={{ color:C.muted, fontSize:15 }}>=</span>
        <SummaryItem label="合計" value={total} color={total>=0?wColor:C.red} bold />
      </div>
      {(futureInc>0||futureExp>0) && (
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:6, fontSize:11 }}>
          <span style={{ color:C.muted }}>予定：</span>
          {futureInc>0 && <span style={{ color:C.green, fontWeight:600 }}>+¥{futureInc.toLocaleString()}</span>}
          {futureExp>0 && <span style={{ color:C.red,   fontWeight:600 }}>−¥{futureExp.toLocaleString()}</span>}
        </div>
      )}
    </div>
  );
}
function SummaryItem({ label, value, color, bold }) {
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontSize:10, color:C.muted, marginBottom:1 }}>{label}</div>
      <div style={{ fontSize:bold?16:14, fontWeight:bold?800:600, color }}>¥{value.toLocaleString()}</div>
    </div>
  );
}

// ══ 記録タブ ══════════════════════════════════════════
function RecordTab({ monthRecords, futureRecs, allRecords, setRecords, categories, works, work, setWork }) {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("expense");
  const [form, setForm] = useState({
    date:fmtDate(TODAY), catId:categories[0]?.id||"", subId:"", amount:"", note:"",
    type:"expense", work:"main", asset:"現金"
  });

  const cat  = categories.find(c=>c.id===form.catId);
  const subs = cat?.subs||[];
  const wInfo = works.find(w=>w.id===work)||works[0];

  const openModal = () => {
    setModalType("expense");
    setForm(f=>({...f, work, type:"expense", catId:categories.find(c=>c.id!=="income")?.id||"", subId:"", amount:"", note:"", date:fmtDate(TODAY), asset:"現金"}));
    setShowModal(true);
  };
  const handleModalTypeChange = t => {
    setModalType(t);
    if(t==="income") setForm(f=>({...f, type:"income", catId:"income", subId:""}));
    else setForm(f=>({...f, type:"expense", catId:categories.find(c=>c.id!=="income")?.id||"", subId:""}));
  };

  const save = () => {
    if(!form.amount||!form.catId) return;
    const sub = subs.find(s=>s.id===form.subId)||subs[0];
    setRecords(r=>[{...form, id:uid(), subId:sub?.id||"", amount:Number(form.amount)},...r]);
    setShowModal(false);
  };
  const del = id => setRecords(r=>r.filter(x=>x.id!==id));

  // 過去分グループ
  const sorted = [...monthRecords].sort((a,b)=>b.date.localeCompare(a.date));
  const grouped = {};
  sorted.forEach(r => { if(!grouped[r.date]) grouped[r.date]=[]; grouped[r.date].push(r); });

  // 未来分グループ
  const fSorted = [...futureRecs].sort((a,b)=>a.date.localeCompare(b.date));
  const fGrouped = {};
  fSorted.forEach(r => { if(!fGrouped[r.date]) fGrouped[r.date]=[]; fGrouped[r.date].push(r); });

  return (
    <div style={{ position:"relative" }}>
      <WorkToggle works={works} work={work} setWork={setWork} />

      {/* 予定セクション */}
      {Object.keys(fGrouped).length>0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
            <div style={{ width:3, height:14, borderRadius:99, background:C.teal }} />
            <span style={{ fontSize:12, fontWeight:700, color:C.teal }}>予定（未来の収支）</span>
          </div>
          {Object.keys(fGrouped).map(date => {
            const dr = fGrouped[date];
            const inc = dr.filter(r=>r.type==="income").reduce((s,r)=>s+r.amount,0);
            const exp = dr.filter(r=>r.type==="expense").reduce((s,r)=>s+r.amount,0);
            const d = new Date(date+"T00:00:00");
            const wd = ["日","月","火","水","木","金","土"][d.getDay()];
            const wdCol = d.getDay()===0?C.red:d.getDay()===6?C.blue:C.muted;
            return (
              <div key={date} style={{ marginBottom:8, opacity:0.8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"2px 4px 5px" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:wdCol }}>{d.getMonth()+1}月{d.getDate()}日（{wd}）</span>
                  <div style={{ display:"flex", gap:8, fontSize:11 }}>
                    {inc>0 && <span style={{ color:C.green }}>+¥{inc.toLocaleString()}</span>}
                    {exp>0 && <span style={{ color:C.red }}>-¥{exp.toLocaleString()}</span>}
                  </div>
                </div>
                {dr.map(r=><RecordRow key={r.id} r={r} categories={categories} onDel={()=>del(r.id)} future />)}
              </div>
            );
          })}
          <div style={{ height:1, background:C.border, margin:"12px 0" }} />
        </div>
      )}

      {/* 実績セクション */}
      {Object.keys(grouped).length===0 && futureRecs.length===0 && <Placeholder text="右下の＋ボタンから記録を追加しましょう" />}
      {Object.keys(grouped).map(date => {
        const dayRecs = grouped[date];
        const dayInc  = dayRecs.filter(r=>r.type==="income").reduce((s,r)=>s+r.amount,0);
        const dayExp  = dayRecs.filter(r=>r.type==="expense").reduce((s,r)=>s+r.amount,0);
        const d = new Date(date+"T00:00:00");
        const wd = ["日","月","火","水","木","金","土"][d.getDay()];
        const wdCol = d.getDay()===0?C.red:d.getDay()===6?C.blue:C.text;
        return (
          <div key={date} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 4px 6px" }}>
              <span style={{ fontSize:13, fontWeight:700, color:wdCol }}>{d.getMonth()+1}月{d.getDate()}日（{wd}）</span>
              <div style={{ display:"flex", gap:10, fontSize:12 }}>
                {dayInc>0  && <span style={{ color:C.green }}>+¥{dayInc.toLocaleString()}</span>}
                {dayExp>0  && <span style={{ color:C.red }}>-¥{dayExp.toLocaleString()}</span>}
              </div>
            </div>
            {dayRecs.map(r=><RecordRow key={r.id} r={r} categories={categories} onDel={()=>del(r.id)} />)}
          </div>
        );
      })}

      {/* FAB */}
      <button onClick={openModal} style={{
        position:"fixed", bottom:86, right:"calc(50% - 228px)",
        width:56, height:56, borderRadius:"50%",
        background:wInfo.color, border:"none", cursor:"pointer",
        boxShadow:`0 4px 18px ${wInfo.color}55`,
        display:"flex", alignItems:"center", justifyContent:"center", zIndex:100
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {/* モーダル */}
      {showModal && (
        <div onClick={()=>setShowModal(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:480, padding:"20px 20px 44px", boxShadow:"0 -4px 30px rgba(0,0,0,0.12)", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ width:40, height:4, background:C.border, borderRadius:99, margin:"0 auto 18px" }} />
            <div style={{ fontWeight:700, fontSize:16, color:C.text, marginBottom:14 }}>新規入力</div>

            {/* 本業/副業 */}
            <div style={{ display:"flex", background:C.bg, borderRadius:10, padding:3, gap:3, marginBottom:12 }}>
              {works.map(w=>(
                <button key={w.id} onClick={()=>setForm(f=>({...f,work:w.id}))} style={{
                  flex:1, padding:"7px 0", borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:13,
                  background:form.work===w.id?w.color:"transparent",
                  color:form.work===w.id?"#fff":C.muted,
                  boxShadow:form.work===w.id?`0 2px 8px ${w.color}44`:"none",
                }}>{w.label}</button>
              ))}
            </div>

            {/* 支出/収入タブ */}
            <div style={{ display:"flex", background:C.bg, borderRadius:10, padding:3, gap:3, marginBottom:14 }}>
              {[{id:"expense",label:"支出"},{id:"income",label:"収入"}].map(t=>(
                <button key={t.id} onClick={()=>handleModalTypeChange(t.id)} style={{
                  flex:1, padding:"8px 0", borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:13,
                  background: modalType===t.id?(t.id==="income"?C.green:C.accent):"transparent",
                  color: modalType===t.id?"#fff":C.muted,
                }}>{t.label}</button>
              ))}
            </div>

            <FRow label="日付"><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inp} /></FRow>
            <FRow label="大カテゴリ">
              <select value={form.catId} onChange={e=>setForm(f=>({...f,catId:e.target.value,subId:""}))} style={inp}>
                {categories.filter(c=>modalType==="income"?c.id==="income":c.id!=="income").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FRow>
            {subs.length>0 && (
              <FRow label="小カテゴリ">
                <select value={form.subId} onChange={e=>setForm(f=>({...f,subId:e.target.value}))} style={inp}>
                  <option value="">選択なし</option>
                  {subs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FRow>
            )}
            {/* 資産（支払/受取手段） */}
            <FRow label={modalType==="income"?"受取手段":"支払手段"}>
              <AssetPicker value={form.asset} onChange={v=>setForm(f=>({...f,asset:v}))} />
            </FRow>
            <FRow label="金額">
              <div style={{ position:"relative", flex:1 }}>
                <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:C.muted, fontSize:13 }}>¥</span>
                <input type="number" placeholder="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} style={{...inp,paddingLeft:24}} />
              </div>
            </FRow>
            <FRow label="メモ"><input placeholder="任意" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} style={inp} /></FRow>
            {isFuture(form.date) && (
              <div style={{ background:`#CCFBF1`, border:`1px solid ${C.teal}33`, borderRadius:10, padding:"8px 12px", marginBottom:12, fontSize:12, color:C.teal }}>
                📅 未来の日付です。「予定」として記録されます。
              </div>
            )}
            <button onClick={save} style={{ width:"100%", marginTop:4, padding:"14px 0", borderRadius:12, border:"none", background:works.find(w=>w.id===form.work)?.color||C.accent, color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer" }}>
              追加する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordRow({ r, categories, onDel, future }) {
  const cat = categories.find(c=>c.id===r.catId);
  const sub = cat?.subs?.find(s=>s.id===r.subId);
  return (
    <div style={{ background:C.card, border:`1px solid ${future?C.teal+"44":C.border}`, borderRadius:12, padding:"11px 14px", marginBottom:6, display:"flex", alignItems:"center", gap:10, opacity:future?0.85:1 }}>
      <div style={{ width:36, height:36, borderRadius:10, background:(cat?.color||C.muted)+"18", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <span style={{ fontSize:11, fontWeight:700, color:cat?.color||C.muted }}>{cat?.name?.slice(0,2)||"?"}</span>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:13, fontWeight:600 }}>{sub?.name||cat?.name||r.catId}</span>
          {r.asset && <span style={{ fontSize:10, color:C.purple, background:"#F5F3FF", borderRadius:10, padding:"1px 6px" }}>{r.asset}</span>}
          {future && <span style={{ fontSize:10, color:C.teal, background:`#CCFBF1`, borderRadius:10, padding:"1px 6px" }}>予定</span>}
        </div>
        {r.note && <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{r.note}</div>}
      </div>
      <div style={{ fontSize:15, fontWeight:700, color:r.type==="income"?C.green:C.text }}>
        {r.type==="income"?"+":"-"}¥{r.amount.toLocaleString()}
      </div>
      <button onClick={onDel} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:16, padding:"0 2px" }}>×</button>
    </div>
  );
}

// ══ 予算タブ ══════════════════════════════════════════
function BudgetTab({ records, budgets, setBudgets, categories, works, work, setWork }) {
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState("");
  const expCats = categories.filter(c=>c.id!=="income");
  const wb = budgets[work]||{};
  const wInfo = works.find(w=>w.id===work)||works[0];
  const totalBudget = expCats.reduce((s,c)=>s+(wb[c.id]||0),0);
  const totalSpent  = records.filter(r=>r.type==="expense").reduce((s,r)=>s+r.amount,0);
  const totalRemain = totalBudget - totalSpent;
  const saveBudget  = (catId, val) => { setBudgets(b=>({ ...b, [work]:{ ...(b[work]||{}), [catId]:Number(val) } })); setEditing(null); };
  return (
    <div>
      <WorkToggle works={works} work={work} setWork={setWork} />
      <div style={{ background:wInfo.color, borderRadius:16, padding:"16px 20px", marginBottom:16, color:"#fff" }}>
        <div style={{ fontSize:12, opacity:0.8, marginBottom:4 }}>{wInfo.label}の予算合計</div>
        <div style={{ fontSize:24, fontWeight:800 }}>¥{totalBudget.toLocaleString()}</div>
        <div style={{ display:"flex", gap:20, marginTop:10, fontSize:13 }}>
          <div><span style={{ opacity:0.7 }}>使用済み </span><span style={{ fontWeight:700 }}>¥{totalSpent.toLocaleString()}</span></div>
          <div><span style={{ opacity:0.7 }}>残り </span><span style={{ fontWeight:700, color:totalRemain<0?"#FCA5A5":"#A5F3D0" }}>¥{Math.abs(totalRemain).toLocaleString()}{totalRemain<0?" オーバー":""}</span></div>
        </div>
      </div>
      {expCats.map(cat=>{
        const spent  = records.filter(r=>r.catId===cat.id&&r.type==="expense").reduce((s,r)=>s+r.amount,0);
        const budget = wb[cat.id]||0;
        const remain = budget-spent;
        const pct    = budget>0?Math.min(spent/budget,1):0;
        const over   = remain<0;
        return (
          <div key={cat.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:14, marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:cat.color }} />
                <span style={{ fontWeight:600, fontSize:14 }}>{cat.name}</span>
              </div>
              {editing===cat.id?(
                <div style={{ display:"flex", gap:6 }}>
                  <input type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} style={{...inp,width:90,padding:"4px 8px",fontSize:13}} />
                  <button onClick={()=>saveBudget(cat.id,editVal)} style={accentBtn}>保存</button>
                </div>
              ):(
                <button onClick={()=>{setEditing(cat.id);setEditVal(String(budget));}} style={grayBtn}>予算を編集</button>
              )}
            </div>
            <div style={{ height:6, background:C.bg, borderRadius:99, overflow:"hidden", marginBottom:8 }}>
              <div style={{ height:"100%", width:`${pct*100}%`, borderRadius:99, background:over?C.red:C.blue, transition:"width 0.4s" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
              <span style={{ color:C.muted }}>¥{spent.toLocaleString()} / ¥{budget.toLocaleString()}</span>
              <span style={{ fontWeight:700, color:over?C.red:C.blue }}>{over?`¥${Math.abs(remain).toLocaleString()} オーバー`:`あと ¥${remain.toLocaleString()}`}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══ カレンダータブ ══════════════════════════════════════
function CalendarTab({ records, futureRecs, categories, viewMonth, allRecords, setRecords, works, work, setWork }) {
  const {y,m} = viewMonth;
  const firstDay    = new Date(y,m,1).getDay();
  const daysInMonth = new Date(y,m+1,0).getDate();
  const [selected, setSelected] = useState(null);
  const wInfo = works.find(w=>w.id===work)||works[0];

  const buildMap = recs => {
    const map = {};
    recs.forEach(r=>{
      const d=parseInt(r.date.split("-")[2]);
      if(!map[d])map[d]={income:0,expense:0};
      if(r.type==="income")map[d].income+=r.amount;
      else map[d].expense+=r.amount;
    });
    return map;
  };
  const dayMap    = buildMap(records);
  const futureMap = buildMap(futureRecs);

  const cells=[];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);

  const selDateStr = selected?`${y}-${pad(m+1)}-${pad(selected)}`:null;
  const selRecs    = selDateStr?records.filter(r=>r.date===selDateStr):[];
  const selFuture  = selDateStr?futureRecs.filter(r=>r.date===selDateStr):[];
  const del = id => setRecords(r=>r.filter(x=>x.id!==id));

  return (
    <div>
      <WorkToggle works={works} work={work} setWork={setWork} />
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"10px 8px", marginBottom:12 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
          {["日","月","火","水","木","金","土"].map((d,i)=>(
            <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:600, padding:"4px 0", color:i===0?C.red:i===6?C.blue:C.muted }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
          {cells.map((d,i)=>{
            if(!d) return <div key={i}/>;
            const data   = dayMap[d];
            const fdata  = futureMap[d];
            const isT    = d===TODAY.getDate()&&m===TODAY.getMonth()&&y===TODAY.getFullYear();
            const isSel  = d===selected;
            const hasFuture = fdata&&(fdata.income>0||fdata.expense>0);
            return (
              <div key={d} onClick={()=>setSelected(isSel?null:d)} style={{
                borderRadius:8, padding:"5px 2px 6px", cursor:"pointer", textAlign:"center", minHeight:58,
                background: isSel?wInfo.color:isT?wInfo.bg:C.card,
                border:`1px solid ${isSel?wInfo.color:isT?wInfo.color+"66":C.border}`,
                transition:"all 0.15s", position:"relative"
              }}>
                <div style={{ fontSize:12, fontWeight:isT||isSel?700:400, color:isSel?"#fff":isT?wInfo.color:C.text, marginBottom:2 }}>{d}</div>
                {data?.income>0  && <div style={{ fontSize:7, color:isSel?"#A5F3D0":C.green, fontWeight:600, lineHeight:1.4 }}>+¥{data.income.toLocaleString()}</div>}
                {data?.expense>0 && <div style={{ fontSize:7, color:isSel?"#FCA5A5":C.red,   fontWeight:600, lineHeight:1.4 }}>-¥{data.expense.toLocaleString()}</div>}
                {fdata?.income>0  && <div style={{ fontSize:7, color:isSel?"#99F6E4":C.teal, fontWeight:600, lineHeight:1.4, opacity:0.9 }}>+¥{fdata.income.toLocaleString()}</div>}
                {fdata?.expense>0 && <div style={{ fontSize:7, color:isSel?"#99F6E4":C.teal, fontWeight:600, lineHeight:1.4, opacity:0.9 }}>−¥{fdata.expense.toLocaleString()}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:14, marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:wInfo.color }} />
              <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{m+1}月{selected}日（{wInfo.label}）</span>
            </div>
            {(()=>{
              const inc=selRecs.filter(r=>r.type==="income").reduce((s,r)=>s+r.amount,0);
              const exp=selRecs.filter(r=>r.type==="expense").reduce((s,r)=>s+r.amount,0);
              const tot=inc-exp;
              const fInc=selFuture.filter(r=>r.type==="income").reduce((s,r)=>s+r.amount,0);
              const fExp=selFuture.filter(r=>r.type==="expense").reduce((s,r)=>s+r.amount,0);
              return (
                <>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-around", background:C.bg, borderRadius:10, padding:"10px 0" }}>
                    <div style={{ textAlign:"center" }}><div style={{ fontSize:10, color:C.muted }}>収入</div><div style={{ fontSize:14, fontWeight:700, color:C.green }}>¥{inc.toLocaleString()}</div></div>
                    <span style={{ color:C.muted }}>−</span>
                    <div style={{ textAlign:"center" }}><div style={{ fontSize:10, color:C.muted }}>支出</div><div style={{ fontSize:14, fontWeight:700, color:C.red }}>¥{exp.toLocaleString()}</div></div>
                    <span style={{ color:C.muted }}>=</span>
                    <div style={{ textAlign:"center" }}><div style={{ fontSize:10, color:C.muted }}>合計</div><div style={{ fontSize:14, fontWeight:700, color:tot>=0?wInfo.color:C.red }}>¥{tot.toLocaleString()}</div></div>
                  </div>
                  {(fInc>0||fExp>0) && (
                    <div style={{ marginTop:8, background:`#CCFBF1`, borderRadius:8, padding:"6px 12px", fontSize:11, color:C.teal, display:"flex", gap:12 }}>
                      <span>予定：</span>
                      {fInc>0&&<span>+¥{fInc.toLocaleString()}</span>}
                      {fExp>0&&<span>−¥{fExp.toLocaleString()}</span>}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          {selFuture.length>0 && selFuture.map(r=><RecordRow key={r.id} r={r} categories={categories} onDel={()=>del(r.id)} future />)}
          {selRecs.length===0&&selFuture.length===0?<Placeholder text="記録なし"/>:selRecs.map(r=><RecordRow key={r.id} r={r} categories={categories} onDel={()=>del(r.id)} />)}
        </div>
      )}
    </div>
  );
}

// ══ 設定タブ（カレンダー名変更 + カテゴリ管理）══════════
function SettingsTab({ categories, setCategories, works, setWorks }) {
  const [newCatName,  setNewCatName]  = useState("");
  const [newCatColor, setNewCatColor] = useState("#6366F1");
  const [editCat,     setEditCat]     = useState(null);
  const [addSub,      setAddSub]      = useState(null);
  const [newSubName,  setNewSubName]  = useState("");
  const [editSub,     setEditSub]     = useState(null);
  const [editWork,    setEditWork]    = useState(null);

  const addCat      = () => { if(!newCatName.trim()) return; setCategories(c=>[...c,{id:uid(),name:newCatName.trim(),color:newCatColor,subs:[]}]); setNewCatName(""); };
  const delCat      = id => setCategories(c=>c.filter(x=>x.id!==id));
  const saveCatName = () => { if(!editCat) return; setCategories(c=>c.map(x=>x.id===editCat.id?{...x,name:editCat.name}:x)); setEditCat(null); };
  const addSubCat   = catId => { if(!newSubName.trim()) return; setCategories(c=>c.map(x=>x.id===catId?{...x,subs:[...x.subs,{id:uid(),name:newSubName.trim()}]}:x)); setNewSubName(""); setAddSub(null); };
  const delSub      = (catId,subId) => setCategories(c=>c.map(x=>x.id===catId?{...x,subs:x.subs.filter(s=>s.id!==subId)}:x));
  const saveSubName = () => { if(!editSub) return; setCategories(c=>c.map(x=>x.id===editSub.catId?{...x,subs:x.subs.map(s=>s.id===editSub.subId?{...s,name:editSub.name}:s)}:x)); setEditSub(null); };
  const saveWorkName= () => { if(!editWork) return; setWorks(ws=>ws.map(w=>w.id===editWork.id?{...w,label:editWork.label}:w)); setEditWork(null); };

  return (
    <div>
      {/* カレンダー名設定 */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:14, marginBottom:14 }}>
        <div style={{ fontSize:12, color:C.muted, marginBottom:10, fontWeight:600 }}>カレンダー名の変更</div>
        {works.map(w=>(
          <div key={w.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:w.color, flexShrink:0 }} />
            {editWork?.id===w.id ? (
              <>
                <input value={editWork.label} onChange={e=>setEditWork(v=>({...v,label:e.target.value}))} style={{...inp,flex:1,padding:"6px 10px",fontSize:13}} />
                <button onClick={saveWorkName} style={accentBtn}>保存</button>
                <button onClick={()=>setEditWork(null)} style={grayBtn}>取消</button>
              </>
            ) : (
              <>
                <span style={{ flex:1, fontWeight:600, fontSize:14 }}>{w.label}</span>
                <button onClick={()=>setEditWork({id:w.id,label:w.label})} style={grayBtn}>名前を変更</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* カテゴリ管理 */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:14, marginBottom:14 }}>
        <div style={{ fontSize:12, color:C.muted, marginBottom:8, fontWeight:600 }}>新しい大カテゴリを追加</div>
        <div style={{ display:"flex", gap:8 }}>
          <input type="color" value={newCatColor} onChange={e=>setNewCatColor(e.target.value)} style={{ width:36, height:36, border:"none", background:"none", cursor:"pointer", borderRadius:8, padding:2 }} />
          <input placeholder="カテゴリ名" value={newCatName} onChange={e=>setNewCatName(e.target.value)} style={{...inp,flex:1}} />
          <button onClick={addCat} style={{ ...accentBtn, padding:"0 16px", fontSize:18 }}>+</button>
        </div>
      </div>
      {categories.map(cat=>(
        <div key={cat.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:14, marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{ width:12, height:12, borderRadius:"50%", background:cat.color, flexShrink:0 }} />
            {editCat?.id===cat.id?(
              <><input value={editCat.name} onChange={e=>setEditCat(v=>({...v,name:e.target.value}))} style={{...inp,flex:1,padding:"4px 8px",fontSize:13}} /><button onClick={saveCatName} style={accentBtn}>保存</button><button onClick={()=>setEditCat(null)} style={grayBtn}>取消</button></>
            ):(
              <><span style={{flex:1,fontWeight:600}}>{cat.name}</span><button onClick={()=>setEditCat({id:cat.id,name:cat.name})} style={grayBtn}>編集</button><button onClick={()=>delCat(cat.id)} style={redBtn}>削除</button></>
            )}
          </div>
          <div style={{ paddingLeft:20 }}>
            {cat.subs.map(s=>(
              <div key={s.id} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                <span style={{ color:C.muted, fontSize:12 }}>└</span>
                {editSub?.subId===s.id?(
                  <><input value={editSub.name} onChange={e=>setEditSub(v=>({...v,name:e.target.value}))} style={{...inp,flex:1,padding:"3px 8px",fontSize:12}} /><button onClick={saveSubName} style={accentBtn}>保存</button><button onClick={()=>setEditSub(null)} style={grayBtn}>×</button></>
                ):(
                  <><span style={{flex:1,fontSize:13}}>{s.name}</span><button onClick={()=>setEditSub({catId:cat.id,subId:s.id,name:s.name})} style={grayBtn}>編集</button><button onClick={()=>delSub(cat.id,s.id)} style={redBtn}>×</button></>
                )}
              </div>
            ))}
            {addSub===cat.id?(
              <div style={{ display:"flex", gap:6, marginTop:6 }}>
                <input placeholder="小カテゴリ名" value={newSubName} onChange={e=>setNewSubName(e.target.value)} style={{...inp,flex:1,padding:"4px 8px",fontSize:12}} />
                <button onClick={()=>addSubCat(cat.id)} style={accentBtn}>追加</button>
                <button onClick={()=>setAddSub(null)} style={grayBtn}>×</button>
              </div>
            ):(
              <button onClick={()=>{setAddSub(cat.id);setNewSubName("");}} style={{ background:"none", border:`1px dashed ${C.border}`, color:C.muted, fontSize:11, borderRadius:6, padding:"3px 10px", cursor:"pointer", marginTop:4 }}>
                ＋ 小カテゴリを追加
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ══ ボトムナビ（鉛筆＋日付）════════════════════════════
function BottomNav({ tab, setTab, todayStr }) {
  const TABS = [
    { id:"record",   label:"記録",      icon:(a)=>(
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?"#6366F1":"#9098B1"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        <span style={{ fontSize:9, color:a?"#6366F1":"#9098B1", fontWeight:700, lineHeight:1 }}>{todayStr}</span>
      </div>
    )},
    { id:"budget",   label:"予算",      icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#6366F1":"#9098B1"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> },
    { id:"calendar", label:"カレンダー", icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#6366F1":"#9098B1"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
    { id:"settings", label:"設定",      icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#6366F1":"#9098B1"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", boxShadow:"0 -2px 12px rgba(0,0,0,0.06)" }}>
      {TABS.map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, padding:"10px 0 14px", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
          {t.icon(tab===t.id)}
          <span style={{ fontSize:10, color:tab===t.id?C.accent:C.muted, fontWeight:tab===t.id?700:400 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

const inp = { background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, padding:"9px 12px", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box" };
const accentBtn = { background:C.accent, border:"none", borderRadius:7, color:"#fff", padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:600 };
const grayBtn   = { background:C.bg, border:`1px solid ${C.border}`, borderRadius:7, color:C.muted, padding:"5px 10px", cursor:"pointer", fontSize:11 };
const redBtn    = { background:"#FEF2F2", border:`1px solid #FECACA`, borderRadius:7, color:C.red, padding:"5px 10px", cursor:"pointer", fontSize:11 };
function FRow({ label, children }) { return <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:10 }}><label style={{ fontSize:12, color:C.muted, width:76, flexShrink:0, paddingTop:10 }}>{label}</label>{children}</div>; }
function Placeholder({ text }) { return <div style={{ textAlign:"center", color:C.muted, fontSize:13, padding:"40px 0" }}>{text}</div>; }
