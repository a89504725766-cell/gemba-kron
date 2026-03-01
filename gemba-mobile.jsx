import { useState, useEffect, useCallback, useRef } from "react";

// ─── PALETTE ───────────────────────────────────────────────────────────────
const C = {
  bg: "#0f172a", sidebar: "#111827", card: "#1e293b", cardAlt: "#273548",
  border: "#334155", text: "#e2e8f0", dim: "#94a3b8", white: "#f8fafc",
  acc: "#38bdf8", acc2: "#818cf8", green: "#4ade80", red: "#f87171",
  yellow: "#fbbf24", orange: "#fb923c",
};

// ─── DATA ──────────────────────────────────────────────────────────────────
const STATIONS = [
  { id: "cut",   name: "Раскрой / ЧПУ",   icon: "⚙️", checks: ["Нестинг (% листа)", "Переналадка", "Простои", "Инструмент", "ПО"] },
  { id: "weld",  name: "Сварка / Гибка",   icon: "🔥", checks: ["Швы", "Кондукторы", "СИЗ", "Стандарты", "Переделки"] },
  { id: "paint", name: "Покраска",          icon: "🎨", checks: ["Загрузка камеры", "Подготовка", "DFT", "Дефекты", "Цикл"] },
  { id: "wood",  name: "Дерево",            icon: "🪵", checks: ["Влажность", "Кромка", "Пыль", "Распил", "Хранение"] },
  { id: "assy",  name: "Сборка",            icon: "🔧", checks: ["Инструкции", "Комплектация", "Поиск", "Финиш", "Упаковка"] },
  { id: "store", name: "Склад",             icon: "📦", checks: ["Маркировка", "FIFO", "5S", "Время поиска", "Учёт"] },
];

const S5 = ["Сортировка", "Систематизация", "Содержание", "Стандартизация", "Совершенствование"];

const OWNER_Q = [
  { q: "Кто создавал ЭВО? Внешний консультант?",            cat: "ЭВО",    role: "owner" },
  { q: "Что уже работает? Какие ритмы запущены?",           cat: "ЭВО",    role: "owner" },
  { q: "Где главная боль — в чём «пожары»?",               cat: "ЭВО",    role: "owner" },
  { q: "EVOХXI — что конкретно имеется в виду?",            cat: "Продукт", role: "owner" },
  { q: "Lead time заказа от получения до отгрузки?",        cat: "Произв.", role: "analyst" },
  { q: "% брака / переделок за последний месяц?",           cat: "Произв.", role: "analyst" },
  { q: "ИТ-системы (1С, Базис, Компас, другие)?",           cat: "ИТ",     role: "owner" },
  { q: "Цифровой учёт производства? Wi-Fi в цехе?",         cat: "AI",     role: "analyst" },
  { q: "Что автоматизировать / оцифровать первым?",         cat: "AI",     role: "owner" },
  { q: "Бюджет на трансформацию (порядок цифр)?",          cat: "₽",      role: "owner" },
];

const TRI_TOPICS = ["Узкое место", "Качество / брак", "Сроки заказов", "Героизм", "Планирование", "ИТ / информация", "Безопасность", "Мотивация"];

const RPA_CAT = [
  "Клиенты", "Безопасность / порядок", "Визуальное управление",
  "Планирование", "Пространство / потоки", "Запасы / НЗП",
  "Команда / мотивация", "Оборудование", "Вариабельность",
  "Цепь поставок", "Качество",
];

const SECTIONS = [
  { id: "home",    icon: "🏠", label: "Обзор" },
  { id: "owner",   icon: "👔", label: "Собственник" },
  { id: "station", icon: "🏭", label: "Станции" },
  { id: "workers", icon: "👷", label: "Рабочие" },
  { id: "tri",     icon: "🔺", label: "Триангуляция" },
  { id: "rpa",     icon: "📊", label: "RPA" },
  { id: "actions", icon: "✅", label: "Действия" },
  { id: "export",  icon: "📄", label: "Экспорт PDF" },
];

const STORAGE_KEY = "gemba_kron_v1";

// ─── STORAGE ───────────────────────────────────────────────────────────────
async function loadData() {
  try {
    const r = await window.storage.get(STORAGE_KEY);
    return r ? JSON.parse(r.value) : {};
  } catch { return {}; }
}
async function saveData(d) {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(d)); } catch {}
}

// ─── SMALL COMPONENTS ──────────────────────────────────────────────────────
function TA({ value, onChange, placeholder, rows = 2 }) {
  return (
    <textarea
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%", padding: "10px 12px", borderRadius: 8,
        border: `1.5px solid ${C.border}`, fontSize: 14,
        background: C.cardAlt, color: C.text, boxSizing: "border-box",
        resize: "vertical", lineHeight: 1.55, fontFamily: "inherit",
        minHeight: 40, outline: "none", transition: "border .15s",
      }}
      onFocus={e => e.target.style.borderColor = C.acc}
      onBlur={e => e.target.style.borderColor = C.border}
    />
  );
}

function RoleBadge({ role }) {
  const map = { owner: ["👔", "Собственник", "#7c3aed"], analyst: ["🔍", "Аналитик", "#0369a1"] };
  const [ico, lbl, bg] = map[role] || ["?", role, C.dim];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px",
      borderRadius:12, fontSize:11, fontWeight:700, background:`${bg}33`, color:"#c4b5fd",
      border:`1px solid ${bg}55`, marginBottom:6 }}>
      {ico} {lbl}
    </span>
  );
}

