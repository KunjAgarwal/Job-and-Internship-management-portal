const STORAGE_KEY = "careerConnectApplications";


// STORAGE HELPERS

function getApplications() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Unable to read applications:", error);
        return [];
    }
}

function saveApplications(applications) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
        return true;
    } catch (error) {
        console.error("Unable to save applications:", error);
        alert("Unable to save your application. Please check browser storage.");
        return false;
    }
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getApplicationId() {
    return new URLSearchParams(window.location.search).get("id");
}


// INITIALIZE PAGE


document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("applicationForm");
    const applicationsContainer = document.querySelector(".applications-container");
    const detailsPage = document.querySelector(".details-layout");

    if (form) {
        initializeApplicationForm(form);
    }

    if (applicationsContainer) {
        initializeApplicationsDashboard();
    }

    if (detailsPage) {
        initializeApplicationDetails();
    }
});


// APPLY PAGE


function initializeApplicationForm(form) {
    const nameInput = document.getElementById("name");
    const phoneInput = document.getElementById("phone");
    const emailInput = document.getElementById("email");
    const resumeInput = document.getElementById("resume");
    const messageInput = document.getElementById("message");

    // Populate applicant information if previously saved.
    const profile = JSON.parse(
        localStorage.getItem("careerConnectProfile") || "{}"
    );

    if (profile.name && nameInput) nameInput.value = profile.name;
    if (profile.phone && phoneInput) phoneInput.value = profile.phone;
    if (profile.email && emailInput) emailInput.value = profile.email;

    // Read the opportunity from the URL, if supplied.
    const params = new URLSearchParams(window.location.search);
    const opportunityTitle = params.get("title");
    const opportunityCompany = params.get("company");
    const opportunityType = params.get("type");
    const opportunityLocation = params.get("location");

    const titleDisplay = document.getElementById("jobTitleDisplay");

    if (titleDisplay && opportunityTitle) {
        titleDisplay.textContent = opportunityTitle;
    }

    const companyDisplay = document.querySelector(".opportunity-card .company-name");

    if (companyDisplay && opportunityCompany) {
        companyDisplay.textContent = opportunityCompany;
    }

    const opportunityDetails = document.querySelectorAll(
        ".opportunity-details strong"
    );

    if (opportunityDetails[0] && opportunityType) {
        opportunityDetails[0].textContent =
            opportunityType === "internship" ? "Internship" : opportunityType;
    }

    if (opportunityDetails[1] && opportunityLocation) {
        opportunityDetails[1].textContent = opportunityLocation;
    }

    form.addEventListener("submit", event => {
        event.preventDefault();

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();
        const resume = resumeInput.value.trim();
        const message = messageInput.value.trim();

        // Validation
        if (name.length < 2) {
            alert("Please enter your full name.");
            nameInput.focus();
            return;
        }

        if (!/^\+?[0-9\s()-]{10,20}$/.test(phone)) {
            alert("Please enter a valid phone number.");
            phoneInput.focus();
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("Please enter a valid email address.");
            emailInput.focus();
            return;
        }

        try {
            const resumeURL = new URL(resume);

            if (!["http:", "https:"].includes(resumeURL.protocol)) {
                throw new Error("Invalid protocol");
            }
        } catch {
            alert("Please enter a valid resume URL beginning with https://");
            resumeInput.focus();
            return;
        }

        const applications = getApplications();

        // Prevent accidental duplicate applications for the same opportunity.
        const duplicate = applications.some(application =>
            application.email.toLowerCase() === email.toLowerCase() &&
            application.title.toLowerCase() ===
                (opportunityTitle || titleDisplay?.textContent.trim() ||
                    "Software Developer").toLowerCase() &&
            application.company.toLowerCase() ===
                (opportunityCompany || companyDisplay?.textContent.trim() ||
                    "ABC Technologies").toLowerCase() &&
            application.status !== "withdrawn"
        );

        if (duplicate) {
            alert("You have already applied for this opportunity using this email.");
            return;
        }

        const application = {
            id: crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2)}`,

            title: opportunityTitle || titleDisplay?.textContent.trim() ||
                "Software Developer",

            company: opportunityCompany ||
                companyDisplay?.textContent.trim() || "ABC Technologies",

            type: opportunityType ||
                (opportunityDetails[0]?.textContent.toLowerCase().includes("intern")
                    ? "internship"
                    : "job"),

            location: opportunityLocation ||
                opportunityDetails[1]?.textContent.trim() || "Not specified",

            experience: opportunityDetails[2]?.textContent.trim() || "Fresher",

            name,
            phone,
            email,
            resume,
            message,

            status: "applied",
            appliedOn: new Date().toISOString()
        };

        applications.unshift(application);

        if (!saveApplications(applications)) return;

        // Remember details for convenience on the next application.
        localStorage.setItem("careerConnectProfile", JSON.stringify({
            name,
            phone,
            email
        }));

        alert("Application submitted successfully!");

        window.location.href =
            `applications.html?id=${encodeURIComponent(application.id)}`;
    });

    // Cancel button returns to the applications dashboard.
    const cancelButton = form.querySelector(".cancel-btn");

    if (cancelButton) {
        cancelButton.addEventListener("click", event => {
            event.preventDefault();
            window.location.href = "applications.html";
        });
    }
}


// APPLICATIONS DASHBOARD


function initializeApplicationsDashboard() {
    const container = document.querySelector(".applications-container");
    const filter = document.getElementById("applicationFilter");

    // Optional demo records to retain the examples from your HTML.
    // They are added only when this application store is first initialized.
    let applications = getApplications();

    if (localStorage.getItem(STORAGE_KEY) === null) {
        applications = [
            {
                id: "demo-1",
                title: "Software Developer",
                company: "ABC Technologies",
                type: "job",
                location: "Delhi",
                experience: "Fresher",
                name: "Kunj Agarwal",
                email: "kunj@example.com",
                phone: "9876543210",
                resume: "",
                message: "Interested in the Software Developer position.",
                status: "applied",
                appliedOn: "2026-09-16T10:00:00.000Z"
            },
            {
                id: "demo-2",
                title: "Frontend Developer Intern",
                company: "XYZ Solutions",
                type: "internship",
                location: "Noida",
                experience: "Fresher",
                name: "Kunj Agarwal",
                email: "kunj@example.com",
                phone: "9876543210",
                resume: "",
                message: "Interested in the frontend internship.",
                status: "shortlisted",
                appliedOn: "2026-09-14T10:00:00.000Z"
            }
        ];

        saveApplications(applications);
    }

    // Replace the hardcoded HTML cards with stored application data.
    renderApplications();

    if (filter) {
        filter.addEventListener("change", renderApplications);
    }

    function renderApplications() {
        const allApplications = getApplications();
        const selectedFilter = filter ? filter.value : "all";

        const filteredApplications = allApplications.filter(application => {
            if (selectedFilter === "all") return true;

            if (selectedFilter === "job" || selectedFilter === "internship") {
                return application.type === selectedFilter;
            }

            return application.status === selectedFilter;
        });

        updateStatistics(allApplications);

        if (filteredApplications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No applications found</h3>
                    <p>Try a different filter or browse new opportunities.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredApplications.map(application => {
            const statusLabel = getStatusLabel(application.status);
            const logo = escapeHTML(
                application.company.split(/\s+/)
                    .map(word => word[0] || "")
                    .join("")
                    .slice(0, 3)
                    .toUpperCase()
            );

            return `
                <div class="application-card">
                    <div class="card-top">
                        <div class="company-logo">${logo}</div>
                        <span class="application-status ${escapeHTML(application.status)}">
                            ${escapeHTML(statusLabel)}
                        </span>
                    </div>

                    <div class="application-content">
                        <span class="application-type">
                            ${escapeHTML(
                                application.type === "internship"
                                    ? "Internship"
                                    : "Full Time Job"
                            )}
                        </span>

                        <h3>${escapeHTML(application.title)}</h3>
                        <p class="company-name">${escapeHTML(application.company)}</p>

                        <div class="application-info">
                            <span>${escapeHTML(application.location)}</span>
                            <span>${formatDate(application.appliedOn)}</span>
                        </div>
                    </div>

                    <div class="card-footer">
                        <a href="application-details.html?id=${encodeURIComponent(application.id)}">
                            View Application
                        </a>
                    </div>
                </div>
            `;
        }).join("");
    }

    function updateStatistics(applications) {
        const statCards = document.querySelectorAll(".stat-card");

        const stats = [
            applications.length,
            applications.filter(app =>
                ["applied", "in-review"].includes(app.status)
            ).length,
            applications.filter(app => app.status === "shortlisted").length,
            applications.filter(app => app.status === "withdrawn").length
        ];

        statCards.forEach((card, index) => {
            const heading = card.querySelector("h2");

            if (heading && stats[index] !== undefined) {
                heading.textContent = stats[index];
            }
        });
    }
}


// APPLICATION DETAILS

function initializeApplicationDetails() {
    const applications = getApplications();
    const applicationId = getApplicationId();

    let application = applications.find(app => app.id === applicationId);

    // For older links without an ID, show the first available record.
    if (!application && !applicationId) {
        application = applications[0];
    }

    if (!application) {
        const main = document.querySelector("main");

        main.innerHTML = `
            <section class="details-card">
                <h2>Application not found</h2>
                <p>This application may have been deleted or the link is invalid.</p>
                <a href="applications.html">Back to My Applications</a>
            </section>
        `;

        return;
    }

    const main = document.querySelector("main");

    // Update existing page content using stored data.
    const pageTitle = document.querySelector(".details-page-header h1");
    const company = document.querySelector(".details-company");
    const statusBadge = document.querySelector(".details-page-header .application-status");

    if (pageTitle) pageTitle.textContent = application.title;

    if (company) {
        company.textContent = `${application.company} · ${application.location}`;
    }

    if (statusBadge) {
        statusBadge.className = `application-status ${application.status}`;
        statusBadge.textContent = getStatusLabel(application.status);
    }

    // Job information
    const jobCard = document.querySelector(".details-main .details-card:nth-child(1)");
    const jobValues = jobCard?.querySelectorAll(".info-item strong");

    if (jobValues?.length >= 4) {
        jobValues[0].textContent = application.title;
        jobValues[1].textContent = application.company;
        jobValues[2].textContent = application.location;
        jobValues[3].textContent =
            application.type === "internship" ? "Internship" : "Full Time";
    }

    // Applicant information
    const applicantCard = document.querySelector(
        ".details-main .details-card:nth-child(2)"
    );

    const applicantValues = applicantCard?.querySelectorAll(".info-item strong");

    if (applicantValues?.length >= 3) {
        applicantValues[0].textContent = application.name;
        applicantValues[1].textContent = application.email;
        applicantValues[2].textContent = application.phone;
    }

    const resumeLink = applicantCard?.querySelector(".resume-link");

    if (resumeLink) {
        if (application.resume) {
            resumeLink.href = application.resume;
            resumeLink.target = "_blank";
            resumeLink.rel = "noopener noreferrer";
        } else {
            resumeLink.removeAttribute("href");
            resumeLink.textContent = "No resume provided";
        }
    }

    const coverMessage = document.querySelector(".cover-message");

    if (coverMessage) {
        coverMessage.textContent = application.message ||
            "No cover message was provided.";
    }

    // Update status panel
    const statusCard = document.querySelector(".status-card");

    if (statusCard) {
        const statusTitle = statusCard.querySelector(".status-display strong");
        const statusDescription = statusCard.querySelector(".status-display p");
        const appliedDate = statusCard.querySelector(".status-date strong");

        if (statusTitle) {
            statusTitle.textContent = getStatusLabel(application.status);
        }

        if (statusDescription) {
            statusDescription.textContent = getStatusDescription(application.status);
        }

        if (appliedDate) {
            appliedDate.textContent = formatDate(application.appliedOn);
        }
    }

    updateTimeline(application);

    // Withdrawal
    const withdrawButton = document.querySelector(".withdraw-card button");

    if (withdrawButton) {
        if (application.status === "withdrawn") {
            withdrawButton.disabled = true;
            withdrawButton.textContent = "Application Withdrawn";
        }

        withdrawButton.addEventListener("click", () => {
            if (application.status === "withdrawn") return;

            const confirmed = confirm(
                "Are you sure you want to withdraw this application?"
            );

            if (!confirmed) return;

            const updatedApplications = getApplications().map(app =>
                app.id === application.id
                    ? {
                        ...app,
                        status: "withdrawn",
                        withdrawnOn: new Date().toISOString()
                    }
                    : app
            );

            if (!saveApplications(updatedApplications)) return;

            alert("Your application has been withdrawn.");

            window.location.reload();
        });
    }
}


// STATUS AND TIMELINE HELPERS


function getStatusLabel(status) {
    const labels = {
        "applied": "Applied",
        "in-review": "In Review",
        "shortlisted": "Shortlisted",
        "rejected": "Rejected",
        "withdrawn": "Withdrawn",
        "selected": "Selected"
    };

    return labels[status] || "Applied";
}

function getStatusDescription(status) {
    const descriptions = {
        "applied": "Your application has been submitted.",
        "in-review": "Your application is being reviewed.",
        "shortlisted": "You have been shortlisted for this opportunity.",
        "rejected": "The employer has rejected this application.",
        "withdrawn": "You have withdrawn this application.",
        "selected": "You have been selected for this opportunity."
    };

    return descriptions[status] || descriptions.applied;
}

function updateTimeline(application) {
    const timeline = document.querySelector(".timeline");

    if (!timeline) return;

    const steps = [
        {
            title: "Application Submitted",
            description: formatDate(application.appliedOn),
            active: true
        },
        {
            title: "Under Review",
            description: application.status === "in-review" ||
                application.status === "shortlisted" ||
                application.status === "selected" ||
                application.status === "rejected"
                    ? "Application reviewed"
                    : "Waiting for employer response",
            active: [
                "in-review",
                "shortlisted",
                "selected",
                "rejected"
            ].includes(application.status)
        },
        {
            title: "Final Decision",
            description: application.status === "shortlisted"
                ? "Shortlisted"
                : application.status === "selected"
                    ? "Selected"
                    : application.status === "rejected"
                        ? "Not selected"
                        : application.status === "withdrawn"
                            ? "Application withdrawn"
                            : "Not available yet",
            active: [
                "shortlisted",
                "selected",
                "rejected",
                "withdrawn"
            ].includes(application.status)
        }
    ];

    timeline.innerHTML = steps.map(step => `
        <div class="timeline-item ${step.active ? "active" : ""}">
            <span class="timeline-dot"></span>
            <div>
                <strong>${step.title}</strong>
                <p>${escapeHTML(step.description)}</p>
            </div>
        </div>
    `).join("");
}