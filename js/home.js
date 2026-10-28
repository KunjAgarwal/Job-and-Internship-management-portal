// CareerConnect - Home Page JavaScript

document.addEventListener("DOMContentLoaded", () => {
    console.log("CareerConnect home page loaded successfully.");

    // Highlight the active navigation link
    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".navbar nav a").forEach(link => {
        const linkPage = link.getAttribute("href").split("/").pop();

        if (linkPage === currentPage) {
            link.classList.add("active");
        }
    });

    // Handle clicks on opportunity buttons
    document.querySelectorAll(".hero-buttons a, .cta a").forEach(button => {
        button.addEventListener("click", () => {
            console.log(`Navigating to: ${button.textContent.trim()}`);
        });
    });
});