function Score5({ value, onChange }) {
  const cols = [null, C.red, C.orange, C.yellow, "#a3e635", C.green];
  return (
    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
      {[1,2,3,4,5].map(v => (
        <button key={v} onClick={() => onChange(value === v ? null : v)} style={{
          width:34, height:34, borderRadius:"50%", border:`2px solid ${value===v ? cols[v] : C.border}`,
          cursor:"pointer", fontSize:13, fontWeight:700, transition:"all .15s",
          background: value===v ? cols[v] : C.cardAlt, color: value===v ? C.bg : C.dim,
        }}>{v}</button>
      ))}
      {value && <span style={{ fontSize:12, color:C.dim }}>= {["","плохо","слабо","средне","хорошо","отлично"][value]}</span>}
    </div>
  );
}

function Score11({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
      {Array.from({length:11},(_,i)=>i+1).map(v=>(
        <button key={v} onClick={()=>onChange(value===v?null:v)} style={{
          width:36, height:36, borderRadius:8, border:`1.5px solid ${value===v?(v<=4?C.red:v<=7?C.yellow:C.green):C.border}`,
          cursor:"pointer", fontSize:13, fontWeight:700, transition:"all .15s",
          background: value===v?(v<=4?C.red:v<=7?C.yellow:C.green):C.cardAlt,
          color: value===v?C.bg:C.dim,
        }}>{v}</button>
      ))}
    </div>
  );
}

function Accordion({ title, icon, badge, children, defaultOpen=false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:12, marginBottom:8, overflow:"hidden" }}>
      <div onClick={()=>setOpen(!open)} style={{
        display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
        cursor:"pointer", background:C.card, userSelect:"none",
        transition:"background .15s",
      }}>
        <span style={{fontSize:20}}>{icon}</span>
        <span style={{flex:1, fontWeight:700, fontSize:15, color:C.white}}>{title}</span>
        {badge && <span style={{fontSize:12, padding:"2px 8px", borderRadius:10, background:C.cardAlt, color:C.dim}}>{badge}</span>}
        <span style={{color:C.dim, fontSize:18, transform:open?"rotate(90deg)":"none", transition:"transform .2s"}}>›</span>
      </div>
      {open && <div style={{padding:"14px 16px", background:C.cardAlt}}>{children}</div>}
    </div>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{marginBottom:20}}>
      <h2 style={{margin:0, fontSize:22, fontWeight:800, color:C.white}}>{children}</h2>
      {sub && <p style={{margin:"4px 0 0", fontSize:13, color:C.dim}}>{sub}</p>}
    </div>
  );
}

function Card({ children, accent, style={} }) {
  return (
    <div style={{
      background:C.card, borderRadius:12, padding:"16px 20px", marginBottom:14,
      borderLeft: accent ? `4px solid ${accent}` : "none", ...style
    }}>{children}</div>
  );
}

// ─── SECTIONS ──────────────────────────────────────────────────────────────
function HomeSection() {
  return (
    <>
      <SectionTitle sub="Визит на производство КРОН / ЭВО">🏠 Обзор и план дня</SectionTitle>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14}}>
        {[
          [C.acc, "Цели", ["Понять AS-IS производства","Измерить разрыв ЭВО vs реальность","Найти точку входа AI","Оценка зрелости (RPA)","Голос собственника + рабочих"]],
          [C.acc2, "Роли", ["👔 Собственник — стратегия, ЭВО, бюджет","🔍 Аналитик — станции, RPA, данные","🏭 Мастер — наблюдение на ходу","👷 Рабочий — 3 вопроса, 2 мин"]],
        ].map(([col, ttl, items]) => (
          <Card key={ttl} accent={col}>
            <p style={{margin:"0 0 8px", fontWeight:700, color:C.white, fontSize:15}}>{ttl}</p>
            {items.map((it,i)=><p key={i} style={{margin:"4px 0", fontSize:13, color:C.text}}>{it}</p>)}
          </Card>
        ))}
      </div>
      <Card accent={C.yellow}>
        <p style={{margin:"0 0 6px", fontWeight:700, color:C.white}}>📅 Расписание</p>
        <div style={{display:"grid", gridTemplateColumns:"80px 1fr", gap:"4px 12px"}}>
          {[
            ["09:00–10:00","Встреча с собственником"],
            ["10:00–10:30","Обзорный обход"],
            ["10:30–12:00","Круг Оно × 5 станций"],
            ["12:00–12:30","Перерыв + записи"],
            ["12:30–13:30","Беседы с рабочими (3–5 чел)"],
            ["13:30–14:00","Склад, ОТК, офис"],
            ["14:00–14:30","Документы и артефакты"],
            ["14:30–15:30","Дебриф с командой"],
          ].map(([t,task],i)=>(
            <>
              <code key={`t${i}`} style={{fontSize:11, color:C.yellow, fontWeight:700, lineHeight:1.8}}>{t}</code>
              <span key={`d${i}`} style={{fontSize:13, color:C.text, lineHeight:1.8}}>{task}</span>
            </>
          ))}
        </div>
      </Card>
      <Card accent={C.red}>
        <p style={{margin:"0 0 4px", fontWeight:700, color:C.white}}>⚠️ Памятка</p>
        <p style={{margin:0, fontSize:13, color:C.text, lineHeight:1.6}}>
          <b style={{color:C.white}}>ЭВО</b> = внутренняя управленческая система «Крон» (не внешний консалтинг).<br/>
          <b style={{color:C.white}}>Презентация = ЦЕЛЕВОЕ состояние.</b> Сейчас = «пожары и героизм». Задача — измерить разрыв.
        </p>
      </Card>
    </>
  );
}

