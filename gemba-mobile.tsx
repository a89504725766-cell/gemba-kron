'use client'

import { useState, useEffect, useCallback, useRef } from "react";

// ─── PALETTE ───────────────────────────────────────────────────────────────
const C = {
  bg: "#0f172a", sidebar: "#111827", card: "#1e293b", cardAlt: "#273548",
  border: "#334155", text: "#e2e8f0", dim: "#94a3b8", white: "#f8fafc",
  acc: "#38bdf8", acc2: "#818cf8", green: "#4ade80", red: "#f87171",
  yellow: "#fbbf24", orange: "#fb923c",
};

// ─── STORAGE (localStorage) ────────────────────────────────────────────────
const STORAGE_KEY = "gemba_kron_v1";

function loadData(): Record<string, any> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveData(d: Record<string, any>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {}
}

// ─── RESPONSIVE HOOK ───────────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

// ─── DATA ──────────────────────────────────────────────────────────────────
const STATIONS = [
  { id: "cut",   name: "Раскрой / ЧПУ",  icon: "⚙️", checks: ["Нестинг (% листа)", "Переналадка", "Простои", "Инструмент", "ПО"] },
  { id: "weld",  name: "Сварка / Гибка",  icon: "🔥", checks: ["Швы", "Кондукторы", "СИЗ", "Стандарты", "Переделки"] },
  { id: "paint", name: "Покраска",         icon: "🎨", checks: ["Загрузка камеры", "Подготовка", "DFT", "Дефекты", "Цикл"] },
  { id: "wood",  name: "Дерево",           icon: "🪵", checks: ["Влажность", "Кромка", "Пыль", "Распил", "Хранение"] },
  { id: "assy",  name: "Сборка",           icon: "🔧", checks: ["Инструкции", "Комплектация", "Поиск", "Финиш", "Упаковка"] },
  { id: "store", name: "Склад",            icon: "📦", checks: ["Маркировка", "FIFO", "5S", "Время поиска", "Учёт"] },
];

const S5 = ["Сортировка", "Систематизация", "Содержание", "Стандартизация", "Совершенствование"];

const OWNER_Q = [
  { q: "Кто создавал ЭВО? Внешний консультант?",           cat: "ЭВО",     role: "owner" },
  { q: "Что уже работает? Какие ритмы запущены?",          cat: "ЭВО",     role: "owner" },
  { q: "Где главная боль — в чём «пожары»?",              cat: "ЭВО",     role: "owner" },
  { q: "EVOХXI — что конкретно имеется в виду?",           cat: "Продукт", role: "owner" },
  { q: "Lead time заказа от получения до отгрузки?",       cat: "Произв.", role: "analyst" },
  { q: "% брака / переделок за последний месяц?",          cat: "Произв.", role: "analyst" },
  { q: "ИТ-системы (1С, Базис, Компас, другие)?",          cat: "ИТ",      role: "owner" },
  { q: "Цифровой учёт производства? Wi-Fi в цехе?",        cat: "AI",      role: "analyst" },
  { q: "Что автоматизировать / оцифровать первым?",        cat: "AI",      role: "owner" },
  { q: "Бюджет на трансформацию (порядок цифр)?",         cat: "₽",       role: "owner" },
];

const TRI_TOPICS = [
  "Узкое место", "Качество / брак", "Сроки заказов", "Героизм",
  "Планирование", "ИТ / информация", "Безопасность", "Мотивация",
];

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
  { id: "export",  icon: "📄", label: "PDF" },
];

// ─── SMALL COMPONENTS ──────────────────────────────────────────────────────
function TA({ value, onChange, placeholder, rows = 2 }: any) {
  return (
    <textarea
      value={value || ""}
      onChange={(e: any) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%", padding: "10px 12px", borderRadius: 8,
        border: `1.5px solid ${C.border}`, fontSize: 14,
        background: C.cardAlt, color: C.text, boxSizing: "border-box" as any,
        resize: "vertical" as any, lineHeight: 1.55, fontFamily: "inherit",
        minHeight: 40, outline: "none",
      }}
      onFocus={(e: any) => (e.target.style.borderColor = C.acc)}
      onBlur={(e: any) => (e.target.style.borderColor = C.border)}
    />
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: any = {
    owner:   ["👔", "Собственник", "#7c3aed"],
    analyst: ["🔍", "Аналитик",   "#0369a1"],
  };
  const [ico, lbl, bg] = map[role] || ["?", role, C.dim];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
      background: `${bg}33`, color: "#c4b5fd", border: `1px solid ${bg}55`, marginBottom: 6,
    }}>
      {ico} {lbl}
    </span>
  );
}

