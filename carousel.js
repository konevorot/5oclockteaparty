/* ============================================================
   КАРУСЕЛЬ ФОТО
   Показывает только слайды с фото. Пустые видны лишь в правке.
   Никаких inline-стилей: всё через классы, чтобы ничего
   лишнего не попадало в экспортируемый файл.
   ============================================================ */
(function(){
  document.querySelectorAll("[data-carousel]").forEach(init);

  function init(root){
    var slides = Array.prototype.slice.call(root.querySelectorAll(".slide"));
    var dots   = root.querySelector(".dots");
    var prev   = root.querySelector(".cnav.prev");
    var next   = root.querySelector(".cnav.next");
    var i = 0;

    // подчищаем следы старых версий
    slides.forEach(function(s){ s.style.removeProperty("display"); });
    root.removeAttribute("data-single");

    function filled(){ return slides.filter(function(s){ return !!s.querySelector("img"); }); }

    function render(){
      var editing = document.body.classList.contains("editing");

      if(editing){
        // сетка: все слайды кликабельны, управление прячем
        slides.forEach(function(s){ s.classList.remove("off","active"); });
        root.removeAttribute("data-single");
        return;
      }

      var live = filled();
      slides.forEach(function(s){
        s.classList.remove("active");
        s.classList.toggle("off", live.indexOf(s) < 0);
      });

      if(!live.length){
        slides[0].classList.remove("off");
        slides[0].classList.add("active");
        root.setAttribute("data-single","");
        return;
      }

      if(i >= live.length) i = 0;
      if(i < 0) i = live.length - 1;
      live[i].classList.add("active");

      if(live.length < 2) root.setAttribute("data-single","");
      else root.removeAttribute("data-single");

      drawDots(live.length);
    }

    function drawDots(n){
      if(!dots) return;
      if(dots.children.length !== n){
        dots.innerHTML = "";
        for(var k=0;k<n;k++){
          var b=document.createElement("button");
          b.type="button";
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
    if(prev) prev.addEventListener("click",function(e){ e.preventDefault(); go(-1); });
    if(next) next.addEventListener("click",function(e){ e.preventDefault(); go(1); });

    root.setAttribute("tabindex","0");
    root.addEventListener("keydown",function(e){
      if(document.body.classList.contains("editing")) return;
      if(e.key==="ArrowLeft"){ go(-1); e.preventDefault(); }
      if(e.key==="ArrowRight"){ go(1); e.preventDefault(); }
    });

    var x0=null;
    root.addEventListener("touchstart",function(e){ x0=e.touches[0].clientX; },{passive:true});
    root.addEventListener("touchend",function(e){
      if(x0===null || document.body.classList.contains("editing")) return;
      var dx=e.changedTouches[0].clientX - x0;
      if(Math.abs(dx)>44) go(dx<0 ? 1 : -1);
      x0=null;
    },{passive:true});

    document.addEventListener("foc:photo",render);
    document.addEventListener("foc:editing",render);
    render();
  }
})();