function OwnerSection({ d, set }) {
  return (
    <>
      <SectionTitle sub="Вопросы для встречи с руководством (09:00–10:00)">👔 Встреча с собственником</SectionTitle>
      {OWNER_Q.map((item,i)=>(
        <Card key={i}>
          <RoleBadge role={item.role} />
          <span style={{display:"inline-block", marginLeft:6, padding:"2px 8px", borderRadius:10,
            fontSize:11, background:`${C.acc}22`, color:C.acc, border:`1px solid ${C.acc}44`}}>{item.cat}</span>
          <p style={{margin:"6px 0 8px", fontWeight:600, fontSize:14, color:C.white}}>{item.q}</p>
          <TA value={d.oa?.[i]} onChange={v=>set({...d, oa:{...d.oa,[i]:v}})} placeholder="Ответ / цитата..." rows={2}/>
        </Card>
      ))}
      <Card>
        <p style={{margin:"0 0 8px", fontWeight:700, color:C.white}}>📝 Свободные заметки</p>
        <TA value={d.on} onChange={v=>set({...d,on:v})} placeholder="Что запомнилось? Интонация, атмосфера, что не сказано..." rows={4}/>
      </Card>
    </>
  );
}

function StationSection({ d, set }) {
  const upd = (id, key, val) => set({...d, st:{...d.st,[id]:{...d.st?.[id],[key]:val}}});
  const upd2 = (id, key, sub, val) => set({...d, st:{...d.st,[id]:{...d.st?.[id],[key]:{...d.st?.[id]?.[key],[sub]:val}}}});

  return (
    <>
      <SectionTitle sub="Круг Оно — наблюдение на каждой станции (10:30–12:00)">🏭 Станции производства</SectionTitle>
      {STATIONS.map(st=>{
        const sd = d.st?.[st.id] || {};
        const s5avg = S5.reduce((acc,_,i)=>(sd.s5?.[i]||0)+acc,0) / S5.filter((_,i)=>sd.s5?.[i]).length;
        const badge = isNaN(s5avg) ? null : `5S: ${s5avg.toFixed(1)}/5`;
        return (
          <Accordion key={st.id} title={st.name} icon={st.icon} badge={badge}>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
              <div>
                <p style={{margin:"0 0 10px", fontWeight:700, color:C.acc, fontSize:13}}>5S ОЦЕНКА</p>
                {S5.map((s,si)=>(
                  <div key={si} style={{marginBottom:10}}>
                    <p style={{margin:"0 0 4px", fontSize:13, color:C.text, fontWeight:600}}>{si+1}. {s}</p>
                    <Score5 value={sd.s5?.[si]} onChange={v=>upd2(st.id,"s5",si,v)}/>
                  </div>
                ))}
              </div>
              <div>
                <p style={{margin:"0 0 10px", fontWeight:700, color:C.acc, fontSize:13}}>НАБЛЮДЕНИЯ</p>
                {st.checks.map((ch,ci)=>(
                  <div key={ci} style={{marginBottom:8}}>
                    <p style={{margin:"0 0 4px", fontSize:13, color:C.white, fontWeight:600}}>{ch}</p>
                    <TA value={sd.ch?.[ci]} onChange={v=>upd2(st.id,"ch",ci,v)} placeholder="..." rows={1}/>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginTop:12}}>
              <div>
                <p style={{margin:"0 0 4px", fontSize:12, color:C.dim}}>НЗП ДО станции</p>
                <TA value={sd.wb} onChange={v=>upd(st.id,"wb",v)} placeholder="объём / описание" rows={1}/>
              </div>
              <div>
                <p style={{margin:"0 0 4px", fontSize:12, color:C.dim}}>НЗП ПОСЛЕ станции</p>
                <TA value={sd.wa} onChange={v=>upd(st.id,"wa",v)} placeholder="объём / описание" rows={1}/>
              </div>
              <div>
                <p style={{margin:"0 0 4px", fontSize:12, color:C.dim}}>Потери (8 видов)</p>
                <TA value={sd.w} onChange={v=>upd(st.id,"w",v)} placeholder="ожидание, движение, дефекты..." rows={1}/>
              </div>
            </div>
          </Accordion>
        );
      })}
    </>
  );
}

function WorkersSection({ d, set }) {
  const ws = d.ws || [{}];
  const upd = (i,f,v)=>{ const a=[...ws]; a[i]={...a[i],[f]:v}; set({...d,ws:a}); };
  return (
    <>
      <SectionTitle sub="Беседы 3–5 мин. Вопросы: «Что мешает?», «Откуда задания?», «Что бы изменил?»">👷 Беседы с рабочими</SectionTitle>
      <Card accent={C.acc2}>
        <p style={{margin:0, fontSize:13, color:C.text, lineHeight:1.6}}>
          🎯 Цель: треугольник голосов — <b style={{color:C.white}}>собственник ≠ мастер ≠ рабочий</b>.<br/>
          Ищите расхождения. Записывайте дословно — цитаты важнее пересказа.
        </p>
      </Card>
      {ws.map((w,i)=>(
        <Accordion key={i} title={`Рабочий ${i+1}${w.role?` — ${w.role}`:""}`} icon="👷" defaultOpen={i===ws.length-1}>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10}}>
            <div>
              <p style={{margin:"0 0 4px", fontSize:12, color:C.dim}}>Участок / должность</p>
              <input value={w.role||""} onChange={e=>upd(i,"role",e.target.value)} placeholder="напр. сварщик, раскройщик..."
                style={{width:"100%",padding:"8px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,
                  background:C.card,color:C.text,fontSize:14,boxSizing:"border-box",outline:"none"}}/>
            </div>
            <div>
              <p style={{margin:"0 0 4px", fontSize:12, color:C.dim}}>Стаж / контекст</p>
              <input value={w.exp||""} onChange={e=>upd(i,"exp",e.target.value)} placeholder="лет на заводе, откуда пришёл..."
                style={{width:"100%",padding:"8px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,
                  background:C.card,color:C.text,fontSize:14,boxSizing:"border-box",outline:"none"}}/>
            </div>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
            <div>
              <p style={{margin:"0 0 4px", fontSize:12, color:C.red, fontWeight:700}}>❓ Что мешает работать?</p>
              <TA value={w.pain} onChange={v=>upd(i,"pain",v)} placeholder="Цитата или резюме..." rows={3}/>
            </div>
            <div>
              <p style={{margin:"0 0 4px", fontSize:12, color:C.yellow, fontWeight:700}}>📋 Откуда берёте задания?</p>
              <TA value={w.info} onChange={v=>upd(i,"info",v)} placeholder="Бумага, устно, доска, планёрка..." rows={3}/>
            </div>
            <div>
              <p style={{margin:"0 0 4px", fontSize:12, color:C.green, fontWeight:700}}>💡 Что бы изменили?</p>
              <TA value={w.fix} onChange={v=>upd(i,"fix",v)} placeholder="Идеи, предложения..." rows={3}/>
            </div>
          </div>
        </Accordion>
      ))}
      <button onClick={()=>set({...d,ws:[...ws,{}]})} style={{
        width:"100%", padding:14, background:"transparent", border:`2px dashed ${C.border}`,
        borderRadius:12, cursor:"pointer", fontSize:14, color:C.dim, fontWeight:600,
      }}>+ Добавить беседу</button>
    </>
  );
}

