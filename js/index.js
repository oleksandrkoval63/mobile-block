// ----- корректный 100vh на мобильных -----
// ===== 100vh фикс для мобилок =====
// ===== корректный 100vh для мобилок =====
function setVh() {
   document.documentElement.style.setProperty(
      "--vh",
      window.innerHeight * 0.01 + "px"
   );
}
setVh();
addEventListener("resize", setVh, { passive: true });

// ===== входная анимация головы =====
const animateElements = document.querySelectorAll(
   "[data-animate], [data-animate-book]"
);
animateElements.forEach((element) => {
   const observer = new IntersectionObserver(
      (entries) => {
         entries.forEach((entry) => {
            if (entry.isIntersecting) {
               entry.target.classList.add("is-in");
               observer.disconnect();
            }
         });
      },
      { threshold: 0.3 }
   );

   observer.observe(element);
});

// ===== бесшовные тикеры без дёрганья (две set-полосы + модуль) =====
document.querySelectorAll(".tape").forEach(initTickerSeamless);

function initTickerSeamless(tapeEl) {
   const track = ensureTrack(tapeEl); // <div class="ticker">
   const text = (tapeEl.dataset.text || "NIGHT STAR").trim();
   const speed = Number(tapeEl.dataset.speed) || 40; // px/s
   const dir =
      (tapeEl.dataset.direction || "rtl").toLowerCase() === "ltr" ? 1 : -1;

   let setWidth = 0; // ширина одной «полосы-набора»
   let offset = 0; // текущее смещение (влево — положительное для удобства)
   let raf = 0,
      last = performance.now();

   build(); // начальная сборка
   start(); // запуск анимации
   addEventListener(
      "resize",
      debounce(() => {
         build();
         start();
      }, 120),
      { passive: true }
   );

   function ensureTrack(el) {
      const t =
         el.querySelector(".ticker") ||
         el.appendChild(document.createElement("div"));
      t.classList.add("ticker");
      return t;
   }

   function makeItem() {
      const it = document.createElement("div");
      it.className = "ticker__item";
      const word = document.createElement("span");
      word.className = "ticker__word";
      word.textContent = text;
      const star = document.createElement("i");
      star.className = "ticker__star";
      it.append(word, star);
      return it;
   }

   function makeSet(minWidth) {
      const set = document.createElement("div");
      set.className = "ticker__set";
      // наполняем, пока сет не станет шире контейнера (с запасом)
      track.appendChild(set); // временно вставляем, чтобы измерять ширину
      while (set.getBoundingClientRect().width < minWidth) {
         set.appendChild(makeItem());
      }
      return set;
   }

   function build() {
      cancelAnimationFrame(raf);
      track.innerHTML = "";

      // целевая ширина одного набора: ширина ленты + 10%
      const target = tapeEl.getBoundingClientRect().width * 1.1 || 800;

      // создаём A и измеряем его ТOЧНУЮ ширину (с дробной частью)
      const A = makeSet(target);
      setWidth = A.getBoundingClientRect().width;

      // клонируем B и кладём подряд (A + B) — этого хватает на бесшовность
      const B = A.cloneNode(true);
      track.append(A, B);

      offset = 0; // сброс сдвига
      track.style.transform = "translate3d(0,0,0)";
      last = performance.now();
   }

   function start() {
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(tick);
   }

   function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000); // clamp на случай фризов
      last = now;

      // Смещаем влево для rtl, вправо для ltr
      offset += (dir === -1 ? 1 : -1) * speed * dt;

      // «модуль» по ширине одного набора (без перестановки DOM)
      // offset всегда в [0, setWidth)
      offset = ((offset % setWidth) + setWidth) % setWidth;

      track.style.transform = `translate3d(${-offset}px,0,0)`;
      raf = requestAnimationFrame(tick);
   }
}

function debounce(fn, d) {
   let t;
   return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, a), d);
   };
}
