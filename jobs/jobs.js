
const jobsContainer = document.getElementById("jobsContainer");
const searchInput = document.getElementById("searchInput");
const locationFilter = document.getElementById("locationFilter");
const salaryFilter = document.getElementById("salaryFilter");
const salarySort = document.getElementById("salarySort");

const jobDetails = document.getElementById("jobDetails");

const internshipsContainer = document.getElementById("internshipsContainer");
const internshipSearchInput = document.getElementById("internshipSearchInput");
const internshipLocationFilter = document.getElementById("internshipLocationFilter");
const internshipSalaryFilter = document.getElementById("internshipSalaryFilter");
const internshipSalarySort = document.getElementById("internshipSalarySort");

const internshipDetails = document.getElementById("internshipDetails");
const internshipListingSection = document.getElementById("internshipListingSection");

let allJobs = [];
let allInternships = [];


/* =========================
   COMMON HELPERS
========================= */

// Safely convert API values into strings
function getText(value) {
    return value == null ? "" : String(value);
}


// Create an element containing plain text
function createTextElement(tag, text, className = "") {
    const element = document.createElement(tag);

    element.textContent = getText(text);

    if (className) {
        element.classList.add(className);
    }

    return element;
}


// Create a labelled detail paragraph
function createDetailParagraph(label, value) {
    const paragraph = document.createElement("p");
    const strong = document.createElement("strong");

    strong.textContent = `${label}: `;

    paragraph.appendChild(strong);
    paragraph.appendChild(document.createTextNode(getText(value)));

    return paragraph;
}


// Extract numeric salary/stipend value for sorting
function getSalaryAmount(salary) {
    const amount = Number.parseFloat(getText(salary).replace(/,/g, ""));

    return Number.isFinite(amount) ? amount : null;
}


// Sort records while keeping missing salary values at the end
function sortBySalary(records, sortOrder) {
    if (!sortOrder) {
        return records;
    }

    return records.sort((a, b) => {
        const amountA = getSalaryAmount(a.salary);
        const amountB = getSalaryAmount(b.salary);

        if (amountA === null && amountB === null) return 0;
        if (amountA === null) return 1;
        if (amountB === null) return -1;

        return sortOrder === "low-to-high"
            ? amountA - amountB
            : amountB - amountA;
    });
}


// Populate a filter dropdown
function populateFilter(selectElement, values) {
    const uniqueValues = [
        ...new Set(
            values
                .map(value => getText(value).trim())
                .filter(Boolean)
        )
    ];

    uniqueValues.forEach(value => {
        const option = document.createElement("option");

        option.value = value;
        option.textContent = value;

        selectElement.appendChild(option);
    });
}


// Validate API list response
function validateListData(data) {
    if (!Array.isArray(data)) {
        throw new Error("Invalid API response");
    }

    return data.filter(item => item && typeof item === "object");
}


/* =========================
   JOBS
========================= */

async function fetchJobs() {
    jobsContainer.textContent = "Loading jobs...";

    try {
        const response = await fetch("/jobs");

        if (!response.ok) {
            throw new Error("Failed to load jobs");
        }

        const data = await response.json();

        allJobs = validateListData(data);

        populateJobFilters();
        renderJobs(allJobs);

    } catch (error) {
        console.error("Error fetching jobs:", error);
        jobsContainer.textContent = "Unable to load jobs.";
    }
}


function populateJobFilters() {
    populateFilter(
        locationFilter,
        allJobs.map(job => job.location)
    );

    populateFilter(
        salaryFilter,
        allJobs.map(job => job.salary)
    );
}


function renderJobs(jobs) {
    jobsContainer.innerHTML = "";

    if (jobs.length === 0) {
        jobsContainer.textContent = "No jobs found.";
        return;
    }

    jobs.forEach(job => {
        const jobCard = document.createElement("article");

        jobCard.classList.add("job-card");

        jobCard.appendChild(
            createTextElement("h3", job.title)
        );

        jobCard.appendChild(
            createTextElement("p", job.company)
        );

        jobCard.appendChild(
            createTextElement("p", job.location)
        );

        jobCard.appendChild(
            createTextElement("p", job.salary)
        );

        jobCard.appendChild(
            createTextElement("p", job.type)
        );

        const detailsLink = document.createElement("a");

        detailsLink.href =
            `job-details.html?id=${encodeURIComponent(getText(job.id))}`;

        detailsLink.textContent = "View Details";

        jobCard.appendChild(detailsLink);

        jobsContainer.appendChild(jobCard);
    });
}