function TriSection({ d, set }) {
  return (
    <>
      <SectionTitle sub="Сравниваем: что говорит собственник / рабочие / наблюдение">🔺 Триангуляция данных</SectionTitle>
      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14}}>
        {[["👔",C.acc,"Собственник"],["👷",C.acc2,"Рабочие"],["👁",C.green,"Наблюдение"]].map(([ico,col,lbl])=>(
          <div key={lbl} style={{padding:"10px 14px", borderRadius:10, background:`${col}15`, border:`1px solid ${col}40`, textAlign:"center"}}>
            <span style={{fontSize:20}}>{ico}</span>
            <p style={{margin:"4px 0 0", fontSize:12, fontWeight:700, color:col}}>{lbl}</p>
          </div>
        ))}
      </div>
      {TRI_TOPICS.map((t,i)=>{
        const td = d.tr?.[i]||{};
        const hasGap = td.g;
        return (
          <Accordion key={i} title={t} icon={hasGap?"⚠️":"🔺"} badge={hasGap?"РАЗРЫВ":null}>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10}}>
              {[["👔",C.acc,0],["👷",C.acc2,1],["👁",C.green,2]].map(([ico,col,ci])=>(
                <div key={ci}>
                  <p style={{margin:"0 0 4px", fontSize:12, color:col, fontWeight:700}}>{ico} {["Собственник","Рабочие","Наблюдение"][ci]}</p>
                  <TA value={td[ci]} onChange={v=>set({...d,tr:{...d.tr,[i]:{...td,[ci]:v}}})} placeholder="..." rows={2}/>
                </div>
              ))}
            </div>
            <p style={{margin:"0 0 4px", fontSize:12, color:C.red, fontWeight:700}}>⚡ Есть расхождение / разрыв?</p>
            <TA value={td.g} onChange={v=>set({...d,tr:{...d.tr,[i]:{...td,g:v}}})} placeholder="Описать противоречие..." rows={2}/>
          </Accordion>
        );
      })}
    </>
  );
}

