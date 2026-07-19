/* Landing-page behaviour.
   The design tool drove layout from JS; here layout is pure CSS and JS only
   handles genuine interaction. FAQ accordions use native <details>. */
(function () {
  "use strict";

  /* ---- mobile nav ---- */
  var nav = document.getElementById("mobileNav");
  var openBtn = document.getElementById("navOpen");
  var closeBtn = document.getElementById("navClose");

  function setNav(open) {
    if (!nav) return;
    nav.classList.toggle("is-open", open);
    if (openBtn) openBtn.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (openBtn) openBtn.addEventListener("click", function () { setNav(true); });
  if (closeBtn) closeBtn.addEventListener("click", function () { setNav(false); });
  document.querySelectorAll("[data-nav-close]").forEach(function (el) {
    el.addEventListener("click", function () { setNav(false); });
  });

  /* Close the mobile nav if the viewport grows past the breakpoint while open. */
  var mq = window.matchMedia("(max-width: 1100px)");
  var onMq = function (e) { if (!e.matches) setNav(false); };
  if (mq.addEventListener) mq.addEventListener("change", onMq);
  else if (mq.addListener) mq.addListener(onMq);

  /* ---- contact modal ---- */
  var modal = document.getElementById("contactModal");
  var form = document.getElementById("contactForm");
  var formWrap = modal && modal.querySelector("[data-contact-form]");
  var sentWrap = modal && modal.querySelector("[data-contact-sent]");
  var lastFocus = null;

  function setModal(open) {
    if (!modal) return;
    modal.classList.toggle("is-open", open);
    modal.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      lastFocus = document.activeElement;
      var first = modal.querySelector("input, button");
      if (first) first.focus();
    } else if (lastFocus) {
      lastFocus.focus();
    }
  }

  document.querySelectorAll("[data-modal-open]").forEach(function (el) {
    el.addEventListener("click", function () {
      if (formWrap) formWrap.hidden = false;
      if (sentWrap) sentWrap.hidden = true;
      if (form) form.reset();
      setModal(true);
    });
  });

  document.querySelectorAll("[data-modal-close]").forEach(function (el) {
    el.addEventListener("click", function () { setModal(false); });
  });

  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) setModal(false);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    setModal(false);
    setNav(false);
  });

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      // TODO: no endpoint wired yet (see contact-modal.njk). Showing the
      // confirmation state without actually sending would lie to the visitor,
      // so fall back to the real mail channel instead.
      var data = new FormData(form);
      var subject = encodeURIComponent("Питання з сайту — " + (data.get("name") || ""));
      var body = encodeURIComponent(
        (data.get("message") || "") + "\n\n" + (data.get("email") || "")
      );
      window.location.href =
        "mailto:cosmodiva@gmail.com?subject=" + subject + "&body=" + body;
    });
  }

  /* ---- scroll reveal ---- */
  var revealables = document.querySelectorAll(".cd-reveal");
  if (!("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---- FAQ open/close animation ----
     <details> switches height straight to auto, so it cannot be transitioned.
     The panel is animated with the Web Animations API instead, and `open` is
     only cleared once the collapse has finished — that keeps native <details>
     semantics (keyboard, find-in-page, screen readers) intact. */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.querySelectorAll(".cd-faq-item").forEach(function (item) {
    var summary = item.querySelector("summary");
    var body = item.querySelector(".cd-faq-body");
    if (!summary || !body || !body.animate) return;

    var running = null;

    summary.addEventListener("click", function (e) {
      e.preventDefault();

      if (reduceMotion.matches) {
        item.open = !item.open;
        item.classList.remove("is-closing");
        return;
      }

      /* `open` stays true for the whole collapse, so it cannot be used alone to
         decide intent — a click mid-close would read as "close again" and strand
         the panel shut. Treat a click while closing as a reversal. */
      var closing = item.classList.contains("is-closing");
      var willOpen = !item.open || closing;

      if (running) { running.cancel(); running = null; }

      if (willOpen) {
        /* A closed <details> still reports its intrinsic height here, so
           measuring it would animate from full-height to full-height — i.e.
           no visible change. Only trust a measurement when reversing a
           collapse that is still in flight; otherwise start from zero. */
        var startHeight = closing ? body.getBoundingClientRect().height : 0;
        item.classList.remove("is-closing");
        item.open = true;
        running = body.animate(
          { height: [startHeight + "px", body.scrollHeight + "px"], opacity: [closing ? 1 : 0, 1] },
          { duration: 240, easing: "ease" }
        );
        running.onfinish = function () { running = null; };
      } else {
        // Open, so this measurement is real.
        item.classList.add("is-closing");
        running = body.animate(
          { height: [body.getBoundingClientRect().height + "px", "0px"], opacity: [1, 0] },
          { duration: 220, easing: "ease" }
        );
        running.onfinish = function () {
          item.open = false;
          item.classList.remove("is-closing");
          running = null;
        };
      }
    });
  });

  /* ---- blog category filter ----
     Only rendered when the collection spans 2+ categories. */
  var filters = document.querySelectorAll(".cd-filter");
  if (filters.length) {
    var cards = document.querySelectorAll(".cd-recipe-grid .cd-card");
    filters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var want = btn.dataset.filter;
        filters.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
        cards.forEach(function (card) {
          card.hidden = want !== "all" && card.dataset.category !== want;
        });
      });
    });
  }

  /* ---- back to top ---- */
  var toTop = document.getElementById("backToTop");
  if (toTop) {
    var onScroll = function () {
      toTop.classList.toggle("is-visible", window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
