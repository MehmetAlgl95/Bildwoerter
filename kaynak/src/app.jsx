import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import DATA from "./words.json";
import SENT from "./sent.json";

import examWords from "../goethe-a1.txt";
import { Picture, Vis, SampleCards, hasPainting, hasPicture } from "./visuals";

const examKeys = new Set(examWords.trim().split(/\r?\n/));
const W = [];
DATA.forEach((c, ci) => c.w.forEach(w => W.push({ e: w[0], de: w[1], tr: w[2], c: ci, core: c.core })));
const KEY = "bildwoerter-v1";
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const isLearned = (prog, w) => (prog[w.de] || 0) >= 3;
function pick(pool, n, prog) {
  const shuffled = shuffle(pool);
  const fresh = shuffled.filter(w => !isLearned(prog, w));
  const first = pool === W ? [...fresh.filter(w => w.core), ...fresh.filter(w => !w.core)] : fresh;
  return [...first, ...shuffled.filter(w => isLearned(prog, w))].slice(0, n);
}
const cx = (...a) => a.filter(Boolean).join(" ");

// Tıpatıp aynı ipucuna iki farklı doğru cevap düşmesin.
function distinctClues(words, size) {
  const clues = new Set();
  const meanings = new Set();
  const result = [];
  for (const word of words) {
    const meaning = word.tr.toLocaleLowerCase("tr");
    const clue = word.e || meaning;
    if (clues.has(clue) || meanings.has(meaning)) continue;
    clues.add(clue);
    meanings.add(meaning);
    result.push(word);
    if (result.length === size) break;
  }
  return result;
}

function matchRound(pool, progress) {
  const ranked = pick(pool, pool.length, progress);
  const fresh = ranked.filter(w => !isLearned(progress, w));
  const active = fresh.length >= 6 ? fresh : ranked;
  const illustrated = active.filter(hasPainting).slice(0, 1);
  const pictures = active.filter(w => w.e && !hasPainting(w)).slice(0, 3);
  const items = distinctClues([...illustrated, ...pictures, ...active], 6);
  return { id: Math.random(), pics: shuffle(items), words: shuffle(items) };
}

function readProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (!saved || Array.isArray(saved) || typeof saved !== "object") return {};
    if (saved["das Grad"] && !saved["der Grad"]) saved["der Grad"] = saved["das Grad"];
    delete saved["das Grad"];
    return Object.fromEntries(Object.entries(saved).filter(([,v]) => Number.isInteger(v) && v > 0 && v <= 3));
  } catch { return {}; }
}

/* Yalnızca Almanca bir sesle okur; Almanca ses yoksa hiç okumaz. Ses her okumada listeden yeniden alınır. */
let prefVoice = "";
try { prefVoice = localStorage.getItem("bildwoerter-voice") || ""; } catch (e) {}
function deVoices() {
  try { return speechSynthesis.getVoices().filter(v => /^de([-_]|$)/i.test(v.lang)); } catch (e) { return []; }
}
function findDeVoice() {
  const de = deVoices();
  const names = ["Anna", "Petra", "Markus", "Viktor", "Yannick", "Google Deutsch", "Katja", "Hedda", "Stefan"];
  return de.find(v => v.name === prefVoice) || de.find(v => /premium|enhanced|natural|yüksek|geliştirilmiş/i.test(v.name))
    || de.find(v => names.some(n => v.name.includes(n))) || de.find(v => v.lang.replace("_", "-").toLowerCase() === "de-de") || de[0] || null;
}
let speechTimer;
function stopSpeech() {
  clearTimeout(speechTimer);
  window.speechSynthesis?.cancel();
}
function sayDe(text) {
  clearTimeout(speechTimer);
  const v = findDeVoice(); if (!v) return;
  const go = () => {
    const u = new SpeechSynthesisUtterance(text.replace(/…/g, ""));
    u.voice = v; u.lang = "de-DE"; u.rate = 0.9;
    speechSynthesis.speak(u);
  };
  if (speechSynthesis.speaking || speechSynthesis.pending) { speechSynthesis.cancel(); speechTimer = setTimeout(go, 120); } else go();
}