function Score5({ value, onChange }: any) {
  const cols = [null, C.red, C.orange, C.yellow, "#a3e635", C.green];
  const labels = ["", "плохо", "слабо", "средне", "хорошо", "отлично"];
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" as any }}>
      {[1, 2, 3, 4, 5].map(v => (
        <button key={v} onClick={() => onChange(value === v ? null : v)} style={{
          width: 34, height: 34, borderRadius: "50%",
          border: `2px solid ${value === v ? cols[v]! : C.border}`,
          cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .15s",
          background: value === v ? cols[v]! : C.cardAlt,
          color: value === v ? C.bg : C.dim,
        }}>{v}</button>
      ))}
      {value && <span style={{ fontSize: 12, color: C.dim }}>= {labels[value]}</span>}
    </div>
  );
}

function Score11({ value, onChange }: any) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as any }}>
      {Array.from({ length: 11 }, (_, i) => i + 1).map(v => (
        <button key={v} onClick={() => onChange(value === v ? null : v)} style={{
          width: 36, height: 36, borderRadius: 8,
          border: `1.5px solid ${value === v ? (v <= 4 ? C.red : v <= 7 ? C.yellow : C.green) : C.border}`,
          cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .15s",
          background: value === v ? (v <= 4 ? C.red : v <= 7 ? C.yellow : C.green) : C.cardAlt,
          color: value === v ? C.bg : C.dim,
        }}>{v}</button>
      ))}
    </div>
  );
}

function Accordion({ title, icon, badge, children, defaultOpen = false }: any) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
        cursor: "pointer", background: C.card, userSelect: "none" as any,
      }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 15, color: C.white }}>{title}</span>
        {badge && (
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: C.cardAlt, color: C.dim }}>
            {badge}
          </span>
        )}
        <span style={{ color: C.dim, fontSize: 18, transform: open ? "rotate(90deg)" : "none", transition: "transform .2s" }}>›</span>
      </div>
      {open && <div style={{ padding: "14px 16px", background: C.cardAlt }}>{children}</div>}
    </div>
  );
}

function SectionTitle({ children, sub }: any) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.white }}>{children}</h2>
      {sub && <p style={{ margin: "4px 0 0", fontSize: 13, color: C.dim, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

function Card({ children, accent, style = {} }: any) {
  return (
    <div style={{
      background: C.card, borderRadius: 12, padding: "14px 16px", marginBottom: 12,
      borderLeft: accent ? `4px solid ${accent}` : "none", ...style,
    }}>{children}</div>
  );
}

// ─── SECTIONS ──────────────────────────────────────────────────────────────
function HomeSection({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      <SectionTitle sub="Визит на производство КРОН / ЭВО">🏠 Обзор и план дня</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {[
          [C.acc, "Цели", ["Понять AS-IS производства", "Измерить разрыв ЭВО vs реальность", "Найти точку входа AI", "Оценка зрелости (RPA)", "Голос собственника + рабочих"]],
          [C.acc2, "Роли", ["👔 Собственник — стратегия, ЭВО, бюджет", "🔍 Аналитик — станции, RPA, данные", "🏭 Мастер — наблюдение на ходу", "👷 Рабочий — 3 вопроса, 2 мин"]],
        ].map(([col, ttl, items]: any) => (
          <Card key={ttl} accent={col}>
            <p style={{ margin: "0 0 8px", fontWeight: 700, color: C.white, fontSize: 14 }}>{ttl}</p>
            {items.map((it: string, i: number) => (
              <p key={i} style={{ margin: "3px 0", fontSize: 13, color: C.text }}>{it}</p>
            ))}
          </Card>
        ))}
      </div>

      <Card accent={C.yellow}>
        <p style={{ margin: "0 0 6px", fontWeight: 700, color: C.white }}>📅 Расписание</p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "72px 1fr" : "90px 1fr", gap: "4px 10px" }}>
          {[
            ["09:00–10:00", "Встреча с собственником"],
            ["10:00–10:30", "Обзорный обход"],
            ["10:30–12:00", "Круг Оно × 5 станций"],
            ["12:00–12:30", "Перерыв + записи"],
            ["12:30–13:30", "Беседы с рабочими"],
            ["13:30–14:00", "Склад, ОТК, офис"],
            ["14:00–14:30", "Документы"],
            ["14:30–15:30", "Дебриф с командой"],
          ].map(([t, task], i) => (
            <>
              <code key={`t${i}`} style={{ fontSize: isMobile ? 10 : 11, color: C.yellow, fontWeight: 700, lineHeight: 1.9 }}>{t}</code>
              <span key={`d${i}`} style={{ fontSize: 13, color: C.text, lineHeight: 1.9 }}>{task}</span>
            </>
          ))}
        </div>
      </Card>

      <Card accent={C.red}>
        <p style={{ margin: "0 0 4px", fontWeight: 700, color: C.white }}>⚠️ Памятка</p>
        <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.6 }}>
          <b style={{ color: C.white }}>ЭВО</b> = внутренняя управленческая система «Крон».<br />
          <b style={{ color: C.white }}>Презентация = ЦЕЛЕВОЕ состояние.</b> Сейчас = «пожары и героизм». Задача — измерить разрыв.
        </p>
      </Card>
    </>
  );
}

