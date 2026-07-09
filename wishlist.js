/* ============================================================
   ВИШЛИСТ

   Гости видят только, какие подарки заняты — без имён.
   Имя уходит в базу и доступно лишь хозяйке (Table Editor).

   Отмена: при бронировании браузер гостя сохраняет у себя
   случайный ключ. Кто бронировал — у того ключ, тот и снимет,
   ничего не вводя. У остальных кнопка отмены не показывается.
   Хозяйка может снять любую отметку своим паролем: Ctrl+Shift+U.
   ============================================================ */
const cfg = window.WISHLIST_CONFIG || {};
const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
  !/ВАШ|YOUR/i.test(cfg.SUPABASE_URL) && !/ВАШ|YOUR/i.test(cfg.SUPABASE_ANON_KEY);

let sb = null;
if (configured) {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
}

/* ---------- ключи гостя: { giftId: "случайная строка" } ---------- */
const KEYS = "foc_gift_keys";
const keysGet = () => { try { return JSON.parse(localStorage.getItem(KEYS) || "{}"); } catch { return {}; } };
const keysSet = v => { try { localStorage.setItem(KEYS, JSON.stringify(v)); } catch {} };
function newKey(){
  const a = new Uint8Array(18);
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2,"0")).join("");
}

/* демо-режим без базы */
const LOCAL = "foc_gifts_local";
const localGet = () => { try { return JSON.parse(localStorage.getItem(LOCAL) || "[]"); } catch { return []; } };
const localSet = v => localStorage.setItem(LOCAL, JSON.stringify(v));

const toast = document.getElementById("toast");
function say(m){ toast.textContent=m; toast.classList.add("show"); clearTimeout(toast._t); toast._t=setTimeout(()=>toast.classList.remove("show"),2600); }

const overlay=document.getElementById("overlay");
const mItem=document.getElementById("m-item");
const mName=document.getElementById("m-name");
const mOk=document.getElementById("m-ok");
let target=null;

function open(card){
  target=card;
  mItem.textContent=card.dataset.title;
  mName.value="";
  overlay.classList.add("open");
  setTimeout(()=>mName.focus(),50);
}
function close(){ overlay.classList.remove("open"); target=null; }
document.getElementById("m-cancel").addEventListener("click",close);
overlay.addEventListener("click",e=>{ if(e.target===overlay) close(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape" && overlay.classList.contains("open")) close(); });
mName.addEventListener("keydown",e=>{ if(e.key==="Enter") take(); });
mOk.addEventListener("click",take);

/* ---------- отрисовка ---------- */
let taken = [];
let ownerMode = false;      // хозяйка: показать отмену везде

function render(){
  const mine = keysGet();
  document.querySelectorAll(".gift").forEach(card=>{
    if(card.closest(".wl-group.hint")) return;      // подсказки не бронируются
    const id = card.dataset.id;
    const isTaken = taken.indexOf(id) > -1;
    card.classList.toggle("taken", isTaken);

    const who = card.querySelector(".who");
    const cancel = card.querySelector(".cancel");
    const isMine = !!mine[id];

    if(who) who.textContent = isTaken ? (isMine ? "Вы дарите это" : "Этот подарок уже дарят") : "";
    if(cancel){
      const show = isTaken && (isMine || ownerMode);
      cancel.style.display = show ? "" : "none";
      cancel.textContent = isMine ? "передумал(а)" : "снять отметку";
    }
  });
}

async function loadAll(){
  if(!sb){ taken = localGet(); render(); return; }
  const { data, error } = await sb.rpc("taken_gifts");
  if(error){ console.warn("taken_gifts:", error.message); return; }
  taken = (data||[]).map(r => r.gift_id);
  render();
}

/* ---------- забронировать ---------- */
async function take(){
  if(!target) return;
  const id=target.dataset.id, name=mName.value.trim();

  if(!sb){
    if(taken.indexOf(id)<0) taken.push(id);
    const m=keysGet(); m[id]="local"; keysSet(m);
    localSet(taken); render(); close();
    say("Отмечено (пока только у вас — база не подключена)");
    return;
  }

  const key = newKey();
  mOk.disabled=true;
  const { data, error } = await sb.rpc("book_gift",{ p_gift:id, p_name:name||null, p_secret:key });
  mOk.disabled=false;
  close();

  if(error){ console.warn(error); say("Не получилось, попробуйте ещё раз"); }
  else if(data==="taken"){ say("Кто-то уже успел"); }
  else {
    const m=keysGet(); m[id]=key; keysSet(m);   // ключ остаётся у гостя
    say("Спасибо ✓ Передумаете — сможете снять отметку");
  }
  loadAll();
}

/* ---------- снять отметку ---------- */
async function unbook(card){
  const id=card.dataset.id;
  const mine=keysGet();

  if(!sb){
    taken = taken.filter(x=>x!==id);
    delete mine[id]; keysSet(mine); localSet(taken);
    render(); say("Снято"); return;
  }

  let key = mine[id];
  if(!key){
    if(!ownerMode) return;
    key = prompt("Снять отметку с «"+card.dataset.title+"».\nПароль:");
    if(key===null) return;
  } else {
    if(!confirm("Снять свою отметку с «"+card.dataset.title+"»?")) return;
  }

  const { data, error } = await sb.rpc("unbook_gift",{ p_gift:id, p_key:key });
  if(error){ console.warn(error); say("Не получилось"); return; }
  if(data==="denied"){ say("Ключ или пароль не подошёл"); return; }
  if(data==="not_found"){ say("Отметки уже нет"); loadAll(); return; }

  delete mine[id]; keysSet(mine);
  say("Отметка снята");
  loadAll();
}

/* ---------- режим хозяйки: Ctrl+Shift+U ---------- */
document.addEventListener("keydown",(e)=>{
  if(e.ctrlKey && e.shiftKey && (e.key==="U"||e.key==="u"||e.code==="KeyU")){
    e.preventDefault();
    ownerMode = !ownerMode;
    render();
    say(ownerMode ? "Режим хозяйки: отмену видно везде" : "Режим хозяйки выключен");
  }
});

/* ---------- делегирование: работает и для новых карточек ---------- */
document.addEventListener("click", (e)=>{
  if(document.body.classList.contains("editing")) return;

  const book = e.target.closest(".gift .book");
  if(book && !book.closest(".wl-group.hint")){ open(book.closest(".gift")); return; }

  const cancel = e.target.closest(".gift .cancel");
  if(cancel){ unbook(cancel.closest(".gift")); }
});

window.focRefreshGifts = render;

loadAll();
if(sb) setInterval(loadAll, 20000);
