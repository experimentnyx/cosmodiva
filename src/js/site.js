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

  /* ---- modal shell (shared by the contact + checkout dialogs) ----
     Both dialogs share the same open/close mechanics: toggle .is-open, lock body
     scroll, move focus in, and close on backdrop click or [data-modal-close].
     createModal wires one dialog and returns { open, close }. The per-form submit
     logic stays separate below, because the two forms differ on success — contact
     shows a thank-you panel, checkout redirects to Monobank. */
  function createModal(modalEl, onOpen) {
    if (!modalEl) return null;
    var lastFocus = null;
    function set(open) {
      modalEl.classList.toggle("is-open", open);
      modalEl.setAttribute("aria-hidden", String(!open));
      document.body.style.overflow = open ? "hidden" : "";
      if (open) {
        lastFocus = document.activeElement;
        if (onOpen) onOpen();
        var first = modalEl.querySelector("input, button");
        if (first) first.focus();
      } else if (lastFocus) {
        lastFocus.focus();
      }
    }
    modalEl.addEventListener("click", function (e) { if (e.target === modalEl) set(false); });
    modalEl.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", function () { set(false); });
    });
    return { open: function () { set(true); }, close: function () { set(false); } };
  }

  /* ---- contact modal ---- */
  var modal = document.getElementById("contactModal");
  var form = document.getElementById("contactForm");
  var formWrap = modal && modal.querySelector("[data-contact-form]");
  var sentWrap = modal && modal.querySelector("[data-contact-sent]");

  var contact = createModal(modal, function () {
    if (formWrap) formWrap.hidden = false;
    if (sentWrap) sentWrap.hidden = true;
    if (form) {
      form.reset();
      // Clear any error left over from a previous attempt, otherwise a stale
      // failure message greets the next visitor to open the modal.
      var prevStatus = form.querySelector("[data-form-status]");
      if (prevStatus) {
        prevStatus.textContent = "";
        prevStatus.className = "cd-form-status";
      }
    }
  });

  document.querySelectorAll("[data-modal-open]").forEach(function (el) {
    el.addEventListener("click", function () { if (contact) contact.open(); });
  });

  /* ---- checkout modal ---- */
  var checkoutModal = document.getElementById("checkoutModal");
  var checkoutForm = document.getElementById("checkoutForm");
  var checkoutPlanName = checkoutModal && checkoutModal.querySelector("[data-checkout-plan-name]");

  var checkout = createModal(checkoutModal, function () {
    if (checkoutForm) {
      var s = checkoutForm.querySelector("[data-form-status]");
      if (s) { s.textContent = ""; s.className = "cd-form-status"; }
    }
  });

  document.querySelectorAll("[data-checkout]").forEach(function (el) {
    el.addEventListener("click", function () {
      if (!checkout || !checkoutForm) return;
      // Reset first so a previous plan's values never leak into the next order,
      // then stamp the chosen plan into the hidden field the API reads.
      checkoutForm.reset();
      var planField = checkoutForm.querySelector('input[name="plan"]');
      if (planField) planField.value = el.dataset.plan || "";
      if (checkoutPlanName) checkoutPlanName.textContent = el.dataset.planName || "";
      checkout.open();
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (contact) contact.close();
    if (checkout) checkout.close();
    setNav(false);
  });

  if (form) {
    var status = form.querySelector("[data-form-status]");
    var submitBtn = form.querySelector('button[type="submit"]');

    function setStatus(text, kind) {
      if (!status) return;
      status.textContent = text || "";
      status.className = "cd-form-status" + (kind ? " is-" + kind : "");
    }

    /* Used when no access key is configured yet. A mailto: does nothing at all
       on a machine with no mail client registered, which reads as a broken
       button — so say what is happening on screen first, then attempt the
       draft. The address stays visible either way. */
    function mailtoFallback(data) {
      var to = form.dataset.fallbackEmail || "";
      var subject = encodeURIComponent("Питання з сайту — " + (data.get("name") || ""));
      var body = encodeURIComponent(
        (data.get("message") || "") + "\n\n" + (data.get("email") || "")
      );
      setStatus(submitBtn.dataset.unconfiguredText, "error");
      window.location.href = "mailto:" + to + "?subject=" + subject + "&body=" + body;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var data = new FormData(form);

      // Honeypot: a real person never checks a field they cannot see.
      if (data.get("botcheck")) return;

      if (!form.checkValidity()) {
        setStatus(submitBtn.dataset.invalidText, "error");
        var firstInvalid = form.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var endpoint = form.dataset.endpoint;
      var key = (data.get("access_key") || "").trim();
      if (!endpoint || !key) {
        mailtoFallback(data);
        return;
      }

      var payload = {};
      data.forEach(function (value, name) { payload[name] = value; });

      setStatus("", null);
      submitBtn.disabled = true;
      submitBtn.textContent = submitBtn.dataset.sendingLabel;

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json().catch(function () { return {}; }); })
        .then(function (result) {
          if (!result || result.success !== true) throw new Error(result && result.message);
          if (formWrap) formWrap.hidden = true;
          if (sentWrap) sentWrap.hidden = false;
          form.reset();
          setStatus("", null);
        })
        .catch(function () {
          // Never show the success panel on failure — the visitor would think
          // the message was delivered and would not follow up.
          setStatus(submitBtn.dataset.errorText, "error");
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.submitLabel;
        });
    });
  }

  /* ---- checkout submit ----
     Sends { plan, name, email, telegram } to /api/checkout and hands off to the
     pageUrl Monobank returns. The plan's PRICE is resolved server-side from the id
     alone — the browser never sends an amount — so a tampered payload cannot change
     what is charged. Same validation + honeypot pattern as the contact form. */
  if (checkoutForm) {
    var koStatus = checkoutForm.querySelector("[data-form-status]");
    var koSubmit = checkoutForm.querySelector('button[type="submit"]');

    var setKoStatus = function (text, kind) {
      if (!koStatus) return;
      koStatus.textContent = text || "";
      koStatus.className = "cd-form-status" + (kind ? " is-" + kind : "");
    };
    var resetKoButton = function () {
      koSubmit.disabled = false;
      koSubmit.textContent = koSubmit.dataset.submitLabel;
    };

    checkoutForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var data = new FormData(checkoutForm);
      if (data.get("botcheck")) return; // honeypot

      if (!checkoutForm.checkValidity() || !data.get("plan")) {
        setKoStatus(koSubmit.dataset.invalidText, "error");
        var firstInvalid = checkoutForm.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var payload = {};
      data.forEach(function (value, name) { if (name !== "botcheck") payload[name] = value; });

      setKoStatus("", null);
      koSubmit.disabled = true;
      koSubmit.textContent = koSubmit.dataset.sendingLabel;

      fetch(checkoutForm.dataset.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            return { ok: res.ok, status: res.status, body: body };
          });
        })
        .then(function (r) {
          if (r.ok && r.body && r.body.pageUrl) {
            window.location.href = r.body.pageUrl; // → Monobank hosted checkout
            return;
          }
          // 503 = provider not wired up yet; anything else is a genuine failure.
          setKoStatus(r.status === 503 ? koSubmit.dataset.unconfiguredText : koSubmit.dataset.errorText, "error");
          resetKoButton();
        })
        .catch(function () {
          setKoStatus(koSubmit.dataset.errorText, "error");
          resetKoButton();
        });
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

  /* ---- hero stat count-up ----
     The final figures are rendered server-side, so they are already correct
     with JS off, before this runs, or under reduced motion — the animation only
     rewinds them to zero and counts back up. Parsing the rendered text rather
     than a data attribute keeps the markup as the single source of the value. */
  var statValues = document.querySelectorAll(".cd-stat-value");

  if (statValues.length && !reduceMotion.matches && "IntersectionObserver" in window) {
    var countUp = function (el, delay) {
      // Splits "100+" into prefix / 100 / "+", so suffixes survive the count.
      var parts = /^(\D*?)(\d[\d\s,]*)(.*)$/.exec(el.textContent.trim());
      if (!parts) return;

      var prefix = parts[1];
      var suffix = parts[3];
      var target = parseInt(parts[2].replace(/[\s,]/g, ""), 10);
      if (!isFinite(target)) return;

      var duration = 1100;
      var startedAt = null;

      var frame = function (now) {
        if (startedAt === null) startedAt = now;
        var p = Math.min((now - startedAt) / duration, 1);
        // easeOutCubic: quick off the mark, settling gently onto the figure.
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      };

      el.textContent = prefix + "0" + suffix;
      window.setTimeout(function () { requestAnimationFrame(frame); }, delay);
    };

    var statsIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          statsIo.unobserve(entry.target);
          countUp(entry.target, Number(entry.target.dataset.countDelay) || 0);
        });
      },
      { threshold: 0.5 }
    );

    statValues.forEach(function (el, i) {
      // Staggered so the row reads left-to-right rather than snapping at once.
      el.dataset.countDelay = i * 120;
      statsIo.observe(el);
    });
  }

  /* ---- reviews scroller keyboard access ----
     The track holds only blockquotes, so it has no focusable children and a
     keyboard user could not reach or scroll it. tabindex makes it focusable and
     arrow-scrollable. Applied only at the breakpoint where it is genuinely a
     scroll container — above it the track is display:contents and generates no
     box, so a focusable-but-invisible element would be a trap of its own. */
  var reviewsTrack = document.querySelector(".cd-reviews-track");
  if (reviewsTrack) {
    var syncTrack = function (isMobile) {
      if (isMobile) {
        reviewsTrack.setAttribute("tabindex", "0");
        reviewsTrack.setAttribute("role", "group");
        reviewsTrack.setAttribute("aria-label", "Відгуки клієнтів");
      } else {
        reviewsTrack.removeAttribute("tabindex");
        reviewsTrack.removeAttribute("role");
        reviewsTrack.removeAttribute("aria-label");
      }
    };
    syncTrack(mq.matches);
    var onTrackMq = function (e) { syncTrack(e.matches); };
    if (mq.addEventListener) mq.addEventListener("change", onTrackMq);
    else if (mq.addListener) mq.addListener(onTrackMq);
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

  /* ---- header: clear over the hero, frosted once scrolled past it ----
     The sticky bar sits over the hero photo on the landing, so it stays
     transparent there; past the hero (and on pages that have none) it gains a
     translucent fill so the nav stays legible over whatever scrolls beneath. */
  var header = document.querySelector(".cd-header");
  if (header) {
    var hero = document.querySelector(".cd-hero");
    // Expose the bar's height so the hero glow can extend up behind it (CSS).
    var measureHeader = function () {
      document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
    };
    var syncHeader = function () {
      var limit = hero ? hero.offsetHeight - header.offsetHeight : 0;
      header.classList.toggle("is-scrolled", window.scrollY > limit);
    };
    measureHeader();
    syncHeader();
    window.addEventListener("scroll", syncHeader, { passive: true });
    window.addEventListener("resize", function () { measureHeader(); syncHeader(); }, { passive: true });
  }
})();
