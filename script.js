/* Monarch Health Scribing — interactions + award-level motion */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ===== Header shadow on scroll ===== */
  var header = $("#siteHeader");
  if (header) {
    var hs = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
    hs(); window.addEventListener("scroll", hs, { passive: true });
  }

  /* ===== Mobile nav ===== */
  var toggle = $("#navToggle");
  if (toggle && header) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  /* ===== Scroll progress bar ===== */
  var prog = document.createElement("div");
  prog.className = "scroll-progress";
  document.body.appendChild(prog);
  var updateProg = function () {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    prog.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
  };
  updateProg();
  window.addEventListener("scroll", updateProg, { passive: true });
  window.addEventListener("resize", updateProg);

  /* ===== Custom cursor (fine pointers only) ===== */
  if (finePointer && !reduceMotion) {
    var dot = document.createElement("div"); dot.className = "cursor-dot";
    var ring = document.createElement("div"); ring.className = "cursor-ring";
    document.body.appendChild(dot); document.body.appendChild(ring);
    document.body.classList.add("use-custom-cursor");
    var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
      document.body.classList.add("cursor-ready");
    });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    })();
    var linkSel = "a, button, .btn, .faq-q, .svc-card, .q-card";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(linkSel)) document.body.classList.add("cursor-on-link");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(linkSel)) document.body.classList.remove("cursor-on-link");
    });
  }

  /* ===== Word-split reveal on signature headings ===== */
  if (!reduceMotion) {
    var splitWords = function (el) {
      var counter = { i: 0 };
      var walk = function (node, out) {
        Array.prototype.forEach.call(node.childNodes, function (child) {
          if (child.nodeType === 3) {
            var parts = child.textContent.split(/(\s+)/);
            parts.forEach(function (p) {
              if (p.trim() === "") { out.appendChild(document.createTextNode(p)); return; }
              var w = document.createElement("span"); w.className = "word-anim";
              var inner = document.createElement("i"); inner.textContent = p;
              inner.style.setProperty("--w", counter.i++);
              w.appendChild(inner); out.appendChild(w);
            });
          } else if (child.nodeName === "BR") {
            out.appendChild(document.createElement("br"));
          } else {
            var clone = child.cloneNode(false);
            walk(child, clone); out.appendChild(clone);
          }
        });
      };
      var frag = document.createElement("span");
      walk(el, frag);
      el.innerHTML = ""; el.appendChild(frag);
    };
    $$(".hero-copy h1, .page-head h1").forEach(function (h) {
      splitWords(h);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          $$(".word-anim", h).forEach(function (w) { w.classList.add("in"); });
        });
      });
    });
  }

  /* ===== Image clip reveal ===== */
  $$(".svc-row-media, .split-media img").forEach(function (el) {
    el.classList.add("img-reveal");
  });

  /* ===== Scroll reveal + image reveal observer ===== */
  var revealEls = $$(".reveal, .img-reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ===== Animated counters ===== */
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var runCount = function (el) {
    var raw = el.getAttribute("data-count");
    var to = parseFloat(raw);
    var suffix = el.getAttribute("data-suffix") || "";
    var dec = (raw.split(".")[1] || "").length;
    var grp = to >= 1000;
    var dur = 1600, start = null;
    var fmt = function (n) {
      var s = n.toFixed(dec);
      if (grp) s = parseFloat(s).toLocaleString("en-US");
      return s + suffix;
    };
    var tick = function (ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = fmt(to * easeOut(p));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  var nums = $$("[data-count]");
  if ("IntersectionObserver" in window && nums.length) {
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); nio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { nio.observe(el); });
  }

  /* ===== Magnetic buttons ===== */
  if (finePointer && !reduceMotion) {
    $$(".btn").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + x * 0.18 + "px," + y * 0.28 + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  }

  /* ===== Marquee — duplicate track for seamless loop ===== */
  $$(".marquee-track").forEach(function (track) {
    track.innerHTML = track.innerHTML + track.innerHTML;
  });

  /* ===== Hero parallax ===== */
  var heroMedia = $(".hero-media");
  if (heroMedia && finePointer && !reduceMotion) {
    var pTick = false;
    window.addEventListener("scroll", function () {
      if (pTick) return; pTick = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, 600);
        heroMedia.style.transform = "translateY(" + y * 0.06 + "px)";
        pTick = false;
      });
    }, { passive: true });
  }

  /* ===== Page-head ghost word ===== */
  var ph = $(".page-head .container");
  var cur = $(".page-head .crumb .cur");
  if (ph && cur) {
    var ghost = document.createElement("span");
    ghost.className = "ph-ghost"; ghost.setAttribute("aria-hidden", "true");
    ghost.textContent = cur.textContent.trim();
    ph.parentNode.insertBefore(ghost, ph);
  }

  /* ===== Footer big wordmark ===== */
  var footer = $(".site-footer");
  var fbottom = $(".footer-bottom");
  if (footer && fbottom) {
    var big = document.createElement("div");
    big.className = "footer-bigmark"; big.setAttribute("aria-hidden", "true");
    big.textContent = "Monarch";
    footer.insertBefore(big, fbottom);
  }

  /* ===== FAQ accordion ===== */
  $$(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".faq-item");
      var a = $(".faq-a", item);
      var open = item.classList.toggle("open");
      a.style.maxHeight = open ? a.scrollHeight + "px" : null;
    });
  });

  /* ===== Contact form (front-end demo) ===== */
  var form = $("#contactForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = $("#formNote");
      if (note) note.classList.add("show");
      form.reset();
    });
  }

  /* ===== Footer year ===== */
  var y = $("#year");
  if (y) y.textContent = "2026";
})();
