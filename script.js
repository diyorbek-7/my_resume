// ============================================================
//  Simple interactive layer for resume site
//  - Smooth scrolling
//  - Mobile nav toggle
//  - Dark mode toggle with localStorage
//  - Scroll reveal animations
//  - Animated skill bars
//  - Back to top button
// ============================================================

(function () {
  const body = document.body;
  const nav = document.querySelector(".nav");
  const navToggle = document.getElementById("nav-menu-toggle");
  const navLinks = document.querySelectorAll(".nav-link");
  const themeToggle = document.getElementById("theme-toggle");
  const backToTop = document.getElementById("back-to-top");
  const revealSections = document.querySelectorAll(".reveal");
  const skillBars = document.querySelectorAll(".skill-bar");
  const yearSpan = document.getElementById("year");
  const starfieldCanvas = document.getElementById("starfield");
  const tiltCards = document.querySelectorAll("[data-tilt]");
  const sections = document.querySelectorAll("main section[id]");

  // Feature flags for motion / pointer effects
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const prefersReducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  // Configurable strengths (also see related CSS custom properties)
  const TILT_MAX_DEG = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--tilt-strength"
    ) || "9"
  );

  // Starfield configuration (tweakable constants)
  const STAR_COUNT = 200; // Number of stars (increase for denser field)
  const STAR_SPEED = 0.5; // Pixels per frame (drift speed)
  const STAR_GLOW = 0.8; // Brightness/glow intensity (0-1)
  const PARALLAX_MOUSE = 0.3; // Mouse parallax strength (0-1, lower = subtler)

  // ------------------------------------------------------------
  // Utility: Smooth scroll with offset for sticky header
  // ------------------------------------------------------------
  function smoothScrollTo(targetId) {
    const element = document.querySelector(targetId);
    if (!element) return;

    const header = document.querySelector(".header");
    const headerHeight = header ? header.offsetHeight : 0;
    const rect = element.getBoundingClientRect();
    const offset = window.pageYOffset + rect.top - headerHeight - 8;

    window.scrollTo({
      top: offset < 0 ? 0 : offset,
      behavior: "smooth",
    });
  }

  // ------------------------------------------------------------
  // Navigation: mobile toggle & smooth scroll for links
  // ------------------------------------------------------------
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      navToggle.classList.toggle("is-open", isOpen);
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        event.preventDefault();
        // Close mobile nav if open
        if (nav && nav.classList.contains("is-open")) {
          nav.classList.remove("is-open");
          navToggle && navToggle.classList.remove("is-open");
        }
        smoothScrollTo(href);
      }
    });
  });

  // ------------------------------------------------------------
  // Dark mode toggle with localStorage persistence
  // ------------------------------------------------------------
  const THEME_KEY = "diyorbek-theme";

  function applyTheme(theme) {
    if (theme === "light") {
      body.classList.add("theme-light");
    } else {
      body.classList.remove("theme-light");
    }
  }

  function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;

    // Fallback to system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }

  function initTheme() {
    try {
      const preferred = getPreferredTheme();
      applyTheme(preferred);
    } catch (e) {
      // localStorage may be unavailable; default to dark
      applyTheme("dark");
    }
  }

  function toggleTheme() {
    const isLight = body.classList.contains("theme-light");
    const nextTheme = isLight ? "dark" : "light";
    applyTheme(nextTheme);
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch (e) {
      // Ignore storage errors
    }
  }

  initTheme();

  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // ------------------------------------------------------------
  // Scroll reveal animations using IntersectionObserver
  // ------------------------------------------------------------
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.18,
      }
    );

    revealSections.forEach((section) => revealObserver.observe(section));
  } else {
    // Fallback: show all sections
    revealSections.forEach((section) => section.classList.add("is-visible"));
  }

  // ------------------------------------------------------------
  // Animated skill bars on scroll into view
  // ------------------------------------------------------------
  if (skillBars.length && "IntersectionObserver" in window) {
    const skillsObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const bar = entry.target;
            const target = parseInt(bar.getAttribute("data-level") || "0", 10);
            const fill = bar.querySelector(".skill-bar-fill");
            if (fill) {
              fill.style.setProperty("--skill-target", `${target}%`);
              bar.classList.add("animate");
            }
            observer.unobserve(bar);
          }
        });
      },
      { threshold: 0.4 }
    );

    skillBars.forEach((bar) => skillsObserver.observe(bar));
  } else {
    // Immediate fill for environments without IntersectionObserver
    skillBars.forEach((bar) => {
      const target = parseInt(bar.getAttribute("data-level") || "0", 10);
      const fill = bar.querySelector(".skill-bar-fill");
      if (fill) {
        fill.style.width = `${target}%`;
      }
    });
  }

  // ------------------------------------------------------------
  // Back to top button behavior
  // ------------------------------------------------------------
  function handleScroll() {
    const showAfter = 220;
    if (!backToTop) return;

    if (window.scrollY > showAfter) {
      backToTop.classList.add("visible");
    } else {
      backToTop.classList.remove("visible");
    }
  }

  window.addEventListener("scroll", handleScroll, { passive: true });

  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ------------------------------------------------------------
  // Footer year
  // ------------------------------------------------------------
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // ------------------------------------------------------------
  // Starfield Canvas Animation
  // ------------------------------------------------------------
  if (starfieldCanvas && !prefersReducedMotion) {
    const ctx = starfieldCanvas.getContext("2d");
    let stars = [];
    let mouseX = 0;
    let mouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;
    let animationId = null;

    // Resize canvas to match viewport
    function resizeCanvas() {
      starfieldCanvas.width = window.innerWidth;
      starfieldCanvas.height = window.innerHeight;
    }

    // Initialize stars
    function initStars() {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * starfieldCanvas.width,
          y: Math.random() * starfieldCanvas.height,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          speed: Math.random() * STAR_SPEED + STAR_SPEED * 0.5,
        });
      }
    }

    // Draw stars
    function drawStars() {
      ctx.clearRect(0, 0, starfieldCanvas.width, starfieldCanvas.height);
      ctx.fillStyle = body.classList.contains("theme-light")
        ? "rgba(15, 23, 42, 0.1)"
        : "rgba(255, 255, 255, 1)";

      stars.forEach((star) => {
        // Apply mouse parallax offset
        const parallaxX = (currentMouseX - 0.5) * PARALLAX_MOUSE * 20;
        const parallaxY = (currentMouseY - 0.5) * PARALLAX_MOUSE * 20;

        let x = star.x + parallaxX;
        let y = star.y + parallaxY;

        // Wrap around edges
        if (x < 0) x += starfieldCanvas.width;
        if (x > starfieldCanvas.width) x -= starfieldCanvas.width;
        if (y < 0) y += starfieldCanvas.height;
        if (y > starfieldCanvas.height) y -= starfieldCanvas.height;

        // Draw star with glow
        ctx.globalAlpha = star.opacity * STAR_GLOW;
        ctx.beginPath();
        ctx.arc(x, y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw glow ring for larger stars
        if (star.radius > 1) {
          ctx.globalAlpha = star.opacity * STAR_GLOW * 0.3;
          ctx.beginPath();
          ctx.arc(x, y, star.radius * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1;
    }

    // Update star positions (drift downward)
    function updateStars() {
      stars.forEach((star) => {
        star.y += star.speed;
        if (star.y > starfieldCanvas.height) {
          star.y = 0;
          star.x = Math.random() * starfieldCanvas.width;
        }
      });
    }

    // Animation loop
    function animate() {
      if (prefersReducedMotion) return;

      // Ease mouse position for smooth parallax
      currentMouseX += (mouseX - currentMouseX) * 0.1;
      currentMouseY += (mouseY - currentMouseY) * 0.1;

      updateStars();
      drawStars();
      animationId = requestAnimationFrame(animate);
    }

    // Mouse move handler (only on desktop)
    if (!isTouchDevice) {
      window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX / window.innerWidth;
        mouseY = e.clientY / window.innerHeight;
      });
    }

    // Initialize and start
    resizeCanvas();
    initStars();
    animate();

    // Handle resize
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
        initStars();
      }, 100);
    });
  } else if (starfieldCanvas) {
    // Fallback: static dark background if reduced motion
    const ctx = starfieldCanvas.getContext("2d");
    starfieldCanvas.width = window.innerWidth;
    starfieldCanvas.height = window.innerHeight;
    ctx.fillStyle = body.classList.contains("theme-light") ? "#f4f4f8" : "#050814";
    ctx.fillRect(0, 0, starfieldCanvas.width, starfieldCanvas.height);
  }


  // ------------------------------------------------------------
  // Card tilt + shine micro-interaction
  // ------------------------------------------------------------
  if (tiltCards.length && !isTouchDevice && !prefersReducedMotion) {
    tiltCards.forEach((card) => {
      let rect;

      function updateTransform(e) {
        if (!rect) rect = card.getBoundingClientRect();

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const x = (e.clientX - centerX) / (rect.width / 2); // -1 to 1
        const y = (e.clientY - centerY) / (rect.height / 2); // -1 to 1

        const rotateX = Math.max(Math.min(-y * TILT_MAX_DEG, TILT_MAX_DEG), -TILT_MAX_DEG);
        const rotateY = Math.max(Math.min(x * TILT_MAX_DEG, TILT_MAX_DEG), -TILT_MAX_DEG);

        const pointerX = ((e.clientX - rect.left) / rect.width) * 100;
        const pointerY = ((e.clientY - rect.top) / rect.height) * 100;

        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
        card.style.setProperty("--pointer-x", `${pointerX}%`);
        card.style.setProperty("--pointer-y", `${pointerY}%`);
      }

      card.addEventListener("mouseenter", () => {
        rect = card.getBoundingClientRect();
        card.classList.add("is-tilting");
      });

      card.addEventListener("mousemove", updateTransform);

      card.addEventListener("mouseleave", () => {
        card.classList.remove("is-tilting");
        card.style.transform = "";
      });
    });
  }

  // ------------------------------------------------------------
  // Active navigation link based on visible section
  // ------------------------------------------------------------
  if ("IntersectionObserver" in window && sections.length && navLinks.length) {
    const navById = {};
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        const id = href.slice(1);
        navById[id] = link;
      }
    });

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            Object.values(navById).forEach((lnk) =>
              lnk.classList.remove("active")
            );
            const active = navById[id];
            if (active) active.classList.add("active");
          }
        });
      },
      { threshold: 0.4 }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }
})();