function Ring({ value, total }) {
  const r = 26, c = 2 * Math.PI * r, f = total ? value / total : 0;
  return (
    <div className="ring" aria-live="polite">
      <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
        <circle cx="32" cy="32" r={r} className="ring-bg" />
        <circle cx="32" cy="32" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - f)} transform="rotate(-90 32 32)" />
      </svg>
      <div><strong>{value}</strong><span> / {total}</span><small>kelime öğrenildi</small></div>
    </div>
  );
}

function Switch({ id, on, onChange, children }) {
  return (
    <button id={id} className="switch" role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span className="track"><span className="knob" /></span>{children}
    </button>
  );
}

function Match({ pool, progRef, bump, speak, tr }) {
  const mk = () => matchRound(pool, progRef.current);
  const [round, setRound] = useState(mk);
  const [sel, setSel] = useState({ p: null, w: null });
  const [done, setDone] = useState([]);
  const [bad, setBad] = useState(null);
  useEffect(() => {
    if (!bad) return;
    const timer = setTimeout(() => setBad(null), 450);
    return () => clearTimeout(timer);
  }, [bad]);
  const [miss, setMiss] = useState(0);
  const [last, setLast] = useState(null);
  const total = round.pics.length, finished = done.length === total;
  const next = () => { setRound(mk()); setSel({ p: null, w: null }); setDone([]); setBad(null); setMiss(0); setLast(null); };
  const click = (kind, w) => {
    if (done.includes(w.de)) return;
    const ns = { ...sel, [kind]: w };
    if (ns.p && ns.w) {
      if (ns.p === ns.w) { setDone(d => [...d, w.de]); bump(w, 1); speak(w); setLast(w); }
      else { setBad(ns); setMiss(m => m + 1); bump(ns.p, -1); setLast(null); }
      setSel({ p: null, w: null });
    } else setSel(ns);
  };
  const tile = (kind, w) => {
    const ok = done.includes(w.de);
    return (
      <button key={kind + w.de} className={cx("tile", kind === "p" && "pic", ok && "ok", sel[kind] === w && "sel", bad && bad[kind] === w && "no")}
        onClick={() => click(kind, w)} aria-label={kind === "p" ? w.tr : w.de} disabled={ok} aria-pressed={sel[kind] === w}>
        {kind === "p" ? <Vis w={w} /> : <span className="de" lang="de">{w.de}</span>}
        {kind === "p" && ok && <span className="tr">{w.de}</span>}
        {kind === "w" && (ok || (tr && w.e)) && <span className="tr">{w.tr}</span>}
      </button>
    );
  };
  return (
    <div className="view" key={round.id}>
      <div className="view-head">
        <p className="hint">Bir ipucu seç, ardından Almanca karşılığına dokun.</p>
        <div className="pips" aria-label={done.length + " / " + total}>{round.pics.map((_, i) => <i key={i} className={i < done.length ? "on" : ""} />)}</div>
      </div>
      <div className="match-columns">
        <section><h3>İpuçları</h3><div className="grid">{round.pics.map(w => tile("p", w))}</div></section>
        <section><h3>Almanca</h3><div className="grid words">{round.words.map(w => tile("w", w))}</div></section>
      </div>
      <div className="view-foot">
        <div className={cx("msg", finished || last ? "good" : bad ? "bad" : "")} aria-live="polite">
          {finished ? (miss ? `Tur bitti · ${miss} yanlış deneme` : "Tur bitti · hepsi ilk denemede doğru") : last ? `${last.de} = ${last.tr}` : bad ? "Olmadı, tekrar dene" : ""}
        </div>
        <button className={cx("btn", !finished && "ghost")} onClick={next}>{finished ? "Sonraki tur" : "Bu turu geç"}</button>
      </div>
    </div>
  );
}