function OwnerSection({ d, set }: any) {
  return (
    <>
      <SectionTitle sub="Встреча с руководством (09:00–10:00)">👔 Собственник</SectionTitle>
      {OWNER_Q.map((item, i) => (
        <Card key={i}>
          <RoleBadge role={item.role} />
          <span style={{
            display: "inline-block", marginLeft: 6, padding: "2px 8px", borderRadius: 10,
            fontSize: 11, background: `${C.acc}22`, color: C.acc, border: `1px solid ${C.acc}44`,
          }}>{item.cat}</span>
          <p style={{ margin: "6px 0 8px", fontWeight: 600, fontSize: 14, color: C.white }}>{item.q}</p>
          <TA value={d.oa?.[i]} onChange={(v: string) => set({ ...d, oa: { ...d.oa, [i]: v } })} placeholder="Ответ / цитата..." rows={2} />
        </Card>
      ))}
      <Card>
        <p style={{ margin: "0 0 8px", fontWeight: 700, color: C.white }}>📝 Свободные заметки</p>
        <TA value={d.on} onChange={(v: string) => set({ ...d, on: v })} placeholder="Атмосфера, что не сказано..." rows={4} />
      </Card>
    </>
  );
}

function StationSection({ d, set, isMobile }: any) {
  const upd = (id: string, key: string, val: any) =>
    set({ ...d, st: { ...d.st, [id]: { ...d.st?.[id], [key]: val } } });
  const upd2 = (id: string, key: string, sub: any, val: any) =>
    set({ ...d, st: { ...d.st, [id]: { ...d.st?.[id], [key]: { ...d.st?.[id]?.[key], [sub]: val } } } });

  return (
    <>
      <SectionTitle sub="Круг Оно (10:30–12:00)">🏭 Станции производства</SectionTitle>
      {STATIONS.map(st => {
        const sd = d.st?.[st.id] || {};
        const cnt = S5.filter((_, i) => sd.s5?.[i]).length;
        const avg = cnt ? (S5.reduce((a, _, i) => a + (sd.s5?.[i] || 0), 0) / cnt).toFixed(1) : null;
        return (
          <Accordion key={st.id} title={st.name} icon={st.icon} badge={avg ? `5S: ${avg}/5` : null}>
            {/* 5S + Наблюдения: 2 col desktop, 1 col mobile */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              <div>
                <p style={{ margin: "0 0 10px", fontWeight: 700, color: C.acc, fontSize: 12 }}>5S ОЦЕНКА</p>
                {S5.map((s, si) => (
                  <div key={si} style={{ marginBottom: 10 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 13, color: C.text, fontWeight: 600 }}>{si + 1}. {s}</p>
                    <Score5 value={sd.s5?.[si]} onChange={(v: any) => upd2(st.id, "s5", si, v)} />
                  </div>
                ))}
              </div>
              <div>
                <p style={{ margin: "0 0 10px", fontWeight: 700, color: C.acc, fontSize: 12 }}>НАБЛЮДЕНИЯ</p>
                {st.checks.map((ch: string, ci: number) => (
                  <div key={ci} style={{ marginBottom: 8 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 13, color: C.white, fontWeight: 600 }}>{ch}</p>
                    <TA value={sd.ch?.[ci]} onChange={(v: string) => upd2(st.id, "ch", ci, v)} placeholder="..." rows={1} />
                  </div>
                ))}
              </div>
            </div>
            {/* НЗП + Потери: 3 col desktop, 1 col mobile */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
              {[["wb", "НЗП ДО"], ["wa", "НЗП ПОСЛЕ"], ["w", "Потери (8 видов)"]].map(([key, lbl]) => (
                <div key={key}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: C.dim }}>{lbl}</p>
                  <TA value={sd[key]} onChange={(v: string) => upd(st.id, key, v)} placeholder="..." rows={1} />
                </div>
              ))}
            </div>
          </Accordion>
        );
      })}
    </>
  );
}

