/* ============================================================
   ДОБАВИТЬ В КАЛЕНДАРЬ
   Данные события лежат в <div id="event" data-...> в index.html.
   Время указывается московское; Россия без перехода на летнее
   время, поэтому смещение всегда +03:00.
   ============================================================ */
(function(){
  var ev = document.getElementById("event");
  if(!ev) return;

  function conf(){
    return {
      title: ev.dataset.title || "Five o'clock tea",
      date:  ev.dataset.date  || "2026-07-19",   // ГГГГ-ММ-ДД
      start: ev.dataset.start || "16:00",
      end:   ev.dataset.end   || "20:00",
      loc:   ev.dataset.loc   || "",
      desc:  ev.dataset.desc  || ""
    };
  }

  /* "2026-07-19" + "16:00" -> "20260719T130000Z" (МСК = UTC+3) */
  function utcStamp(date,time){
    var d = date.split("-").map(Number);
    var t = time.split(":").map(Number);
    var ms = Date.UTC(d[0], d[1]-1, d[2], t[0]-3, t[1]||0, 0);
    return new Date(ms).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  }

  function esc(s){ return String(s||"").replace(/([,;\\])/g,"\\$1").replace(/\n/g,"\\n"); }

  function icsText(){
    var c=conf();
    var s=utcStamp(c.date,c.start), e=utcStamp(c.date,c.end);
    var uid = "foc-" + c.date + "-" + Math.random().toString(36).slice(2,8) + "@five-oclock";
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Five o'clock//RU",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:"+uid,
      "DTSTAMP:"+utcStamp(c.date,c.start),
      "DTSTART:"+s,
      "DTEND:"+e,
      "SUMMARY:"+esc(c.title),
      "LOCATION:"+esc(c.loc),
      "DESCRIPTION:"+esc(c.desc),
      "BEGIN:VALARM",
      "TRIGGER:-PT2H",
      "ACTION:DISPLAY",
      "DESCRIPTION:"+esc(c.title),
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
  }

  function downloadIcs(){
    var blob=new Blob([icsText()],{type:"text/calendar;charset=utf-8"});
    var a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="five-oclock.ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); },1500);
  }

  function googleUrl(){
    var c=conf();
    var p=new URLSearchParams({
      action:"TEMPLATE",
      text:c.title,
      dates:utcStamp(c.date,c.start)+"/"+utcStamp(c.date,c.end),
      details:c.desc,
      location:c.loc,
      ctz:"Europe/Moscow"
    });
    return "https://calendar.google.com/calendar/render?"+p.toString();
  }

  document.querySelectorAll("[data-cal='ics']").forEach(function(b){
    b.addEventListener("click",function(e){ e.preventDefault(); downloadIcs(); });
  });
  document.querySelectorAll("[data-cal='google']").forEach(function(b){
    b.addEventListener("click",function(e){
      e.preventDefault();
      window.open(googleUrl(),"_blank","noopener");
    });
  });
})();