function Quiz({ pool, progRef, bump, speak, tr }) {
  const [dir, setDir] = useState(0);
  const mk = () => {
    const t = pick(pool, 1, progRef.current)[0];
    const related = pool.filter(w => w !== t && w.c === t.c);
    const others = pool.filter(w => w.c !== t.c);
    const options = distinctClues([t, ...shuffle(related), ...shuffle(others)], 4);
    return { id: Math.random(), t, opts: shuffle(options) };
  };
  const [q, setQ] = useState(mk);
  const [chosen, setChosen] = useState(null);
  const [score, setScore] = useState({ ok: 0, n: 0, streak: 0 });
  const answer = w => {
    if (chosen) return;
    const right = w === q.t; setChosen(w); bump(q.t, right ? 1 : -1); speak(q.t);
    setScore(s => ({ ok: s.ok + (right ? 1 : 0), n: s.n + 1, streak: right ? s.streak + 1 : 0 }));
  };
  const next = () => { setQ(mk()); setChosen(null); };
  useEffect(() => {
    const k = e => { if (e.repeat || e.altKey || e.metaKey || e.ctrlKey || e.target.closest?.("input,select,textarea")) return; const i = "1234".indexOf(e.key); if (i >= 0 && q.opts[i]) answer(q.opts[i]); else if (e.key === "Enter" && chosen && !e.target.closest?.("button,a")) { e.preventDefault(); next(); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });
  return (
    <div className="view" key={q.id + "" + dir}>
      <div className="view-head">
        <div className="stats"><span><b>{score.ok}</b> / {score.n} doğru</span><span>Seri <b>{score.streak}</b></span></div>
        <div className="seg small" role="group" aria-label="Yön">
          <button aria-pressed={dir === 0} onClick={() => { if (dir !== 0) { setDir(0); next(); } }}>Anlam → Almanca</button>
          <button aria-pressed={dir === 1} onClick={() => { if (dir !== 1) { setDir(1); next(); } }}>Almanca → anlam</button>
        </div>
      </div>
      <div className="stage">
        {dir === 0 ? <div className="quiz-clue"><Vis w={q.t} big />{tr && q.t.e && <small>{q.t.tr}</small>}</div> : <div className="bigword" lang="de">{q.t.de}</div>}
      </div>
      <div className={cx("answers", dir === 1 && "pics")}>
        {q.opts.map((w, i) => (
          <button key={w.de} className={cx("tile", dir === 1 && "pic", chosen && w === q.t && "ok", chosen === w && w !== q.t && "no", chosen && w !== q.t && chosen !== w && "dim")} onClick={() => answer(w)}>
            <kbd>{i + 1}</kbd>{dir === 1 ? <><Vis w={w} />{tr && w.e && <small>{w.tr}</small>}</> : <span className="de" lang="de">{w.de}</span>}
          </button>
        ))}
      </div>
      <div className="view-foot">
        <div className={cx("msg", chosen && (chosen === q.t ? "good" : "bad"))} aria-live="polite">
          {chosen && <>{q.t.e} <b>{q.t.de}</b> · {q.t.tr}</>}
        </div>
        {chosen && <button className="btn" autoFocus onClick={next}>Sonraki soru</button>}
      </div>
    </div>
  );
}

function Cards({ pool, progRef, bump, speak, tr }) {
  const [deck, setDeck] = useState(() => pick(pool, pool.length, progRef.current));
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const w = deck[i];
  const go = d => { bump(w, d); setOpen(false); if (i + 1 >= deck.length) { setDeck(pick(pool, pool.length, progRef.current)); setI(0); } else setI(i + 1); };
  const flip = () => { if (!open) { setOpen(true); speak(w); } };
  return (
    <div className="view">
      <div className="view-head"><p className="hint">Önce Almancasını söylemeyi dene, sonra kartı çevir.</p><div className="stats"><span>Kart <b>{i + 1}</b> / {deck.length}</span></div></div>
      <button className={cx("flip", open && "open")} onClick={flip} key={w.de} aria-label={open ? w.de + ", " + w.tr : w.tr + ", kartı çevir"}>
        <span className="face front"><Vis w={w} big />{tr && w.e && <strong>{w.tr}</strong>}<small>Çevirmek için dokun</small></span>
        <span className="face back">{hasPicture(w) && <Picture word={w} />}<span className="de" lang="de">{w.de}</span><span className="tr">{w.tr}</span></span>
      </button>
      <div className="view-foot center">
        {open ? <>
          <button className="btn ghost" onClick={() => go(-1)}>Bilemedim</button>
          <button className="btn ghost" onClick={() => speak(w)}>Tekrar dinle</button>
          <button className="btn" onClick={() => go(1)}>Bildim</button>
        </> : <button className="btn" onClick={flip}>Kartı çevir</button>}
      </div>
    </div>
  );
}

function List({ pool, prog, speak }) {
  const [q, setQ] = useState("");
  const s = q.trim().toLocaleLowerCase("tr");
  const german = q.trim().toLocaleLowerCase("de");
  const rows = s ? pool.filter(w => w.de.toLocaleLowerCase("de").includes(german) || w.tr.toLocaleLowerCase("tr").includes(s)) : pool;
  return (
    <div className="view">
      <div className="view-head">
        <p className="hint">Dinlemek için bir kelimeye dokun.</p>
        <input id="search" className="search" type="search" placeholder="Kelime ara (Almanca ya da Türkçe)" value={q} onChange={e => setQ(e.target.value)} aria-label="Kelime ara" />
      </div>
      <div className="list">
        {rows.map(w => (
          <button key={w.de} className={cx("row", isLearned(prog, w) && "done")} onClick={() => speak(w)}>
            <span className="list-pic">{hasPicture(w) ? <Picture word={w} /> : <span aria-hidden="true">Aa</span>}</span><span className="txt"><span className="de" lang="de">{w.de}</span><span className="tr">{w.tr}</span></span>
            <span className="lvl" aria-label={(prog[w.de] || 0) + " / 3"}>{[0, 1, 2].map(k => <i key={k} className={k < (prog[w.de] || 0) ? "on" : ""} />)}</span>
          </button>
        ))}
        {!rows.length && <p className="hint">Bu aramayla eşleşen kelime yok.</p>}
      </div>
    </div>
  );
}

function Sentences({ prog, bump, speak }) {
  const [topic, setTopic] = useState(-1);
  const mk = t => {
    const p = shuffle(SENT.s.filter(s => t < 0 || s.t === t));
    const s = p.find(s => !prog["§" + s.de]) || p[0];
    const toks = s.de.split(" ");
    let chips = toks.map((t, i) => ({ i, t }));
    for (let k = 0; k < 8; k++) { chips = shuffle(chips); if (chips.some((c, i) => c.t !== toks[i])) break; }
    return { id: Math.random(), s, toks, chips };
  };
  const [q, setQ] = useState(() => mk(-1));
  const [placed, setPlaced] = useState([]);
  const [st, setSt] = useState("build");
  const locked = st === "right" || st === "shown";
  const next = t => { setQ(mk(t)); setPlaced([]); setSt("build"); };
  const add = c => {
    if (locked) return;
    const np = [...placed, c]; setPlaced(np);
    if (np.length === q.toks.length) {
      if (np.every((c, i) => c.t === q.toks[i])) { setSt("right"); bump({ de: "§" + q.s.de }, 1); speak({ de: q.s.de }); }
      else setSt("wrong");
    } else setSt("build");
  };
  const remove = c => { if (locked) return; setPlaced(placed.filter(x => x !== c)); setSt("build"); };
  const show = () => { setPlaced([...q.chips].sort((a,b) => a.i - b.i)); setSt("shown"); speak({ de: q.s.de }); };
  const solved = SENT.s.filter(s => prog["§" + s.de]).length;
  const rest = q.chips.filter(c => !placed.includes(c));
  return (
    <div className="view" key={q.id}>
      <div className="view-head">
        <div className="stats"><span><b>{solved}</b> / {SENT.s.length} cümle çözüldü</span></div>
        <select id="topic" className="search" aria-label="Konu" value={topic} onChange={e => { const t = +e.target.value; setTopic(t); next(t); }}>
          <option value={-1}>Tüm konular</option>
          {SENT.topics.map((t, i) => <option key={i} value={i}>{t}</option>)}
        </select>
      </div>
      <p className="hint">Kelimelere sırayla dokunarak bu cümleyi Almanca kur:</p>
      <div className="prompt">{q.s.tr}</div>
      <div className={"slotline " + st} aria-live="polite" lang="de">
        {placed.map((c, i) => <button key={c.i} className={"chipw placed" + (st === "wrong" && c.t !== q.toks[i] ? " no" : "")} disabled={locked} onClick={() => remove(c)}>{c.t}</button>)}
        {!placed.length && <span className="ghosttxt">Cümlen burada oluşacak</span>}
      </div>
      <div className="chips" lang="de">{rest.map(c => <button key={c.i} className="chipw" onClick={() => add(c)}>{c.t}</button>)}</div>
      <div className="view-foot">
        <div className={"msg " + (st === "right" ? "good" : st === "wrong" ? "bad" : "")}>
          {st === "right" ? "Doğru!" : st === "wrong" ? "Kırmızı kelimelerin yeri yanlış; dokunup çıkar, yeniden dene." : st === "shown" ? "Doğru sıra bu." : ""}
        </div>
        <div className="btns">
          {!locked && placed.length > 0 && <button className="btn ghost" onClick={() => { setPlaced([]); setSt("build"); }}>Temizle</button>}
          {!locked && <button className="btn ghost" onClick={show}>Çözümü göster</button>}
          {locked && <button className="btn ghost" onClick={() => speak({ de: q.s.de })}>Tekrar dinle</button>}
          <button className={"btn" + (locked ? "" : " ghost")} onClick={() => next(topic)}>Sonraki cümle</button>
        </div>
      </div>
    </div>
  );
}

const MODES = [["match", "Eşleştir"], ["quiz", "Test"], ["cards", "Kartlar"], ["sent", "Cümle kur"], ["list", "Liste"]];

function App() {
  const [prog, setProg] = useState(readProgress);
  const [cat, setCat] = useState(-3);
  const [mode, setMode] = useState("match");
  const [tr, setTr] = useState(false);
  const [snd, setSnd] = useState(true);
  const [resetCount, setResetCount] = useState(0);
  const [armed, setArmed] = useState(false);
  const progRef = useRef(prog); progRef.current = prog;
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch (e) {} }, [prog]);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  const sndRef = useRef(snd); sndRef.current = snd;
  const [voice, setVoice] = useState("wait");
  const [vlist, setVlist] = useState([]);
  const chooseVoice = name => { prefVoice = name; try { localStorage.setItem("bildwoerter-voice", name); } catch (e) {} setVoice(name); try { sayDe("Guten Tag! Ich spreche Deutsch."); } catch (e) {} };
  useEffect(() => {
    if (!canSpeak) return;
    const upd = () => { const v = findDeVoice(); setVlist(deVoices().map(x => x.name)); if (v) setVoice(v.name); };
    upd();
    try { speechSynthesis.addEventListener("voiceschanged", upd); } catch (e) {}
    const t = setTimeout(() => setVoice(v => v === "wait" ? (findDeVoice() ? findDeVoice().name : "none") : v), 2500);
    return () => { clearTimeout(t); try { speechSynthesis.removeEventListener("voiceschanged", upd); } catch (e) {} };
  }, [canSpeak]);
  const speak = useCallback(w => {
    if (!sndRef.current || !canSpeak) return;
    try {
      sayDe(w.de);
    } catch (e) {}
  }, [canSpeak]);
  const bump = useCallback((w, d) => setProg(p => ({ ...p, [w.de]: Math.max(0, Math.min(3, (p[w.de] || 0) + d)) })), []);
  const pool = useMemo(() => cat === -3 ? W.filter(w => examKeys.has(w.de)) : cat === -1 ? W : cat === -2 ? W.filter(w => w.core) : W.filter(w => w.c === cat), [cat]);
  const counts = useMemo(() => { const a = DATA.map(() => 0); let all = 0, core = 0, exam = 0; W.forEach(w => { if (isLearned(prog, w)) { a[w.c]++; all++; if (examKeys.has(w.de)) exam++; if (w.core) core++; } }); return { a, all, core, exam }; }, [prog]);
  const nCore = useMemo(() => W.filter(w => w.core).length, []);
  const reset = () => { if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 4000); return; } setProg({}); setArmed(false); setResetCount(n => n + 1); };
  const mi = MODES.findIndex(m => m[0] === mode);
  const View = { match: Match, quiz: Quiz, cards: Cards, sent: Sentences, list: List }[mode];
  const catBtn = (ci, name, sub, n, total) => (
    <button key={ci} className="cat" aria-pressed={cat === ci} onClick={() => { setCat(ci); if (mode === "sent") setMode("match"); }}>
      <span className="cat-top"><strong>{name}</strong><span className="num">{n}/{total}</span></span>
      <small>{sub}</small>
      <span className="mini"><i style={{ width: (100 * n / total) + "%" }} /></span>
    </button>
  );
  return (
    <div className="app">
      <header className="top">
        <div className="brand"><span className="logo" aria-hidden="true"><i/><i/></span><div><h1>Bildwörter</h1><p>Almanca · Resimli kelime defteri</p></div></div>
        <Ring value={counts.all} total={W.length} />
      </header>
      <div className="body">
        <nav className="side" aria-label="Kategoriler">
          <div className="cats">
            {catBtn(-3, "Goethe A1", "Start Deutsch 1 seçkisi", counts.exam, examKeys.size)}
            {catBtn(-1, "Tüm kelimeler", "Koleksiyonun tamamı", counts.all, W.length)}
            <h2>Temel konular</h2>
            {catBtn(-2, "Temel konuların tümü", "Genişletilmiş söz varlığı", counts.core, nCore)}
            {DATA.map((c, i) => c.core ? catBtn(i, c.tr, c.de, counts.a[i], c.w.length) : null)}
            <h2>Resimli ek kelimeler</h2>
            {DATA.map((c, i) => c.core ? null : catBtn(i, c.tr, c.de, counts.a[i], c.w.length))}
          </div>
        </nav>
        <main className="main">
          <div className="lesson-head">
            <div><p className="context">{mode === "sent" ? "Cümle alıştırmaları" : cat === -3 ? "Goethe A1 · Start Deutsch 1" : cat === -1 ? "Tüm kelimeler" : cat === -2 ? "Temel konular" : DATA[cat].tr}</p>
              <h2>{({match:"Kelimeleri eşleştir", quiz:"Kendini sına", cards:"Kelime kartları", sent:"Cümle kur", list:"Kelime listesi"})[mode]}</h2>
            </div><SampleCards/>
          </div>
          <div className="toolbar">
            <div className="seg" role="tablist" style={{ "--i": mi, "--n": MODES.length }}>
              <span className="seg-ind" aria-hidden="true" />
              {MODES.map(([k, label]) => <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)}>{label}</button>)}
            </div>
            <div className="switches">
              {["match","quiz","cards"].includes(mode) && <Switch id="sw-tr" on={tr} onChange={setTr}>Türkçe ipucu</Switch>}
              {canSpeak && <Switch id="sw-snd" on={snd} onChange={value => { setSnd(value); if (!value) stopSpeech(); }}>Sesli oku</Switch>}
            </div>
          </div>
          <section className="panel">
            <View key={resetCount + ":" + (mode === "sent" ? mode : mode + cat)} pool={pool} prog={prog} progRef={progRef} bump={bump} speak={speak} tr={tr} />
          </section>
          {canSpeak && snd && voice === "none" && <p className="warn">Almanca ses bulunamadı. Sesli okuma için cihazının konuşma ayarlarından Almanca bir ses ekleyebilirsin.</p>}
          {canSpeak && snd && voice !== "none" && voice !== "wait" && <p className="voice"><label htmlFor="voice">Almanca ses</label>
            <select id="voice" value={voice} onChange={e => chooseVoice(e.target.value)}>{vlist.map(n => <option key={n} value={n}>{n}</option>)}</select>
            <button className="link" onClick={() => chooseVoice(voice)}>Sesi dene</button></p>}
          <p className="note">Her doğru cevap bir puan kazandırır, yanlış cevap bir puan düşürür. Üç puana ulaşan kelime öğrenildi sayılır. İlerleme yalnızca bu tarayıcıda saklanır.
            <button className="link" onClick={reset}>{armed ? "Emin misin? Sıfırlamak için tekrar dokun" : "İlerlemeyi sıfırla"}</button></p>
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