function RPASection({ d, set }) {
  const sc = d.rpa||{};
  const filled = RPA_CAT.filter((_,i)=>sc[i]);
  const total = RPA_CAT.reduce((s,_,i)=>s+(sc[i]||0),0);
  const max = filled.length * 11;
  const pct = max ? Math.round(total/max*100) : 0;
  const grade = total > 88 ? {l:"Высокая зрелость",c:C.green} : total > 66 ? {l:"Средняя",c:C.yellow} : total > 0 ? {l:"Низкая зрелость",c:C.red} : {l:"—",c:C.dim};

  return (
    <>
      <SectionTitle sub="Rapid Plant Assessment · 1 = плохо, 11 = отлично · медиана ~55/121">📊 RPA Оценка завода</SectionTitle>
      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:14}}>
        <Card style={{textAlign:"center", marginBottom:0}}>
          <p style={{margin:"0 0 4px", fontSize:12, color:C.dim}}>Общий балл</p>
          <p style={{margin:0, fontSize:40, fontWeight:900, color:grade.c}}>{total || "—"}</p>
          <p style={{margin:"2px 0 0", fontSize:11, color:C.dim}}>из {filled.length*11} ({filled.length}/11 заполнено)</p>
        </Card>
        <Card style={{textAlign:"center", marginBottom:0}}>
          <p style={{margin:"0 0 4px", fontSize:12, color:C.dim}}>Уровень</p>
          <p style={{margin:0, fontSize:20, fontWeight:800, color:grade.c}}>{grade.l}</p>
          <div style={{marginTop:8, height:8, borderRadius:4, background:C.border}}>
            <div style={{height:8, borderRadius:4, background:grade.c, width:`${pct}%`, transition:"width .3s"}}/>
          </div>
        </Card>
        <Card style={{textAlign:"center", marginBottom:0}}>
          <p style={{margin:"0 0 4px", fontSize:12, color:C.dim}}>Прогресс заполнения</p>
          <p style={{margin:0, fontSize:40, fontWeight:900, color:C.acc}}>{filled.length}<span style={{fontSize:20, color:C.dim}}>/11</span></p>
        </Card>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
        {RPA_CAT.map((cat,i)=>(
          <Card key={i} style={{marginBottom:0}}>
            <p style={{margin:"0 0 8px", fontWeight:700, fontSize:14, color:C.white}}>{cat}</p>
            <Score11 value={sc[i]} onChange={v=>set({...d,rpa:{...sc,[i]:v}})}/>
            <div style={{marginTop:8}}>
              <TA value={d.rpn?.[i]} onChange={v=>set({...d,rpn:{...d.rpn,[i]:v}})} placeholder="Комментарий..." rows={1}/>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function ActionsSection({ d, set }) {
  const acts = d.acts||[{}];
  const upd = (i,f,v)=>{ const a=[...acts]; a[i]={...a[i],[f]:v}; set({...d,acts:a}); };
  const byPriority = (p) => acts.filter(a=>a.p===p&&a.t).length;

  return (
    <>
      <SectionTitle sub="Топ-находки и рекомендации — заполнить в течение 2ч после визита">✅ Действия и выводы</SectionTitle>
      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14}}>
        {[["🔴",C.red,"Высокий",byPriority("high")],["🟡",C.yellow,"Средний",byPriority("mid")],["🟢",C.green,"Низкий",byPriority("low")]].map(([ico,col,lbl,cnt])=>(
          <div key={lbl} style={{padding:"12px 16px", borderRadius:12, background:`${col}15`, border:`1px solid ${col}40`, textAlign:"center"}}>
            <p style={{margin:0, fontSize:24}}>{ico}</p>
            <p style={{margin:"4px 0", fontSize:22, fontWeight:900, color:col}}>{cnt}</p>
            <p style={{margin:0, fontSize:12, color:C.dim}}>{lbl} приоритет</p>
          </div>
        ))}
      </div>
      {acts.map((a,i)=>(
        <Card key={i}>
          <div style={{display:"flex", gap:8, alignItems:"center", marginBottom:10}}>
            <span style={{fontWeight:900, fontSize:20, color:C.dim, minWidth:28}}>#{i+1}</span>
            {[["high","🔴 Высокий",C.red],["mid","🟡 Средний",C.yellow],["low","🟢 Низкий",C.green]].map(([p,lbl,col])=>(
              <button key={p} onClick={()=>upd(i,"p",a.p===p?null:p)} style={{
                padding:"5px 12px", borderRadius:20, border:`1.5px solid ${a.p===p?col:C.border}`,
                background:a.p===p?`${col}25`:"transparent", color:a.p===p?col:C.dim,
                cursor:"pointer", fontSize:12, fontWeight:700, transition:"all .15s",
              }}>{lbl}</button>
            ))}
          </div>
          <TA value={a.t} onChange={v=>upd(i,"t",v)} placeholder="Описание находки / рекомендации..." rows={3}/>
        </Card>
      ))}
      <button onClick={()=>set({...d,acts:[...acts,{}]})} style={{
        width:"100%", padding:14, background:"transparent", border:`2px dashed ${C.border}`,
        borderRadius:12, cursor:"pointer", fontSize:14, color:C.dim, fontWeight:600, marginBottom:14,
      }}>+ Добавить пункт</button>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
        <Card>
          <p style={{margin:"0 0 8px", fontWeight:700, color:C.white}}>🧠 Общие впечатления</p>
          <TA value={d.imp} onChange={v=>set({...d,imp:v})} placeholder="Что запомнилось? Общее ощущение?" rows={4}/>
        </Card>
        <Card>
          <p style={{margin:"0 0 8px", fontWeight:700, color:C.white}}>🚀 Следующие шаги</p>
          <TA value={d.nx} onChange={v=>set({...d,nx:v})} placeholder="Данные запросить? Встреча? Прототип?" rows={4}/>
        </Card>
      </div>
    </>
  );
}

// ─── PDF BUILDER ───────────────────────────────────────────────────────────
function buildPDF(d) {
  const esc = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br/>");
  const row = (label, val, col="#1e293b") => val
    ? `<tr><td style="padding:6px 10px;font-weight:600;color:#94a3b8;font-size:12px;white-space:nowrap;vertical-align:top;width:180px">${label}</td><td style="padding:6px 10px;font-size:13px;color:#1e293b;line-height:1.6">${esc(val)}</td></tr>`
    : "";
  const h2 = t => `<h2 style="margin:28px 0 10px;padding-bottom:6px;border-bottom:2px solid #38bdf8;color:#0f172a;font-size:17px">${t}</h2>`;
  const h3 = t => `<h3 style="margin:16px 0 6px;color:#1e3a5f;font-size:14px">${t}</h3>`;
  const pill = (v,max) => {
    const col = v <= max*0.4 ? "#f87171" : v <= max*0.7 ? "#fbbf24" : "#4ade80";
    return `<span style="display:inline-block;padding:2px 10px;border-radius:10px;background:${col}25;color:${col};border:1px solid ${col};font-weight:700;font-size:13px">${v}/${max}</span>`;
  };

  let body = `<div style="font-family:system-ui,sans-serif;max-width:850px;margin:0 auto;color:#0f172a">`;

  // Header
  body += `<div style="background:linear-gradient(135deg,#0f172a,#1e3a5f);color:white;padding:28px 32px;border-radius:10px;margin-bottom:24px">
    <h1 style="margin:0 0 6px;font-size:24px;letter-spacing:-0.5px">📋 Отчёт Gemba Walk</h1>
    <p style="margin:0;opacity:.7;font-size:14px">КРОН / ЭВО · ${new Date().toLocaleDateString("ru-RU",{day:"2-digit",month:"long",year:"numeric"})}</p>
  </div>`;

  // Owner
  body += h2("1. Встреча с собственником");
  body += `<table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden">`;
  OWNER_Q.forEach((q,i)=>{ body += row(q.q, d.oa?.[i]); });
  if(d.on) body += row("Доп. заметки", d.on);
  body += `</table>`;

  // Stations
  body += h2("2. Станции производства");
  STATIONS.forEach(st=>{
    const sd = d.st?.[st.id];
    if(!sd) return;
    body += h3(`${st.icon} ${st.name}`);
    body += `<table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden;margin-bottom:8px">`;
    const s5v = S5.map((s,i)=>sd.s5?.[i]?`${s}: ${sd.s5[i]}/5`:null).filter(Boolean);
    if(s5v.length) body += row("5S", s5v.join(" · "));
    st.checks.forEach((ch,ci)=>{ body += row(ch, sd.ch?.[ci]); });
    if(sd.wb||sd.wa) body += row("НЗП", [sd.wb&&`До: ${sd.wb}`, sd.wa&&`После: ${sd.wa}`].filter(Boolean).join(" / "));
    if(sd.w) body += row("Потери", sd.w);
    body += `</table>`;
  });

  // Workers
  body += h2("3. Беседы с рабочими");
  (d.ws||[]).forEach((w,i)=>{
    if(!w.role&&!w.pain) return;
    body += h3(`Рабочий ${i+1}${w.role?` (${w.role})`:""}${w.exp?` · ${w.exp}`:""}`);
    body += `<table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden;margin-bottom:8px">`;
    body += row("❓ Что мешает", w.pain);
    body += row("📋 Задания откуда", w.info);
    body += row("💡 Изменил бы", w.fix);
    body += `</table>`;
  });

  // Triangulation
  const hasAnyTri = TRI_TOPICS.some((_,i)=>d.tr?.[i]?.[0]||d.tr?.[i]?.[1]||d.tr?.[i]?.[2]);
  if(hasAnyTri){
    body += h2("4. Триангуляция данных");
    TRI_TOPICS.forEach((t,i)=>{
      const td = d.tr?.[i];
      if(!td?.[0]&&!td?.[1]&&!td?.[2]) return;
      body += h3(t);
      body += `<table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden;margin-bottom:8px">`;
      body += row("👔 Собственник", td[0]);
      body += row("👷 Рабочие", td[1]);
      body += row("👁 Наблюдение", td[2]);
      if(td.g) body += row("⚡ Разрыв", td.g);
      body += `</table>`;
    });
  }

  // RPA
  const sc = d.rpa||{};
  const total = RPA_CAT.reduce((s,_,i)=>s+(sc[i]||0),0);
  const filled = RPA_CAT.filter((_,i)=>sc[i]);
  if(filled.length){
    body += h2("5. RPA — Rapid Plant Assessment");
    body += `<div style="display:flex;gap:16px;margin-bottom:12px">
      <div style="padding:14px 20px;background:#f8fafc;border-radius:10px;text-align:center;min-width:100px">
        <div style="font-size:36px;font-weight:900;color:#0f172a">${total}</div>
        <div style="font-size:11px;color:#94a3b8">из ${filled.length*11}</div>
      </div>
      <div style="padding:14px 20px;background:#f8fafc;border-radius:10px;flex:1">
        <div style="font-size:12px;color:#94a3b8;margin-bottom:6px">По категориям</div>
        ${filled.map((_,ii)=>{const idx=RPA_CAT.findIndex((_,j)=>sc[j]&&!filled.slice(0,ii).includes(RPA_CAT[j]));return "";}).join("")}
        ${RPA_CAT.map((cat,i)=>sc[i]?`<span style="display:inline-flex;align-items:center;gap:4px;margin:3px 4px;font-size:12px"><b>${cat}</b>: ${pill(sc[i],11)}${d.rpn?.[i]?` <span style="color:#64748b">${esc(d.rpn[i])}</span>`:""}</span>`:"").join("")}
      </div>
    </div>`;
  }

  // Actions
  body += h2("6. Топ находки и рекомендации");
  const cols = {high:["🔴","#f87171"],mid:["🟡","#fbbf24"],low:["🟢","#4ade80"]};
  ["high","mid","low"].forEach(p=>{
    const items = (d.acts||[]).filter(a=>a.p===p&&a.t);
    if(!items.length) return;
    const [ico,col] = cols[p];
    items.forEach((a,i)=>{
      body += `<div style="padding:12px 16px;margin-bottom:8px;border-left:4px solid ${col};background:#f8fafc;border-radius:0 8px 8px 0">
        <div style="font-size:12px;color:${col};font-weight:700;margin-bottom:4px">${ico} ${p==="high"?"ВЫСОКИЙ":p==="mid"?"СРЕДНИЙ":"НИЗКИЙ"} ПРИОРИТЕТ</div>
        <div style="font-size:13px;line-height:1.6">${esc(a.t)}</div>
      </div>`;
    });
  });

  if(d.imp||d.nx){
    body += h2("7. Итоги");
    body += `<table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden">`;
    body += row("🧠 Впечатления", d.imp);
    body += row("🚀 Следующие шаги", d.nx);
    body += `</table>`;
  }

  body += `</div>`;
  return body;
}

function ExportSection({ d }) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    const content = buildPDF(d);
    const win = window.open("","_blank");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Gemba Walk — КРОН/ЭВО</title>
      <style>
        body{margin:0;padding:24px 32px;font-family:system-ui,sans-serif;background:#fff}
        @page{margin:20mm;size:A4}
        @media print{body{padding:0}}
      </style>
    </head><body>${content}<script>window.onload=()=>window.print();</scr`+`ipt></body></html>`);
    win.document.close();
  };

  const filled = [
    Object.values(d.oa||{}).some(Boolean),
    Object.keys(d.st||{}).length > 0,
    (d.ws||[]).some(w=>w.pain||w.fix),
    TRI_TOPICS.some((_,i)=>d.tr?.[i]?.[0]),
    Object.keys(d.rpa||{}).length > 0,
    (d.acts||[]).some(a=>a.t),
  ];
  const labels = ["Собственник","Станции","Рабочие","Триангуляция","RPA","Действия"];
  const done = filled.filter(Boolean).length;

  return (
    <>
      <SectionTitle sub="Сгенерировать профессиональный PDF-отчёт">📄 Экспорт в PDF</SectionTitle>
      <Card accent={done===6?C.green:C.yellow}>
        <p style={{margin:"0 0 10px", fontWeight:700, color:C.white, fontSize:15}}>Заполненность отчёта: {done}/6 разделов</p>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8}}>
          {labels.map((l,i)=>(
            <div key={i} style={{display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
              background:filled[i]?`${C.green}15`:`${C.red}10`, borderRadius:8,
              border:`1px solid ${filled[i]?C.green:C.border}`}}>
              <span style={{fontSize:18}}>{filled[i]?"✅":"⬜"}</span>
              <span style={{fontSize:13, color:filled[i]?C.green:C.dim}}>{l}</span>
            </div>
          ))}
        </div>
      </Card>

      <button onClick={handlePrint} style={{
        width:"100%", padding:20, borderRadius:14, border:"none", cursor:"pointer",
        fontSize:17, fontWeight:800, letterSpacing:"0.5px", marginBottom:12,
        background:`linear-gradient(135deg, ${C.acc} 0%, ${C.acc2} 100%)`,
        color:C.bg, boxShadow:`0 4px 24px ${C.acc}44`,
      }}>
        🖨️ ОТКРЫТЬ ПРЕДПРОСМОТР И ПЕЧАТЬ В PDF
      </button>

      <Card>
        <p style={{margin:"0 0 8px", fontWeight:700, color:C.white}}>💡 Как сохранить PDF</p>
        <ol style={{margin:0, paddingLeft:20, color:C.text, fontSize:13, lineHeight:2}}>
          <li>Нажмите кнопку выше — откроется новая вкладка с отчётом</li>
          <li>Автоматически появится диалог печати браузера</li>
          <li>В пункте «Принтер» / «Destination» выберите <b style={{color:C.white}}>«Сохранить как PDF»</b></li>
          <li>Нажмите «Сохранить» — файл скачается на ваш компьютер</li>
        </ol>
      </Card>

      <Card accent={C.acc2}>
        <p style={{margin:"0 0 4px", fontWeight:700, color:C.white}}>🔒 Данные сохранены автоматически</p>
        <p style={{margin:0, fontSize:13, color:C.dim, lineHeight:1.6}}>
          Все заполненные данные автоматически сохраняются в этом браузере. Можно закрыть вкладку, перезагрузить страницу — данные останутся.
        </p>
      </Card>

      <Card>
        <p style={{margin:"0 0 8px", fontWeight:700, color:C.white}}>🌐 Развернуть как веб-приложение на домене</p>
        <p style={{margin:"0 0 10px", fontSize:13, color:C.dim, lineHeight:1.6}}>
          Для работы всей команды с единой базой данных нужно развернуть на хостинге:
        </p>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
          {[
            ["Vercel", "Бесплатный хостинг, деплой за 5 мин", C.acc],
            ["Supabase", "Бесплатная БД PostgreSQL для данных", C.acc2],
            ["GitHub", "Хранение кода, CI/CD автодеплой", C.green],
            ["Next.js", "React-фреймворк для веб-приложения", C.yellow],
          ].map(([name,desc,col])=>(
            <div key={name} style={{padding:"10px 14px", borderRadius:10, background:C.cardAlt, borderLeft:`3px solid ${col}`}}>
              <p style={{margin:"0 0 2px", fontWeight:700, color:C.white, fontSize:13}}>{name}</p>
              <p style={{margin:0, fontSize:11, color:C.dim}}>{desc}</p>
            </div>
          ))}
        </div>
        <p style={{margin:"10px 0 0", fontSize:12, color:C.dim}}>Напишите мне — подготовлю полный код для деплоя на Vercel за несколько шагов.</p>
      </Card>
    </>
  );
}

// ─── APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [section, setSection] = useState("home");
  const [d, setRaw] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");
  const saveTimer = useRef(null);

  useEffect(() => {
    loadData().then(data => { setRaw(data); setLoaded(true); });
  }, []);

  const set = useCallback((newD) => {
    setRaw(newD);
    setSaveStatus("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveData(newD);
      setSaveStatus("saved");
    }, 800);
  }, []);

  if (!loaded) return (
    <div style={{background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center"}}>
      <p style={{color:C.dim, fontSize:16}}>Загрузка данных...</p>
    </div>
  );

  const currentSection = SECTIONS.find(s => s.id === section);

  return (
    <div style={{display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"system-ui,sans-serif", color:C.text}}>
      {/* ── SIDEBAR ── */}
      <div style={{
        width:220, background:C.sidebar, borderRight:`1px solid ${C.border}`,
        display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, bottom:0, zIndex:100,
      }}>
        <div style={{padding:"20px 16px 14px", borderBottom:`1px solid ${C.border}`}}>
          <p style={{margin:0, fontSize:14, fontWeight:900, color:C.white, letterSpacing:"-0.5px"}}>GEMBA · КРОН</p>
          <p style={{margin:"2px 0 0", fontSize:11, color:C.dim}}>Gemba Walk Tool</p>
        </div>
        <nav style={{flex:1, padding:"10px 8px", overflowY:"auto"}}>
          {SECTIONS.map(s=>{
            const active = section===s.id;
            return (
              <button key={s.id} onClick={()=>setSection(s.id)} style={{
                display:"flex", alignItems:"center", gap:10, width:"100%",
                padding:"10px 12px", borderRadius:9, border:"none", cursor:"pointer",
                marginBottom:2, textAlign:"left", transition:"all .15s",
                background: active?"rgba(56,189,248,0.15)":"transparent",
                color: active?C.acc:C.dim, fontWeight: active?700:500, fontSize:14,
              }}>
                <span style={{fontSize:18, minWidth:24}}>{s.icon}</span>
                {s.label}
              </button>
            );
          })}
        </nav>
        <div style={{padding:"12px 16px", borderTop:`1px solid ${C.border}`}}>
          <div style={{display:"flex", alignItems:"center", gap:6}}>
            <div style={{width:8, height:8, borderRadius:"50%", background:saveStatus==="saved"?C.green:C.yellow, flexShrink:0}}/>
            <span style={{fontSize:11, color:C.dim}}>{saveStatus==="saved"?"Данные сохранены":"Сохранение..."}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{marginLeft:220, flex:1, minHeight:"100vh"}}>
        <div style={{
          padding:"16px 32px", borderBottom:`1px solid ${C.border}`,
          background:C.sidebar, position:"sticky", top:0, zIndex:50,
          display:"flex", alignItems:"center", gap:10,
        }}>
          <span style={{fontSize:22}}>{currentSection?.icon}</span>
          <h1 style={{margin:0, fontSize:18, fontWeight:800, color:C.white}}>{currentSection?.label}</h1>
        </div>
        <div style={{padding:"24px 32px", maxWidth:1100}}>
          {section==="home"    && <HomeSection/>}
          {section==="owner"   && <OwnerSection d={d} set={set}/>}
          {section==="station" && <StationSection d={d} set={set}/>}
          {section==="workers" && <WorkersSection d={d} set={set}/>}
          {section==="tri"     && <TriSection d={d} set={set}/>}
          {section==="rpa"     && <RPASection d={d} set={set}/>}
          {section==="actions" && <ActionsSection d={d} set={set}/>}
          {section==="export"  && <ExportSection d={d}/>}
        </div>
      </div>
    </div>
  );
}