function applyJobFilters() {
    const searchText = searchInput.value.trim().toLowerCase();

    const selectedLocation = locationFilter.value;
    const selectedSalary = salaryFilter.value;
    const sortOrder = salarySort.value;

    const filteredJobs = allJobs.filter(job => {
        const title = getText(job.title).toLowerCase();
        const company = getText(job.company).toLowerCase();
        const location = getText(job.location).toLowerCase();

        const matchesSearch =
            title.includes(searchText) ||
            company.includes(searchText) ||
            location.includes(searchText);

        const matchesLocation =
            selectedLocation === "" ||
            getText(job.location) === selectedLocation;

        const matchesSalary =
            selectedSalary === "" ||
            getText(job.salary) === selectedSalary;

        return matchesSearch && matchesLocation && matchesSalary;
    });

    sortBySalary(filteredJobs, sortOrder);

    renderJobs(filteredJobs);
}


async function fetchJobDetails() {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("id");

    if (!jobId || !jobId.trim()) {
        jobDetails.textContent = "Job not found.";
        return;
    }

    jobDetails.textContent = "Loading job details...";

    try {
        const response = await fetch(
            `/jobs/${encodeURIComponent(jobId)}`
        );

        if (!response.ok) {
            throw new Error("Job not found");
        }

        const job = await response.json();

        if (!job || typeof job !== "object" || Array.isArray(job)) {
            throw new Error("Invalid job data");
        }

        jobDetails.innerHTML = "";

        const jobCard = document.createElement("article");
        jobCard.classList.add("job-card");

        jobCard.appendChild(
            createTextElement("h2", job.title)
        );

        jobCard.appendChild(
            createDetailParagraph("Company", job.company)
        );

        jobCard.appendChild(
            createDetailParagraph("Location", job.location)
        );

        jobCard.appendChild(
            createDetailParagraph("Salary", job.salary)
        );

        jobCard.appendChild(
            createDetailParagraph("Type", job.type)
        );

        jobCard.appendChild(
            createDetailParagraph("Description", job.description)
        );

        jobDetails.appendChild(jobCard);

    } catch (error) {
        console.error("Error fetching job details:", error);
        jobDetails.textContent = "Unable to load job details.";
    }
}


/* =========================
   INTERNSHIPS
========================= */

async function fetchInternships() {
    internshipsContainer.textContent = "Loading internships...";

    try {
        const response = await fetch("/internships");

        if (!response.ok) {
            throw new Error("Failed to load internships");
        }

        const data = await response.json();

        allInternships = validateListData(data);

        populateInternshipFilters();
        renderInternships(allInternships);

    } catch (error) {
        console.error("Error fetching internships:", error);
        internshipsContainer.textContent = "Unable to load internships.";
    }
}


function populateInternshipFilters() {
    populateFilter(
        internshipLocationFilter,
        allInternships.map(internship => internship.location)
    );

    populateFilter(
        internshipSalaryFilter,
        allInternships.map(internship => internship.salary)
    );
}


function renderInternships(internships) {
    internshipsContainer.innerHTML = "";

    if (internships.length === 0) {
        internshipsContainer.textContent = "No internships found.";
        return;
    }

    internships.forEach(internship => {
        const internshipCard = document.createElement("article");

        internshipCard.classList.add("job-card");

        internshipCard.appendChild(
            createTextElement("h3", internship.title)
        );

        internshipCard.appendChild(
            createTextElement("p", internship.company)
        );

        internshipCard.appendChild(
            createTextElement("p", internship.location)
        );

        internshipCard.appendChild(
            createTextElement("p", internship.salary)
        );

        internshipCard.appendChild(
            createTextElement("p", internship.type)
        );

        const detailsLink = document.createElement("a");

        detailsLink.href =
            `internships.html?id=${encodeURIComponent(getText(internship.id))}`;

        detailsLink.textContent = "View Details";

        internshipCard.appendChild(detailsLink);

        internshipsContainer.appendChild(internshipCard);
    });
}


