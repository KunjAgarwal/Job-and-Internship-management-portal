const STORAGE_KEY = "careerConnectApplications";
const PROFILE_KEY = "careerConnectProfile";
const STATUS_LABELS = { applied: "Applied", "in-review": "Under review", shortlisted: "Shortlisted", interview: "Interview", selected: "Selected", rejected: "Rejected", withdrawn: "Withdrawn" };
const PENDING_STATUSES = ["applied", "in-review"];

function escapeHTML(value = "") {
    return readableText(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function readableText(value = "") {
    return String(value).replaceAll("â‚¹", "₹").replaceAll("â€“", "–").replaceAll("Â·", "·");
}

function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function readApplications(seed) {
    const stored = CareerConnectData.read(STORAGE_KEY, null);
    if (stored !== null) return Array.isArray(stored) ? stored : seed;
    CareerConnectData.write(STORAGE_KEY, seed);
    return seed;
}

function saveApplications(applications) {
    try {
        CareerConnectData.write(STORAGE_KEY, applications);
        return true;
    } catch (error) {
        console.error("Unable to save applications:", error);
        return false;
    }
}

function showPageError(error) {
    console.error("Unable to initialize the application page:", error);
    const main = document.querySelector("main");
    if (!main) return;
    const message = document.createElement("p");
    message.className = "page-error";
    message.setAttribute("role", "alert");
    message.textContent = `This page could not be loaded: ${error.message}`;
    main.prepend(message);
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".nav-toggle")?.addEventListener("click", event => {
        const button = event.currentTarget;
        const expanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!expanded));
        document.getElementById(button.getAttribute("aria-controls"))?.classList.toggle("is-open", !expanded);
    });
    const form = document.getElementById("applicationForm");
    if (form) initializeApplicationForm(form).catch(showPageError);
    if (document.querySelector(".applications-container")) initializeApplicationsDashboard().catch(showPageError);
    if (document.querySelector(".details-layout")) initializeApplicationDetails().catch(showPageError);
});

async function initializeApplicationsDashboard() {
    const data = await CareerConnectData.load();
    const container = document.querySelector(".applications-container");
    const search = document.getElementById("applicationSearch");
    const sort = document.getElementById("applicationSort");
    const tabs = [...document.querySelectorAll(".application-tab")];
    let activeStatus = "all";

    function render() {
        const applications = readApplications(data.applications);
        const count = status => status === "all" ? applications.length : status === "pending"
            ? applications.filter(app => PENDING_STATUSES.includes(app.status)).length
            : applications.filter(app => app.status === status).length;
        const groups = {
            total: count("all"),
            pending: count("pending"),
            shortlisted: count("shortlisted"),
            interview: count("interview"),
            selected: count("selected"),
            rejected: count("rejected"),
            withdrawn: count("withdrawn")
        };
        Object.entries(groups).forEach(([key, value]) => {
            const stat = document.querySelector(`[data-stat="${key}"]`);
            const tabCount = document.querySelector(`[data-tab-count="${key === "total" ? "all" : key}"]`);
            if (stat) stat.textContent = value;
            if (tabCount) tabCount.textContent = value;
        });
        let visible = applications.filter(app => {
            const matchesStatus = activeStatus === "all" || (activeStatus === "pending" ? PENDING_STATUSES.includes(app.status) : app.status === activeStatus);
            const query = search.value.trim().toLowerCase();
            return matchesStatus && (!query || `${app.title} ${app.company} ${app.location}`.toLowerCase().includes(query));
        });
        visible.sort((a, b) => (new Date(a.appliedOn) - new Date(b.appliedOn)) * (sort.value === "oldest" ? 1 : -1));
        if (!visible.length) {
            container.innerHTML = `<div class="empty-state"><span class="empty-icon" aria-hidden="true">⌕</span><h3>${applications.length ? "No matching applications" : "Your next opportunity starts here"}</h3><p>${applications.length ? "Try another search or status filter." : "Explore open roles and keep every application organized in one place."}</p><a class="browse-btn" href="../jobs/jobs.html">Browse opportunities</a></div>`;
            return;
        }
        container.innerHTML = visible.map(app => {
            const initials = app.company.split(/\s+/).map(word => word[0] || "").join("").slice(0, 3).toUpperCase();
            const status = STATUS_LABELS[app.status] || "Applied";
            return `<article class="application-card"><div class="application-card-head"><div class="company-logo" aria-hidden="true">${escapeHTML(initials)}</div><span class="application-status ${escapeHTML(app.status)}">${escapeHTML(status)}</span></div><span class="application-type">${app.type === "internship" ? "Internship" : "Full-time job"}</span><h3>${escapeHTML(app.title)}</h3><p class="company-name">${escapeHTML(app.company)}</p><div class="application-info"><span><b aria-hidden="true">⌖</b>${escapeHTML(app.location || "Location not specified")}</span><span><b aria-hidden="true">◷</b>Applied ${escapeHTML(formatDate(app.appliedOn))}</span></div><div class="card-footer"><a href="application_details.html?id=${encodeURIComponent(app.id)}">View details <span aria-hidden="true">→</span></a>${app.status !== "withdrawn" && !["selected", "rejected"].includes(app.status) ? `<button class="card-withdraw" type="button" data-withdraw="${escapeHTML(app.id)}">Withdraw</button>` : ""}</div></article>`;
        }).join("");
        container.querySelectorAll("[data-withdraw]").forEach(button => button.addEventListener("click", () => {
            if (!confirm("Are you sure you want to withdraw this application? This cannot be undone.")) return;
            const applicationId = button.dataset.withdraw;
            const updated = readApplications(data.applications).map(app => app.id === applicationId ? { ...app, status: "withdrawn", withdrawnOn: new Date().toISOString() } : app);
            if (saveApplications(updated)) render();
            else alert("Unable to withdraw this application. Please check browser storage and try again.");
        }));
    }
    search.addEventListener("input", render);
    sort.addEventListener("change", render);
    tabs.forEach(tab => tab.addEventListener("click", () => {
        activeStatus = tab.dataset.status;
        tabs.forEach(item => {
            const selected = item === tab;
            item.classList.toggle("is-active", selected);
            item.setAttribute("aria-pressed", String(selected));
        });
        render();
    }));
    render();
}