function WorkersSection({ d, set, isMobile }: any) {
  const ws = d.ws || [{}];
  const upd = (i: number, f: string, v: any) => {
    const a = [...ws]; a[i] = { ...a[i], [f]: v }; set({ ...d, ws: a });
  };
  return (
    <>
      <SectionTitle sub="Беседы 3–5 мин. «Что мешает?», «Откуда задания?», «Что бы изменил?»">👷 Рабочие</SectionTitle>
      <Card accent={C.acc2}>
        <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.6 }}>
          🎯 Ищите расхождения: <b style={{ color: C.white }}>собственник ≠ мастер ≠ рабочий</b>. Записывайте дословно.
        </p>
      </Card>
      {ws.map((w: any, i: number) => (
        <Accordion key={i} title={`Рабочий ${i + 1}${w.role ? ` — ${w.role}` : ""}`} icon="👷" defaultOpen={i === ws.length - 1}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 10 }}>
            {[["role", "Участок / должность", "сварщик, раскройщик..."], ["exp", "Стаж / контекст", "лет на заводе..."]].map(([f, lbl, ph]) => (
              <div key={f}>
                <p style={{ margin: "0 0 4px", fontSize: 12, color: C.dim }}>{lbl}</p>
                <input
                  value={(w as any)[f] || ""}
                  onChange={(e: any) => upd(i, f as string, e.target.value)}
                  placeholder={ph as string}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: 8,
                    border: `1.5px solid ${C.border}`, background: C.card,
                    color: C.text, fontSize: 14, boxSizing: "border-box" as any, outline: "none",
                  }}
                />
              </div>
            ))}
          </div>
          {/* 3 col desktop → 1 col mobile */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10 }}>
            {[
              ["pain", C.red,    "❓ Что мешает?",      "Цитата или резюме..."],
              ["info", C.yellow, "📋 Задания откуда?",  "Бумага, устно, доска..."],
              ["fix",  C.green,  "💡 Что изменили бы?", "Идеи, предложения..."],
            ].map(([f, col, lbl, ph]) => (
              <div key={f as string}>
                <p style={{ margin: "0 0 4px", fontSize: 12, color: col as string, fontWeight: 700 }}>{lbl as string}</p>
                <TA value={(w as any)[f as string]} onChange={(v: string) => upd(i, f as string, v)} placeholder={ph as string} rows={3} />
              </div>
            ))}
          </div>
        </Accordion>
      ))}
      <button
        onClick={() => set({ ...d, ws: [...ws, {}] })}
        style={{
          width: "100%", padding: 14, background: "transparent",
          border: `2px dashed ${C.border}`, borderRadius: 12,
          cursor: "pointer", fontSize: 14, color: C.dim, fontWeight: 600,
        }}
      >+ Добавить беседу</button>
    </>
  );
}

function TriSection({ d, set, isMobile }: any) {
  return (
    <>
      <SectionTitle sub="Собственник / рабочие / наблюдение — ищем противоречия">🔺 Триангуляция</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
        {[["👔", C.acc, "Собственник"], ["👷", C.acc2, "Рабочие"], ["👁", C.green, "Наблюдение"]].map(([ico, col, lbl]) => (
          <div key={lbl as string} style={{ padding: "8px 10px", borderRadius: 10, background: `${col}15`, border: `1px solid ${col}40`, textAlign: "center" as any }}>
            <span style={{ fontSize: 18 }}>{ico as string}</span>
            <p style={{ margin: "3px 0 0", fontSize: isMobile ? 10 : 12, fontWeight: 700, color: col as string }}>{lbl as string}</p>
          </div>
        ))}
      </div>
      {TRI_TOPICS.map((t, i) => {
        const td = d.tr?.[i] || {};
        return (
          <Accordion key={i} title={t} icon={td.g ? "⚠️" : "🔺"} badge={td.g ? "РАЗРЫВ" : null}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[["👔", C.acc, 0, "Собственник"], ["👷", C.acc2, 1, "Рабочие"], ["👁", C.green, 2, "Наблюдение"]].map(([ico, col, ci, lbl]) => (
                <div key={ci as number}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: col as string, fontWeight: 700 }}>{ico as string} {lbl as string}</p>
                  <TA
                    value={td[ci as number]}
                    onChange={(v: string) => set({ ...d, tr: { ...d.tr, [i]: { ...td, [ci as number]: v } } })}
                    placeholder="..." rows={2}
                  />
                </div>
              ))}
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: C.red, fontWeight: 700 }}>⚡ Есть расхождение / разрыв?</p>
            <TA value={td.g} onChange={(v: string) => set({ ...d, tr: { ...d.tr, [i]: { ...td, g: v } } })} placeholder="Описать противоречие..." rows={2} />
          </Accordion>
        );
      })}
    </>
  );
}

