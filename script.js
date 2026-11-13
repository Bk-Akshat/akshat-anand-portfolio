
/* =====================================================
   AKSHAT ANAND - PORTFOLIO JAVASCRIPT
   Interactive Features
   ===================================================== */


/* ================= 1. LUCIDE ICONS ================= */

function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}


/* ================= 2. DARK / LIGHT THEME ================= */

const themeToggle = document.getElementById("theme-toggle");

function setTheme(theme) {

    document.documentElement.setAttribute("data-theme", theme);

    // Save selected theme
    localStorage.setItem("portfolio-theme", theme);

    // Update theme button icon
    if (themeToggle) {

        themeToggle.innerHTML =
            theme === "dark"
                ? '<i data-lucide="sun"></i>'
                : '<i data-lucide="moon"></i>';

        themeToggle.setAttribute(
            "aria-label",
            theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
        );

        refreshIcons();
    }
}


// Load saved theme
const savedTheme = localStorage.getItem("portfolio-theme") || "dark";

setTheme(savedTheme);


// Theme toggle click
if (themeToggle) {

    themeToggle.addEventListener("click", () => {

        const currentTheme =
            document.documentElement.getAttribute("data-theme");

        const newTheme =
            currentTheme === "dark" ? "light" : "dark";

        setTheme(newTheme);

    });

}


/* ================= 3. MOBILE NAVIGATION ================= */

const menuToggle = document.getElementById("menu-toggle");
const navMenu = document.getElementById("nav-menu");
const navLinks = document.querySelectorAll(".nav-link");


function closeMobileMenu() {

    if (!navMenu || !menuToggle) return;

    navMenu.classList.remove("open");

    menuToggle.innerHTML = '<i data-lucide="menu"></i>';

    menuToggle.setAttribute("aria-label", "Open navigation menu");

    menuToggle.setAttribute("aria-expanded", "false");

    refreshIcons();
}


// Toggle mobile menu
if (menuToggle && navMenu) {

    menuToggle.setAttribute("aria-expanded", "false");

    menuToggle.addEventListener("click", () => {

        const isOpen = navMenu.classList.toggle("open");

        menuToggle.innerHTML = isOpen
            ? '<i data-lucide="x"></i>'
            : '<i data-lucide="menu"></i>';

        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );

        menuToggle.setAttribute("aria-expanded", String(isOpen));

        refreshIcons();

    });

}


// Close menu after selecting a section
navLinks.forEach(link => {

    link.addEventListener("click", () => {
        closeMobileMenu();
    });

});


// Close menu when clicking outside
document.addEventListener("click", event => {

    if (
        navMenu &&
        menuToggle &&
        navMenu.classList.contains("open") &&
        !navMenu.contains(event.target) &&
        !menuToggle.contains(event.target)
    ) {

        closeMobileMenu();

    }

});


// Close mobile menu on Escape
document.addEventListener("keydown", event => {

    if (event.key === "Escape") {
        closeMobileMenu();
    }

});


// Reset menu when returning to desktop
window.addEventListener("resize", () => {

    if (window.innerWidth > 850) {
        closeMobileMenu();
    }

});


/* ================= 4. PROJECT FILTERS ================= */

const filterButtons = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card");


filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        // Remove active class from all filters
        filterButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        // Activate selected filter
        button.classList.add("active");

        const selectedFilter = button.dataset.filter;

        // Filter project cards (shown cards re-enter in 3D, staggered)
        let shown = 0;
        projectCards.forEach(card => {

            const category = card.dataset.category;

            const shouldShow =
                selectedFilter === "all" ||
                category === selectedFilter;

            card.classList.toggle("hidden", !shouldShow);

            if (shouldShow) {
                card.style.setProperty("--d", `${shown * 0.07}s`);
                shown++;
            }

        });

    });

});


/* ================= 5. SCROLL REVEAL ANIMATIONS ================= */

// Add reveal classes to selected sections
const revealElements = document.querySelectorAll(
    ".section-heading, .about-content, .stat-card, " +
    ".skill-category, .project-card, .timeline-item, " +
    ".certification-card, .contact-box"
);


revealElements.forEach((element, index) => {

    element.classList.add("reveal");

    // Slight stagger between adjacent elements
    if (
        element.classList.contains("stat-card") ||
        element.classList.contains("skill-category") ||
        element.classList.contains("project-card") ||
        element.classList.contains("certification-card")
    ) {

        element.style.setProperty("--d", `${(index % 3) * 0.08}s`);

    }

});


// Observe elements entering the screen
if ("IntersectionObserver" in window) {

    const revealObserver = new IntersectionObserver(

        (entries, observer) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("revealed");

                    observer.unobserve(entry.target);

                }

            });

        },

        {
            threshold: 0.12,
            rootMargin: "0px 0px -35px 0px"
        }

    );


    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

} else {

    revealElements.forEach(element => {
        element.classList.add("revealed");
    });

}


/* ================= 6. ACTIVE NAVBAR LINKS ================= */

const sections = document.querySelectorAll("main section[id]");


if ("IntersectionObserver" in window) {

    const sectionObserver = new IntersectionObserver(

        entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    const currentId = entry.target.id;

                    navLinks.forEach(link => {

                        const isActive =
                            link.getAttribute("href") === `#${currentId}`;

                        link.classList.toggle("active", isActive);

                    });

                }

            });

        },

        {
            rootMargin: "-35% 0px -55% 0px",
            threshold: 0
        }

    );


    sections.forEach(section => {
        sectionObserver.observe(section);
    });

}


/* ================= 7. HEADER SCROLL EFFECT ================= */

const header = document.getElementById("header");

function updateHeader() {

    if (!header) return;

    if (window.scrollY > 30) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }

}

window.addEventListener("scroll", updateHeader, { passive: true });

updateHeader();


/* ================= 8. DYNAMIC FOOTER YEAR ================= */

const currentYear = document.getElementById("current-year");

if (currentYear) {

    currentYear.textContent =
        `© ${new Date().getFullYear()}`;

}


/* ================= 9. INITIALIZE ICONS ================= */

document.addEventListener("DOMContentLoaded", () => {

    refreshIcons();

});

