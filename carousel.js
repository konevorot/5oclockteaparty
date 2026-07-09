/* ============================================================
   КАРУСЕЛЬ ФОТО
   Показывает только те слайды, куда добавлено фото.
   Пустые слайды видны лишь в режиме редактирования.
   ============================================================ */
(function(){
  document.querySelectorAll("[data-carousel]").forEach(init);

  function init(root){
    var slides = Array.prototype.slice.call(root.querySelectorAll(".slide"));
    var dots   = root.querySelector(".dots");
    var prev   = root.querySelector(".cnav.prev");
    var next   = root.querySelector(".cnav.next");
    var i = 0;

    function filled(){ return slides.filter(function(s){ return s.querySelector("img"); }); }

    function render(){
      var live = filled();
      // в режиме правки показываем все слайды сеткой — управление не нужно
      if(document.body.classList.contains("editing")){
        slides.forEach(function(s){ s.classList.add("active"); });
        return;
      }
      slides.forEach(function(s){ s.classList.remove("active"); s.style.display = live.indexOf(s)>-1 ? "" : "none"; });
      if(!live.length){ slides[0].style.display=""; slides[0].classList.add("active"); root.setAttribute("data-single",""); return; }
      if(i >= live.length) i = 0;
      if(i < 0) i = live.length - 1;
      live[i].classList.add("active");
      if(live.length < 2) root.setAttribute("data-single",""); else root.removeAttribute("data-single");
      drawDots(live.length);
    }

    function drawDots(n){
      if(!dots) return;
      if(dots.children.length !== n){
        dots.innerHTML = "";
        for(var k=0;k<n;k++){
          var b=document.createElement("button");
          b.setAttribute("role","tab");
          b.setAttribute("aria-label","Фото "+(k+1));
          (function(idx){ b.addEventListener("click",function(){ i=idx; render(); }); })(k);
          dots.appendChild(b);
        }
      }
      Array.prototype.forEach.call(dots.children,function(b,k){
        b.setAttribute("aria-current", String(k===i));
      });
    }

    function go(d){ i += d; render(); }
    if(prev) prev.addEventListener("click",function(){ go(-1); });
    if(next) next.addEventListener("click",function(){ go(1); });

    root.setAttribute("tabindex","0");
    root.addEventListener("keydown",function(e){
      if(e.key==="ArrowLeft"){ go(-1); e.preventDefault(); }
      if(e.key==="ArrowRight"){ go(1); e.preventDefault(); }
    });

    // свайп на телефоне
    var x0=null;
    root.addEventListener("touchstart",function(e){ x0=e.touches[0].clientX; },{passive:true});
    root.addEventListener("touchend",function(e){
      if(x0===null) return;
      var dx=e.changedTouches[0].clientX - x0;
      if(Math.abs(dx)>44) go(dx<0 ? 1 : -1);
      x0=null;
    },{passive:true});

    // редактор сообщает, что фото поменялось
    document.addEventListener("foc:photo",render);
    document.addEventListener("foc:editing",render);

    render();
  }
})();
