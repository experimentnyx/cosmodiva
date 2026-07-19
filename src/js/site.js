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