function RPASection({ d, set, isMobile }: any) {
  const sc = d.rpa || {};
  const filled = RPA_CAT.filter((_, i) => sc[i]);
  const total = RPA_CAT.reduce((s, _, i) => s + (sc[i] || 0), 0);
  const max = filled.length * 11;
  const pct = max ? Math.round(total / max * 100) : 0;
  const grade = total > 88 ? { l: "Высокая зрелость", c: C.green }
    : total > 66 ? { l: "Средняя", c: C.yellow }
    : total > 0  ? { l: "Низкая зрелость", c: C.red }
    : { l: "—", c: C.dim };

  return (
    <>
      <SectionTitle sub="Rapid Plant Assessment · 1 = плохо, 11 = отлично">📊 RPA Оценка завода</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
        <Card style={{ textAlign: "center", marginBottom: 0 }}>
          <p style={{ margin: "0 0 2px", fontSize: 11, color: C.dim }}>Балл</p>
          <p style={{ margin: 0, fontSize: 36, fontWeight: 900, color: grade.c }}>{total || "—"}</p>
          <p style={{ margin: "2px 0 0", fontSize: 10, color: C.dim }}>{filled.length}/11 заполнено</p>
        </Card>
        <Card style={{ textAlign: "center", marginBottom: 0 }}>
          <p style={{ margin: "0 0 2px", fontSize: 11, color: C.dim }}>Уровень</p>
          <p style={{ margin: 0, fontSize: isMobile ? 15 : 18, fontWeight: 800, color: grade.c }}>{grade.l}</p>
          <div style={{ marginTop: 8, height: 6, borderRadius: 4, background: C.border }}>
            <div style={{ height: 6, borderRadius: 4, background: grade.c, width: `${pct}%`, transition: "width .3s" }} />
          </div>
        </Card>
        {!isMobile && (
          <Card style={{ textAlign: "center", marginBottom: 0 }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, color: C.dim }}>Заполнено</p>
            <p style={{ margin: 0, fontSize: 36, fontWeight: 900, color: C.acc }}>{filled.length}<span style={{ fontSize: 18, color: C.dim }}>/11</span></p>
          </Card>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        {RPA_CAT.map((cat, i) => (
          <Card key={i} style={{ marginBottom: 0 }}>
            <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 13, color: C.white }}>{cat}</p>
            <Score11 value={sc[i]} onChange={(v: any) => set({ ...d, rpa: { ...sc, [i]: v } })} />
            <div style={{ marginTop: 8 }}>
              <TA value={d.rpn?.[i]} onChange={(v: string) => set({ ...d, rpn: { ...d.rpn, [i]: v } })} placeholder="Комментарий..." rows={1} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function ActionsSection({ d, set, isMobile }: any) {
  const acts = d.acts || [{}];
  const upd = (i: number, f: string, v: any) => { const a = [...acts]; a[i] = { ...a[i], [f]: v }; set({ ...d, acts: a }); };
  const cnt = (p: string) => acts.filter((a: any) => a.p === p && a.t).length;

  return (
    <>
      <SectionTitle sub="Топ-находки — заполнить в течение 2ч после визита">✅ Действия и выводы</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
        {[["🔴", C.red, "Высокий", "high"], ["🟡", C.yellow, "Средний", "mid"], ["🟢", C.green, "Низкий", "low"]].map(([ico, col, lbl, p]) => (
          <div key={p as string} style={{ padding: "10px", borderRadius: 12, background: `${col}15`, border: `1px solid ${col}40`, textAlign: "center" as any }}>
            <p style={{ margin: 0, fontSize: 20 }}>{ico as string}</p>
            <p style={{ margin: "2px 0", fontSize: 20, fontWeight: 900, color: col as string }}>{cnt(p as string)}</p>
            <p style={{ margin: 0, fontSize: isMobile ? 10 : 12, color: C.dim }}>{lbl as string}</p>
          </div>
        ))}
      </div>
      {acts.map((a: any, i: number) => (
        <Card key={i}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10, flexWrap: "wrap" as any }}>
            <span style={{ fontWeight: 900, fontSize: 18, color: C.dim, minWidth: 26 }}>#{i + 1}</span>
            {[["high", "🔴 Высокий", C.red], ["mid", "🟡 Средний", C.yellow], ["low", "🟢 Низкий", C.green]].map(([p, lbl, col]) => (
              <button key={p as string} onClick={() => upd(i, "p", a.p === p ? null : p)} style={{
                padding: "4px 10px", borderRadius: 20,
                border: `1.5px solid ${a.p === p ? col : C.border}`,
                background: a.p === p ? `${col}25` : "transparent",
                color: a.p === p ? col as string : C.dim,
                cursor: "pointer", fontSize: 12, fontWeight: 700,
              }}>{lbl as string}</button>
            ))}
          </div>
          <TA value={a.t} onChange={(v: string) => upd(i, "t", v)} placeholder="Описание находки / рекомендации..." rows={3} />
        </Card>
      ))}
      <button onClick={() => set({ ...d, acts: [...acts, {}] })} style={{
        width: "100%", padding: 12, background: "transparent", border: `2px dashed ${C.border}`,
        borderRadius: 12, cursor: "pointer", fontSize: 14, color: C.dim, fontWeight: 600, marginBottom: 12,
      }}>+ Добавить пункт</button>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        <Card>
          <p style={{ margin: "0 0 8px", fontWeight: 700, color: C.white }}>🧠 Впечатления</p>
          <TA value={d.imp} onChange={(v: string) => set({ ...d, imp: v })} placeholder="Что запомнилось?" rows={4} />
        </Card>
        <Card>
          <p style={{ margin: "0 0 8px", fontWeight: 700, color: C.white }}>🚀 Следующие шаги</p>
          <TA value={d.nx} onChange={(v: string) => set({ ...d, nx: v })} placeholder="Данные, встреча, прототип?" rows={4} />
        </Card>
      </div>
    </>
  );
}

// ─── PDF ───────────────────────────────────────────────────────────────────
function buildPDF(d: any) {
  const esc = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
  const row = (label: string, val: any) => val
    ? `<tr><td style="padding:6px 10px;font-weight:600;color:#64748b;font-size:12px;white-space:nowrap;vertical-align:top;width:190px;border-bottom:1px solid #e2e8f0">${label}</td><td style="padding:6px 10px;font-size:13px;color:#0f172a;line-height:1.6;border-bottom:1px solid #e2e8f0">${esc(val)}</td></tr>`
    : "";
  const h2 = (t: string) => `<h2 style="margin:28px 0 10px;padding-bottom:6px;border-bottom:3px solid #38bdf8;color:#0f172a;font-size:17px">${t}</h2>`;
  const h3 = (t: string) => `<h3 style="margin:14px 0 6px;color:#1e3a5f;font-size:14px">${t}</h3>`;
  const tbl = (rows: string) => `<table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden;margin-bottom:10px">${rows}</table>`;

  let body = `<div style="font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;color:#0f172a">`;

  body += `<div style="background:linear-gradient(135deg,#0f172a,#1e3a5f);color:white;padding:28px 32px;border-radius:10px;margin-bottom:24px">
    <h1 style="margin:0 0 6px;font-size:24px">📋 Отчёт Gemba Walk — КРОН / ЭВО</h1>
    <p style="margin:0;opacity:.7;font-size:14px">${new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}</p>
  </div>`;

  body += h2("1. Встреча с собственником");
  body += tbl(OWNER_Q.map((q, i) => row(q.q, d.oa?.[i])).join("") + row("Доп. заметки", d.on));

  body += h2("2. Станции производства");
  STATIONS.forEach(st => {
    const sd = d.st?.[st.id]; if (!sd) return;
    body += h3(`${st.icon} ${st.name}`);
    const s5r = S5.map((s, i) => sd.s5?.[i] ? `${s}: ${sd.s5[i]}/5` : null).filter(Boolean).join(" · ");
    body += tbl([
      s5r ? row("5S", s5r) : "",
      ...st.checks.map((ch: string, ci: number) => row(ch, sd.ch?.[ci])),
      row("НЗП", [sd.wb && `До: ${sd.wb}`, sd.wa && `После: ${sd.wa}`].filter(Boolean).join(" / ")),
      row("Потери", sd.w),
    ].join(""));
  });

  body += h2("3. Беседы с рабочими");
  (d.ws || []).forEach((w: any, i: number) => {
    if (!w.role && !w.pain) return;
    body += h3(`Рабочий ${i + 1}${w.role ? ` (${w.role})` : ""}${w.exp ? ` · ${w.exp}` : ""}`);
    body += tbl([row("❓ Что мешает", w.pain), row("📋 Задания откуда", w.info), row("💡 Изменил бы", w.fix)].join(""));
  });

  const hasAnyTri = TRI_TOPICS.some((_, i) => d.tr?.[i]?.[0] || d.tr?.[i]?.[1] || d.tr?.[i]?.[2]);
  if (hasAnyTri) {
    body += h2("4. Триангуляция данных");
    TRI_TOPICS.forEach((t, i) => {
      const td = d.tr?.[i]; if (!td?.[0] && !td?.[1] && !td?.[2]) return;
      body += h3(t);
      body += tbl([row("👔 Собственник", td[0]), row("👷 Рабочие", td[1]), row("👁 Наблюдение", td[2]), row("⚡ Разрыв", td.g)].join(""));
    });
  }

  const sc = d.rpa || {};
  const filled = RPA_CAT.filter((_, i) => sc[i]);
  if (filled.length) {
    const total = RPA_CAT.reduce((s, _, i) => s + (sc[i] || 0), 0);
    body += h2("5. RPA — Rapid Plant Assessment");
    body += `<p style="font-size:14px;margin-bottom:8px">Общий балл: <b>${total}/${filled.length * 11}</b></p>`;
    body += tbl(RPA_CAT.map((cat, i) => sc[i] ? row(cat, `${sc[i]}/11${d.rpn?.[i] ? ` — ${d.rpn[i]}` : ""}`) : "").join(""));
  }

  body += h2("6. Топ находки и рекомендации");
  const prColors: any = { high: ["🔴", "#f87171"], mid: ["🟡", "#fbbf24"], low: ["🟢", "#4ade80"] };
  const prNames: any = { high: "ВЫСОКИЙ", mid: "СРЕДНИЙ", low: "НИЗКИЙ" };
  ["high", "mid", "low"].forEach(p => {
    (d.acts || []).filter((a: any) => a.p === p && a.t).forEach((a: any) => {
      const [ico, col] = prColors[p];
      body += `<div style="padding:12px 16px;margin-bottom:8px;border-left:4px solid ${col};background:#f8fafc;border-radius:0 8px 8px 0">
        <div style="font-size:11px;color:${col};font-weight:700;margin-bottom:4px">${ico} ${prNames[p]} ПРИОРИТЕТ</div>
        <div style="font-size:13px;line-height:1.6">${esc(a.t)}</div>
      </div>`;
    });
  });

  if (d.imp || d.nx) {
    body += h2("7. Итоги");
    body += tbl([row("🧠 Впечатления", d.imp), row("🚀 Следующие шаги", d.nx)].join(""));
  }

  body += `</div>`;
  return body;
}

function ExportSection({ d, isMobile }: any) {
  const handlePrint = () => {
    const content = buildPDF(d);
    const win = window.open("", "_blank")!;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Gemba Walk — КРОН/ЭВО</title>
      <style>
        body{margin:0;padding:24px 32px;font-family:system-ui,sans-serif;background:#fff}
        @page{margin:18mm;size:A4}
        @media print{body{padding:0}}
      </style>
    </head><body>${content}<scri` + `pt>window.onload=()=>window.print();</scri` + `pt></body></html>`);
    win.document.close();
  };

  const filled = [
    Object.values(d.oa || {}).some(Boolean),
    Object.keys(d.st || {}).length > 0,
    (d.ws || []).some((w: any) => w.pain || w.fix),
    TRI_TOPICS.some((_, i) => d.tr?.[i]?.[0]),
    Object.keys(d.rpa || {}).length > 0,
    (d.acts || []).some((a: any) => a.t),
  ];
  const labels = ["Собственник", "Станции", "Рабочие", "Триангул.", "RPA", "Действия"];
  const done = filled.filter(Boolean).length;

  return (
    <>
      <SectionTitle sub="Сгенерировать профессиональный PDF-отчёт">📄 Экспорт в PDF</SectionTitle>
      <Card accent={done === 6 ? C.green : C.yellow}>
        <p style={{ margin: "0 0 10px", fontWeight: 700, color: C.white }}>Заполненность: {done}/6 разделов</p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: 8 }}>
          {labels.map((l, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 10px",
              background: filled[i] ? `${C.green}15` : `${C.red}10`, borderRadius: 8,
              border: `1px solid ${filled[i] ? C.green : C.border}`,
            }}>
              <span>{filled[i] ? "✅" : "⬜"}</span>
              <span style={{ fontSize: 12, color: filled[i] ? C.green : C.dim }}>{l}</span>
            </div>
          ))}
        </div>
      </Card>
      <button onClick={handlePrint} style={{
        width: "100%", padding: 18, borderRadius: 14, border: "none", cursor: "pointer",
        fontSize: isMobile ? 15 : 17, fontWeight: 800, marginBottom: 12,
        background: `linear-gradient(135deg, ${C.acc} 0%, ${C.acc2} 100%)`,
        color: C.bg, boxShadow: `0 4px 24px ${C.acc}44`,
      }}>
        🖨️ ОТКРЫТЬ ПРЕДПРОСМОТР И ПЕЧАТЬ В PDF
      </button>
      <Card>
        <p style={{ margin: "0 0 8px", fontWeight: 700, color: C.white }}>💡 Как сохранить PDF</p>
        <ol style={{ margin: 0, paddingLeft: 18, color: C.text, fontSize: 13, lineHeight: 2.1 }}>
          <li>Нажмите кнопку выше</li>
          <li>В диалоге печати выберите <b style={{ color: C.white }}>«Сохранить как PDF»</b></li>
          <li>Нажмите «Сохранить»</li>
        </ol>
      </Card>
    </>
  );
}

// ─── APP ───────────────────────────────────────────────────────────────────
export default function GembaApp() {
  const [section, setSection] = useState("home");
  const [d, setRaw] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const saveTimer = useRef<any>(null);
  const isMobile = useIsMobile();

  // Load from localStorage on mount
  useEffect(() => {
    setRaw(loadData());
    setLoaded(true);
  }, []);

  const set = useCallback((newD: Record<string, any>) => {
    setRaw(newD);
    setSaveStatus("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveData(newD);
      setSaveStatus("saved");
    }, 600);
  }, []);

  const navigate = (id: string) => {
    setSection(id);
    setSidebarOpen(false);
  };

  if (!loaded) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: C.dim, fontSize: 16 }}>Загрузка...</p>
    </div>
  );

  const cur = SECTIONS.find(s => s.id === section);
  const BOTTOM_TABS = SECTIONS.slice(0, 6); // первые 6 в нижней панели
  const EXTRA_TABS  = SECTIONS.slice(6);    // остальные в меню

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "system-ui,sans-serif", color: C.text }}>

      {/* ── DESKTOP SIDEBAR ── */}
      {!isMobile && (
        <div style={{
          width: 220, background: C.sidebar, borderRight: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column",
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100,
        }}>
          <div style={{ padding: "18px 16px 12px", borderBottom: `1px solid ${C.border}` }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: C.white }}>GEMBA · КРОН</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: C.dim }}>Gemba Walk Tool</p>
          </div>
          <nav style={{ flex: 1, padding: "8px", overflowY: "auto" }}>
            {SECTIONS.map(s => {
              const active = section === s.id;
              return (
                <button key={s.id} onClick={() => navigate(s.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 12px", borderRadius: 9, border: "none", cursor: "pointer",
                  marginBottom: 2, textAlign: "left" as any,
                  background: active ? "rgba(56,189,248,0.15)" : "transparent",
                  color: active ? C.acc : C.dim,
                  fontWeight: active ? 700 : 500, fontSize: 14,
                }}>
                  <span style={{ fontSize: 18, minWidth: 24 }}>{s.icon}</span>
                  {s.label}
                </button>
              );
            })}
          </nav>
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: saveStatus === "saved" ? C.green : C.yellow }} />
              <span style={{ fontSize: 11, color: C.dim }}>{saveStatus === "saved" ? "Сохранено" : "Сохранение..."}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE SLIDE-OUT MENU (backdrop + drawer) ── */}
      {isMobile && sidebarOpen && (
        <>
          {/* backdrop */}
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 199 }}
          />
          {/* drawer */}
          <div style={{
            position: "fixed", top: 0, left: 0, bottom: 0, width: 240,
            background: C.sidebar, borderRight: `1px solid ${C.border}`,
            zIndex: 200, display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.white }}>GEMBA · КРОН</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: C.dim }}>Gemba Walk Tool</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: C.dim, fontSize: 22, cursor: "pointer" }}>✕</button>
            </div>
            <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
              {SECTIONS.map(s => {
                const active = section === s.id;
                return (
                  <button key={s.id} onClick={() => navigate(s.id)} style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%",
                    padding: "12px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                    marginBottom: 3, textAlign: "left" as any,
                    background: active ? "rgba(56,189,248,0.15)" : "transparent",
                    color: active ? C.acc : C.dim, fontWeight: active ? 700 : 500, fontSize: 15,
                  }}>
                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                    {s.label}
                  </button>
                );
              })}
            </nav>
            <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: saveStatus === "saved" ? C.green : C.yellow }} />
                <span style={{ fontSize: 12, color: C.dim }}>{saveStatus === "saved" ? "Сохранено в браузере" : "Сохранение..."}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{
        marginLeft: isMobile ? 0 : 220,
        flex: 1,
        minHeight: "100vh",
        paddingBottom: isMobile ? 72 : 0,
      }}>
        {/* Top header */}
        <div style={{
          padding: isMobile ? "12px 16px" : "14px 28px",
          borderBottom: `1px solid ${C.border}`,
          background: C.sidebar,
          position: "sticky", top: 0, zIndex: 50,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)} style={{
              background: "none", border: "none", color: C.dim, fontSize: 22,
              cursor: "pointer", padding: "0 4px",
            }}>☰</button>
          )}
          <span style={{ fontSize: 20 }}>{cur?.icon}</span>
          <h1 style={{ margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 800, color: C.white }}>{cur?.label}</h1>
          {isMobile && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: saveStatus === "saved" ? C.green : C.yellow }} />
              <span style={{ fontSize: 10, color: C.dim }}>{saveStatus === "saved" ? "OK" : "..."}</span>
            </div>
          )}
        </div>

        {/* Page body */}
        <div style={{ padding: isMobile ? "16px 14px" : "24px 32px", maxWidth: isMobile ? "100%" : 1100 }}>
          {section === "home"    && <HomeSection isMobile={isMobile} />}
          {section === "owner"   && <OwnerSection d={d} set={set} />}
          {section === "station" && <StationSection d={d} set={set} isMobile={isMobile} />}
          {section === "workers" && <WorkersSection d={d} set={set} isMobile={isMobile} />}
          {section === "tri"     && <TriSection d={d} set={set} isMobile={isMobile} />}
          {section === "rpa"     && <RPASection d={d} set={set} isMobile={isMobile} />}
          {section === "actions" && <ActionsSection d={d} set={set} isMobile={isMobile} />}
          {section === "export"  && <ExportSection d={d} isMobile={isMobile} />}
        </div>
      </div>

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      {isMobile && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: C.sidebar, borderTop: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-around",
          padding: "6px 0 env(safe-area-inset-bottom, 6px)",
          zIndex: 100,
        }}>
          {SECTIONS.map(s => {
            const active = section === s.id;
            return (
              <button key={s.id} onClick={() => navigate(s.id)} style={{
                display: "flex", flexDirection: "column" as any,
                alignItems: "center", gap: 2, background: "none", border: "none",
                cursor: "pointer", padding: "4px 6px", flex: 1,
                opacity: active ? 1 : 0.45,
                transform: active ? "scale(1.1)" : "none",
                transition: "all .15s",
              }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <span style={{ fontSize: 9, color: active ? C.acc : C.dim, fontWeight: active ? 700 : 400 }}>
                  {s.label.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
