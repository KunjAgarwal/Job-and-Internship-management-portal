// JSON Server-backed application management. Override API_BASE_URL before this
// file loads when JSON Server is hosted somewhere other than localhost:3000.
const API_BASE_URL = window.CAREERCONNECT_API_URL || "http://localhost:3000";
const STATUSES = ["applied", "in-review", "shortlisted", "selected", "rejected", "withdrawn"];

const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
const formatDate = value => value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not provided";
const idFromUrl = () => new URLSearchParams(location.search).get("id");
const statusLabel = status => ({ applied: "Applied", "in-review": "In Review", shortlisted: "Shortlisted", selected: "Selected", rejected: "Rejected", withdrawn: "Withdrawn" }[status] || "Applied");

async function api(path = "", options = {}) {
    const response = await fetch(`${API_BASE_URL}/applications${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    if (response.status === 204) return null;
    return response.json();
}

function notify(message, kind = "info") {
    let notice = document.getElementById("appNotice");
    if (!notice) {
        notice = document.createElement("div");
        notice.id = "appNotice";
        notice.className = "app-notice";
        notice.setAttribute("role", "status");
        document.body.prepend(notice);
    }
    notice.className = `app-notice ${kind}`;
    notice.textContent = message;
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("applicationForm")) initForm();
    if (document.querySelector(".applications-container")) initDashboard();
    if (document.querySelector(".details-layout")) initDetails();
});

async function initForm() {
    const form = document.getElementById("applicationForm");
    const params = new URLSearchParams(location.search);
    const title = params.get("title") || "Opportunity details unavailable";
    const company = params.get("company") || "Company not specified";
    const typeParam = (params.get("type") || "job").toLowerCase();
    const values = [title, company, params.get("location") || "Not specified", params.get("experience") || "Not specified"];
    document.getElementById("jobTitleDisplay").textContent = title;
    document.querySelector(".opportunity-card .company-name").textContent = company;
    document.querySelectorAll(".opportunity-details strong").forEach((node, i) => node.textContent = values[i + 1]);
    let profile = {};
    try { profile = JSON.parse(localStorage.getItem("careerConnectProfile") || "{}"); } catch (error) { console.warn("Saved applicant profile could not be read.", error); }
    ["name", "phone", "email"].forEach(key => { const input = document.getElementById(key); if (profile[key]) input.value = profile[key]; });
    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const name = form.elements.name.value.trim();
        const phone = form.elements.phone.value.trim();
        const email = form.elements.email.value.trim();
        if (name.split(/\s+/).join(" ").length < 2) return notify("Enter your full name.", "error");
        if (!/^\+?[0-9\s()-]{10,20}$/.test(phone)) return notify("Enter a valid phone number.", "error");
        const resume = form.elements.resume.value.trim();
        if (resume && !/^https?:\/\//i.test(resume)) return notify("Resume must be a valid http or https URL.", "error");
        const button = form.querySelector('[type="submit"]');
        button.disabled = true;
        button.textContent = "Submitting…";
        try {
            const existing = await api();
            const duplicate = existing.some(app => app.email?.toLowerCase() === email.toLowerCase() && app.title?.toLowerCase() === title.toLowerCase() && app.company?.toLowerCase() === company.toLowerCase() && app.status !== "withdrawn");
            if (duplicate) { notify("You have already applied for this opportunity with this email.", "error"); return; }
            const now = new Date().toISOString();
            const application = {
                title, company, type: typeParam.includes("intern") ? "internship" : "job",
                location: params.get("location") || "Not specified", experience: params.get("experience") || "Not specified",
                salary: params.get("salary") || "", name, phone, email, resume,
                skills: form.elements.skills.value.trim(), message: form.elements.message.value.trim(),
                status: "applied", appliedOn: now, updatedOn: now,
                history: [{ status: "applied", date: now }]
            };
            const saved = await api("", { method: "POST", body: JSON.stringify(application) });
            localStorage.setItem("careerConnectProfile", JSON.stringify({ name, phone, email }));
            location.href = `applications.html?submitted=${encodeURIComponent(saved.id)}`;
        } catch (error) {
            console.error(error);
            notify("Could not submit your application. Check that JSON Server is running.", "error");
        } finally {
            button.disabled = false;
            button.textContent = "Submit Application";
        }
    });
}

async function initDashboard() {
    const container = document.querySelector(".applications-container");
    const statusFilter = document.getElementById("applicationFilter");
    const search = document.getElementById("applicationSearch");
    const typeFilter = document.getElementById("typeFilter");
    const sort = document.getElementById("applicationSort");
    const pageSize = 6;
    let applications = [];
    let shown = pageSize;
    const refresh = document.getElementById("refreshApplications");
    const loadMore = document.getElementById("loadMoreApplications");
    const load = async () => {
        container.innerHTML = '<p class="loading-state">Loading applications…</p>';
        try {
            applications = await api();
            if (!Array.isArray(applications)) throw new Error("Invalid application response");
            render();
        } catch (error) {
            console.error(error);
            container.innerHTML = '<div class="empty-state"><h3>Could not load applications</h3><p>Start JSON Server and refresh this page.</p></div>';
            updateStats([]);
        }
    };
    const render = () => {
        const term = search.value.trim().toLowerCase();
        let rows = applications.filter(app => (statusFilter.value === "all" || app.status === statusFilter.value) && (typeFilter.value === "all" || app.type === typeFilter.value) && `${app.title} ${app.company}`.toLowerCase().includes(term));
        if (sort.value === "oldest") rows.sort((a, b) => new Date(a.appliedOn) - new Date(b.appliedOn));
        else if (sort.value === "alpha") rows.sort((a, b) => a.title.localeCompare(b.title));
        else rows.sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
        updateStats(applications);
        if (!rows.length) { container.innerHTML = '<div class="empty-state"><h3>No applications found</h3><p>Try clearing your filters or browse opportunities to get started.</p></div>'; loadMore.hidden = true; return; }
        container.innerHTML = rows.slice(0, shown).map(app => `<article class="application-card"><div class="card-top"><div class="company-logo">${escapeHTML((app.company || "?").split(/\s+/).map(w => w[0]).join("").slice(0, 3).toUpperCase())}</div><span class="application-status ${escapeHTML(app.status)}">${escapeHTML(statusLabel(app.status))}</span></div><div class="application-content"><span class="application-type">${app.type === "internship" ? "Internship" : "Job"}</span><h3>${escapeHTML(app.title)}</h3><p class="company-name">${escapeHTML(app.company)}</p><div class="application-info"><span>${escapeHTML(app.location || "Not specified")}</span><span>${formatDate(app.appliedOn)}</span></div></div><div class="card-footer"><a href="application_details.html?id=${encodeURIComponent(app.id)}">View Details</a></div></article>`).join("");
        loadMore.hidden = rows.length <= shown;
    };
    function updateStats(rows) {
        document.querySelectorAll("[data-stat]").forEach(node => {
            const stat = node.dataset.stat;
            node.textContent = stat === "total" ? rows.length : rows.filter(app => app.status === stat).length;
        });
    }
    [statusFilter, typeFilter, sort].forEach(el => el.addEventListener("change", () => { shown = pageSize; render(); }));
    search.addEventListener("input", () => { shown = pageSize; render(); });
    document.getElementById("clearApplicationFilters").addEventListener("click", () => { statusFilter.value = "all"; typeFilter.value = "all"; sort.value = "newest"; search.value = ""; shown = pageSize; render(); });
    refresh.addEventListener("click", load);
    loadMore.addEventListener("click", () => { shown += pageSize; render(); });
    if (new URLSearchParams(location.search).has("submitted")) notify("Your application was submitted successfully.", "success");
    await load();
}

async function initDetails() {
    const main = document.querySelector("main");
    const id = idFromUrl();
    if (!id) { main.innerHTML = '<section class="details-card"><h2>Application not found</h2><p>This link is missing its application ID.</p><a href="applications.html">Back to My Applications</a></section>'; return; }
    try {
        const app = await api(`/${encodeURIComponent(id)}`);
        const set = (selector, value) => { const node = document.querySelector(selector); if (node) node.textContent = value || "Not provided"; };
        document.querySelector(".details-page-header h1").textContent = app.title;
        set(".details-company", `${app.company} · ${app.location}`);
        const badge = document.querySelector(".details-page-header .application-status"); badge.className = `application-status ${app.status}`; badge.textContent = statusLabel(app.status);
        const values = document.querySelectorAll(".details-main .details-card:nth-child(1) .info-item strong");
        [app.title, app.company, app.location, app.type === "internship" ? "Internship" : "Job", app.experience, app.salary || "Not provided"].forEach((v, i) => { if (values[i]) values[i].textContent = v || "Not provided"; });
        const applicant = document.querySelectorAll(".details-main .details-card:nth-child(2) .info-item strong");
        [app.name, app.email, app.phone, app.skills || "Not provided", app.experience || "Not provided"].forEach((v, i) => { if (applicant[i]) applicant[i].textContent = v || "Not provided"; });
        const resume = document.querySelector(".resume-link");
        if (app.resume) { resume.href = app.resume; resume.target = "_blank"; resume.rel = "noopener noreferrer"; }
        else { resume.removeAttribute("href"); resume.textContent = "No resume provided"; }
        set(".cover-message", app.message || "No cover message was provided.");
        set("#submittedDate", formatDate(app.appliedOn)); set("#updatedDate", formatDate(app.updatedOn || app.appliedOn));
        set(".status-display strong", statusLabel(app.status));
        set(".status-display p", `Application status: ${statusLabel(app.status)}.`);
        renderTimeline(app);
        const withdraw = document.getElementById("withdrawApplication");
        if (app.status === "withdrawn") { withdraw.disabled = true; withdraw.textContent = "Application Withdrawn"; }
        withdraw.addEventListener("click", async () => {
            if (app.status === "withdrawn" || !confirm("Withdraw this application? It will remain in your application history.")) return;
            withdraw.disabled = true;
            const now = new Date().toISOString();
            try {
                await api(`/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status: "withdrawn", updatedOn: now, history: [...(app.history || [{ status: "applied", date: app.appliedOn }]), { status: "withdrawn", date: now }] }) });
                location.reload();
            } catch (error) { console.error(error); notify("Could not withdraw this application. Please try again.", "error"); withdraw.disabled = false; }
        });
    } catch (error) {
        console.error(error);
        main.innerHTML = '<section class="details-card"><h2>Application unavailable</h2><p>Could not load this application. Check JSON Server or return to the dashboard.</p><a href="applications.html">Back to My Applications</a></section>';
    }
}

function renderTimeline(app) {
    const timeline = document.querySelector(".timeline");
    const history = app.history || [{ status: "applied", date: app.appliedOn }];
    const events = history.map(item => ({ title: item.status === "in-review" ? "Under Review" : item.status === "shortlisted" ? "Shortlisted" : item.status === "selected" || item.status === "rejected" ? "Final Decision: " + statusLabel(item.status) : item.status === "withdrawn" ? "Application Withdrawn" : "Application Submitted", date: item.date }));
    if (app.interview) events.push({ title: "Interview Scheduled", date: app.interview.date, detail: [app.interview.time, app.interview.mode, app.interview.link, app.interview.instructions].filter(Boolean).join(" · ") });
    timeline.innerHTML = events.map((event, i) => `<div class="timeline-item active"><span class="timeline-dot"></span><div><strong>${escapeHTML(event.title)}</strong><p>${formatDate(event.date)}${event.detail ? ` · ${escapeHTML(event.detail)}` : ""}</p></div></div>`).join("");
}