async function initializeApplicationForm(form) {
    const data = await CareerConnectData.load();
    const params = new URLSearchParams(location.search);
    const selectedOpportunity = params.has("opportunity")
        ? data.opportunities.find(item => item.id === params.get("opportunity"))
        : data.opportunities[0];
    const profile = CareerConnectData.read(PROFILE_KEY, data.user);
    if (localStorage.getItem(PROFILE_KEY) === null) CareerConnectData.write(PROFILE_KEY, profile);
    const field = id => document.getElementById(id);
    const fields = { name: field("name"), phone: field("phone"), email: field("email"), resume: field("resume"), message: field("message") };
    fields.name.value = profile.name || "";
    fields.phone.value = profile.phone || "";
    fields.email.value = profile.email || "";
    fields.resume.value = profile.resume || "";
    if (!selectedOpportunity) throw new Error("This opportunity could not be found. Please return to the jobs page and choose an active listing.");

    field("jobTitleDisplay").textContent = selectedOpportunity.title;
    document.querySelector(".opportunity-card .company-name").textContent = selectedOpportunity.company;
    document.querySelector(".large-logo").textContent = selectedOpportunity.companyInitials || selectedOpportunity.company.slice(0, 2).toUpperCase();
    const details = document.querySelectorAll(".opportunity-details strong");
    [selectedOpportunity.employmentType, selectedOpportunity.location, selectedOpportunity.experience].forEach((value, index) => details[index].textContent = readableText(value || "Not specified"));
    field("opportunitySalary").textContent = readableText(selectedOpportunity.salary || "Not specified");

    const resumeFile = field("resumeFile");
    resumeFile.addEventListener("change", () => {
        const file = resumeFile.files[0];
        field("resumePreview").textContent = file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : "No file selected.";
        clearError("resume");
    });
    form.querySelectorAll("input, textarea").forEach(input => input.addEventListener("input", () => clearError(input.id)));
    form.addEventListener("submit", async event => {
        event.preventDefault();
        field("formFeedback").textContent = "";
        const name = fields.name.value.trim();
        const phone = fields.phone.value.trim();
        const email = fields.email.value.trim();
        const resumeUrl = fields.resume.value.trim();
        const file = resumeFile.files[0];
        const errors = {};
        if (name.length < 2) errors.name = "Enter your full name (at least 2 characters).";
        if (!/^\+?[0-9\s()-]{10,20}$/.test(phone)) errors.phone = "Enter a valid phone number.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
        if (resumeUrl) {
            try { if (!["http:", "https:"].includes(new URL(resumeUrl).protocol)) throw new Error(); }
            catch { errors.resume = "Use a valid link starting with https://, or upload a PDF."; }
        }
        if (!resumeUrl && !file) errors.resume = "Add a resume link or upload a PDF to continue.";
        if (file && (file.type !== "application/pdf" || file.size > 2 * 1024 * 1024)) errors.resume = "Choose a PDF file smaller than 2 MB.";
        Object.entries(errors).forEach(([id, message]) => showError(id, message));
        const firstInvalid = Object.keys(errors)[0];
        if (firstInvalid) { field(firstInvalid === "resume" && !resumeUrl ? "resumeFile" : firstInvalid).focus(); return; }

        let resume = resumeUrl;
        if (file) {
            try { resume = await readFileAsDataURL(file); }
            catch { showError("resume", "We couldn’t read that file. Please try again."); return; }
        }
        const applications = readApplications(data.applications);
        const duplicate = applications.some(app => app.status !== "withdrawn" && app.opportunityId === selectedOpportunity.id);
        if (duplicate) { field("formFeedback").textContent = "You have already applied for this opportunity."; return; }
        const application = {
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            opportunityId: selectedOpportunity.id, title: selectedOpportunity.title, company: selectedOpportunity.company,
            type: selectedOpportunity.type, location: selectedOpportunity.location, experience: selectedOpportunity.experience,
            salary: selectedOpportunity.salary, description: selectedOpportunity.description, requiredSkills: selectedOpportunity.skills,
            name, phone, email, resume, resumeName: file?.name || "", education: field("education").value.trim(),
            college: field("college").value.trim(), skills: field("skills").value.split(",").map(skill => skill.trim()).filter(Boolean),
            message: fields.message.value.trim(), availability: field("availability").value.trim(),
            additionalInfo: field("workAuthorization").value.trim(), status: "applied", appliedOn: new Date().toISOString()
        };
        applications.unshift(application);
        if (!saveApplications(applications)) { field("formFeedback").textContent = "Unable to save this application. Check available browser storage and try again."; return; }
        try { CareerConnectData.write(PROFILE_KEY, { ...profile, name, phone, email, resume: resumeUrl || profile.resume }); }
        catch (error) { console.warn("Application saved; profile details could not be updated.", error); }
        location.href = `application_details.html?id=${encodeURIComponent(application.id)}`;
    });

    function showError(id, message) {
        const error = document.querySelector(`[data-error="${id}"]`);
        if (error) error.textContent = message;
        field(id)?.setAttribute("aria-invalid", "true");
    }
    function clearError(id) {
        const error = document.querySelector(`[data-error="${id}"]`);
        if (error) error.textContent = "";
        field(id)?.removeAttribute("aria-invalid");
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

async function initializeApplicationDetails() {
    const data = await CareerConnectData.load();
    const applications = readApplications(data.applications);
    const id = new URLSearchParams(location.search).get("id");
    const application = applications.find(item => item.id === id) || (!id ? applications[0] : null);
    if (!application) {
        document.querySelector(".details-layout").innerHTML = `<div class="empty-state"><h2>Application not found</h2><p>This application may have been removed or the link may be invalid.</p><a class="browse-btn" href="applications.html">Back to my applications</a></div>`;
        return;
    }
    const opportunity = data.opportunities.find(item => item.id === application.opportunityId) || {};
    const setText = (selector, value, fallback = "Not provided") => { const node = document.querySelector(selector); if (node) node.textContent = readableText(value || fallback); };
    document.title = `${application.title} application | CareerConnect`;
    setText(".details-title h1", application.title);
    setText(".details-company", `${application.company} · ${application.location || "Location not specified"}`);
    setText(".details-company-logo", opportunity.companyInitials || application.company.split(/\s+/).map(word => word[0]).join("").slice(0, 3).toUpperCase());
    const badge = document.querySelector(".details-page-header .application-status");
    badge.className = `application-status ${escapeHTML(application.status)}`;
    badge.textContent = STATUS_LABELS[application.status] || "Applied";
    const jobValues = document.querySelectorAll(".details-main .details-card:first-child .info-item strong");
    [application.title, application.company, application.location, application.type === "internship" ? "Internship" : "Full-time", application.salary || opportunity.salary, formatDate(application.appliedOn)].forEach((value, index) => jobValues[index].textContent = readableText(value || "Not specified"));
    setText("#detailDescription", application.description || opportunity.description, "Description not available.");
    const requiredSkills = application.requiredSkills || opportunity.skills || [];
    document.querySelector("#detailSkills").innerHTML = requiredSkills.length ? requiredSkills.map(skill => `<span>${escapeHTML(skill)}</span>`).join("") : "<span>Not specified</span>";
    const applicantValues = document.querySelectorAll(".details-main .details-card:nth-child(2) .info-item strong");
    [application.name, application.email, application.phone].forEach((value, index) => applicantValues[index].textContent = value || "Not provided");
    setText("#detailEducation", application.education);
    setText("#detailCollege", application.college);
    setText("#detailApplicantSkills", Array.isArray(application.skills) ? application.skills.join(", ") : application.skills);
    setText("#detailAvailability", application.availability);
    setText("#detailAdditionalInfo", application.additionalInfo);
    const resumeLink = document.querySelector(".resume-link");
    if (application.resume) {
        resumeLink.href = application.resume;
        resumeLink.target = "_blank";
        resumeLink.rel = "noopener noreferrer";
        resumeLink.textContent = application.resumeName ? `View ${application.resumeName}` : "View resume";
        if (application.resume.startsWith("data:application/pdf")) resumeLink.download = application.resumeName || "resume.pdf";
    } else { resumeLink.removeAttribute("href"); resumeLink.textContent = "No resume provided"; }
    setText(".cover-message", application.message);
    const status = STATUS_LABELS[application.status] || "Applied";
    setText(".status-display strong", status);
    setText(".status-display p", statusDescription(application.status));
    setText(".status-date strong", formatDate(application.appliedOn));
    renderTimeline(application);
    const withdrawButton = document.querySelector(".withdraw-card button");
    if (application.status === "withdrawn") { withdrawButton.disabled = true; withdrawButton.textContent = "Application withdrawn"; }
    else withdrawButton.addEventListener("click", () => {
        if (!confirm("Are you sure you want to withdraw this application? This cannot be undone.")) return;
        const updated = readApplications(data.applications).map(item => item.id === application.id ? { ...item, status: "withdrawn", withdrawnOn: new Date().toISOString() } : item);
        if (saveApplications(updated)) location.reload();
        else alert("Unable to withdraw this application. Please check browser storage and try again.");
    });
}

function statusDescription(status) {
    return ({ applied: "Your application has been submitted to the employer.", "in-review": "The employer is reviewing your application.", shortlisted: "You have been shortlisted for the next step.", interview: "You have progressed to the interview stage.", selected: "Congratulations, you have been selected.", rejected: "The employer has closed this application.", withdrawn: "You withdrew this application." })[status] || "Your application has been submitted to the employer.";
}

function renderTimeline(application) {
    const state = application.status;
    const current = ({ applied: 0, "in-review": 1, shortlisted: 2, interview: 3, selected: 4, rejected: 4, withdrawn: 0 })[state] ?? 0;
    const names = ["Applied", "Under review", "Shortlisted", "Interview", state === "rejected" ? "Not selected" : "Selected"];
    const descriptions = [formatDate(application.appliedOn), "Employer review", "Next stage", "Interview stage", state === "rejected" ? "Application closed" : "Final outcome"];
    document.querySelector(".timeline").innerHTML = names.map((name, index) => {
        const complete = index < current || (index === 4 && ["selected", "rejected"].includes(state));
        const active = index === current || (index === 4 && ["selected", "rejected"].includes(state));
        return `<div class="timeline-item ${complete ? "complete" : ""} ${active ? "active" : ""}"><span class="timeline-dot" aria-hidden="true">${complete ? "✓" : index + 1}</span><div><strong>${escapeHTML(name)}</strong><p>${escapeHTML(descriptions[index])}</p></div></div>`;
    }).join("");
}
