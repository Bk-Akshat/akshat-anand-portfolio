/* =====================================================
   3D INTERACTION EFFECTS
   - Cards tilt toward the cursor, with a moving highlight
   - The hero profile scene leans toward the cursor
     (and gently sways on touch screens)
   - Primary buttons pull slightly toward the cursor
   ===================================================== */

(function () {
    "use strict";

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));


    /* ================= 1. CARD TILT ================= */

    // [selector, maximum tilt in degrees]
    const tiltTargets = [
        [".stat-card", 9],
        [".skill-category", 7],
        [".project-card", 7],
        [".certification-card", 8],
        [".contact-box", 2.5]
    ];

    if (!reduceMotion && canHover) {

        tiltTargets.forEach(([selector, maxTilt]) => {

            document.querySelectorAll(selector).forEach(card => {

                card.classList.add("tilt-card");

                let frame = 0;
                let lastEvent = null;

                card.addEventListener("pointerenter", event => {
                    if (event.pointerType === "touch") return;
                    card.classList.add("is-tilting");
                });

                card.addEventListener("pointermove", event => {

                    if (event.pointerType === "touch") return;

                    lastEvent = event;
                    if (frame) return;

                    frame = requestAnimationFrame(() => {

                        frame = 0;

                        const rect = card.getBoundingClientRect();
                        const x = (lastEvent.clientX - rect.left) / rect.width;
                        const y = (lastEvent.clientY - rect.top) / rect.height;

                        card.style.setProperty("--rx", `${((0.5 - y) * 2 * maxTilt).toFixed(2)}deg`);
                        card.style.setProperty("--ry", `${((x - 0.5) * 2 * maxTilt).toFixed(2)}deg`);
                        card.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
                        card.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
                        card.style.setProperty("--px", (x * 2 - 1).toFixed(2));
                        card.style.setProperty("--py", (y * 2 - 1).toFixed(2));
                    });
                });

                card.addEventListener("pointerleave", () => {

                    card.classList.remove("is-tilting");

                    ["--rx", "--ry", "--px", "--py"].forEach(name => {
                        card.style.removeProperty(name);
                    });
                });
            });
        });
    }


    /* ================= 2. HERO SCENE LEAN ================= */

    const hero = document.getElementById("home");
    const heroVisual = document.querySelector(".hero-visual");

    if (hero && heroVisual && !reduceMotion) {

        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;

        let pointerSeen = false;
        let heroInView = true;

        const startTime = performance.now();

        hero.addEventListener("pointermove", event => {

            if (event.pointerType === "touch") return;

            pointerSeen = true;

            const rect = heroVisual.getBoundingClientRect();

            targetX = clamp(
                (event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2),
                -1, 1
            );

            targetY = clamp(
                (event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2),
                -1, 1
            );
        });

        hero.addEventListener("pointerleave", () => {
            targetX = 0;
            targetY = 0;
        });

        if ("IntersectionObserver" in window) {
            new IntersectionObserver(entries => {
                heroInView = entries[0].isIntersecting;
            }).observe(hero);
        }

        function tick(now) {

            requestAnimationFrame(tick);

            if (!heroInView || document.hidden) return;

            // No mouse (touch devices): slow automatic sway instead
            if (!pointerSeen) {
                const t = (now - startTime) / 1000;
                targetX = Math.sin(t * 0.6) * 0.6;
                targetY = Math.cos(t * 0.45) * 0.35;
            }

            currentX += (targetX - currentX) * 0.07;
            currentY += (targetY - currentY) * 0.07;

            // Softer lean on narrow screens, where the visual spans the full width
            const strength = window.innerWidth < 850 ? 0.5 : 1;

            heroVisual.style.setProperty("--ry", `${(currentX * 14 * strength).toFixed(2)}deg`);
            heroVisual.style.setProperty("--rx", `${(-currentY * 10 * strength).toFixed(2)}deg`);
        }

        requestAnimationFrame(tick);
    }


    /* ================= 3. MAGNETIC BUTTONS ================= */

    if (!reduceMotion && canHover) {

        document.querySelectorAll(".btn-primary, .nav-contact").forEach(button => {

            button.addEventListener("pointermove", event => {

                const rect = button.getBoundingClientRect();

                const dx = event.clientX - (rect.left + rect.width / 2);
                const dy = event.clientY - (rect.top + rect.height / 2);

                button.style.translate = `${(dx * 0.22).toFixed(1)}px ${(dy * 0.3).toFixed(1)}px`;
            });

            button.addEventListener("pointerleave", () => {
                button.style.translate = "";
            });
        });
    }

})();