function applyInternshipFilters() {
    const searchText = internshipSearchInput.value.trim().toLowerCase();

    const selectedLocation = internshipLocationFilter.value;
    const selectedSalary = internshipSalaryFilter.value;
    const sortOrder = internshipSalarySort.value;

    const filteredInternships = allInternships.filter(internship => {
        const title = getText(internship.title).toLowerCase();
        const company = getText(internship.company).toLowerCase();
        const location = getText(internship.location).toLowerCase();

        const matchesSearch =
            title.includes(searchText) ||
            company.includes(searchText) ||
            location.includes(searchText);

        const matchesLocation =
            selectedLocation === "" ||
            getText(internship.location) === selectedLocation;

        const matchesSalary =
            selectedSalary === "" ||
            getText(internship.salary) === selectedSalary;

        return matchesSearch && matchesLocation && matchesSalary;
    });

    sortBySalary(filteredInternships, sortOrder);

    renderInternships(filteredInternships);
}


async function fetchInternshipDetails() {
    const params = new URLSearchParams(window.location.search);
    const internshipId = params.get("id");

    if (!internshipId || !internshipId.trim()) {
        internshipDetails.textContent = "Internship not found.";
        return;
    }

    internshipDetails.textContent = "Loading internship details...";

    try {
        const response = await fetch(
            `/internships/${encodeURIComponent(internshipId)}`
        );

        if (!response.ok) {
            throw new Error("Internship not found");
        }

        const internship = await response.json();

        if (
            !internship ||
            typeof internship !== "object" ||
            Array.isArray(internship)
        ) {
            throw new Error("Invalid internship data");
        }

        internshipDetails.innerHTML = "";

        internshipDetails.appendChild(
            createTextElement("h2", "Internship Details")
        );

        const internshipCard = document.createElement("article");
        internshipCard.classList.add("job-card");

        internshipCard.appendChild(
            createTextElement("h3", internship.title)
        );

        internshipCard.appendChild(
            createDetailParagraph("Company", internship.company)
        );

        internshipCard.appendChild(
            createDetailParagraph("Location", internship.location)
        );

        internshipCard.appendChild(
            createDetailParagraph("Stipend", internship.salary)
        );

        internshipCard.appendChild(
            createDetailParagraph("Type", internship.type)
        );

        internshipCard.appendChild(
            createDetailParagraph("Description", internship.description)
        );

        const backLink = document.createElement("a");

        backLink.href = "internships.html";
        backLink.textContent = "Back to Internships";

        internshipCard.appendChild(backLink);

        internshipDetails.appendChild(internshipCard);

    } catch (error) {
        console.error("Error fetching internship details:", error);
        internshipDetails.textContent = "Unable to load internship details.";
    }
}


/* =========================
   PAGE DETECTION
========================= */

if (jobsContainer) {
    searchInput.addEventListener("input", applyJobFilters);

    locationFilter.addEventListener("change", applyJobFilters);

    salaryFilter.addEventListener("change", applyJobFilters);

    salarySort.addEventListener("change", applyJobFilters);

    fetchJobs();
}


if (jobDetails) {
    fetchJobDetails();
}


if (internshipsContainer && internshipListingSection) {
    const params = new URLSearchParams(window.location.search);
    const internshipId = params.get("id");

    if (internshipId) {
        internshipListingSection.style.display = "none";
        internshipDetails.style.display = "block";

        fetchInternshipDetails();

    } else {
        internshipDetails.style.display = "none";

        internshipSearchInput.addEventListener(
            "input",
            applyInternshipFilters
        );

        internshipLocationFilter.addEventListener(
            "change",
            applyInternshipFilters
        );

        internshipSalaryFilter.addEventListener(
            "change",
            applyInternshipFilters
        );

        internshipSalarySort.addEventListener(
            "change",
            applyInternshipFilters
        );

        fetchInternships();
    }
}
