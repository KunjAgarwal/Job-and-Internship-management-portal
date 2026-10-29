const jobsContainer = document.getElementById("jobsContainer");
const searchInput = document.getElementById("searchInput");
const locationFilter = document.getElementById("locationFilter");
const salaryFilter = document.getElementById("salaryFilter");
const jobDetails = document.getElementById("jobDetails");

const internshipsContainer = document.getElementById("internshipsContainer");
const internshipSearchInput = document.getElementById("internshipSearchInput");
const internshipLocationFilter = document.getElementById("internshipLocationFilter");
const internshipSalaryFilter = document.getElementById("internshipSalaryFilter");
const internshipDetails = document.getElementById("internshipDetails");
const internshipListingSection = document.getElementById("internshipListingSection");

let allJobs = [];
let allInternships = [];


/* =========================
   JOBS
========================= */

async function fetchJobs() {
    jobsContainer.innerHTML = "<p>Loading jobs...</p>";

    try {
        const response = await fetch("/jobs");

        if (!response.ok) {
            throw new Error("Failed to load jobs");
        }

        allJobs = await response.json();

        populateJobFilters();
        renderJobs(allJobs);

    } catch (error) {
        jobsContainer.innerHTML = "<p>Unable to load jobs.</p>";
    }
}

function populateJobFilters() {
    const locations = [...new Set(allJobs.map(job => job.location))];
    const salaries = [...new Set(allJobs.map(job => job.salary))];

    locations.forEach(location => {
        const option = document.createElement("option");

        option.value = location;
        option.textContent = location;

        locationFilter.appendChild(option);
    });

    salaries.forEach(salary => {
        const option = document.createElement("option");

        option.value = salary;
        option.textContent = salary;

        salaryFilter.appendChild(option);
    });
}

function renderJobs(jobs) {
    jobsContainer.innerHTML = "";

    if (jobs.length === 0) {
        jobsContainer.innerHTML = "<p>No jobs found.</p>";
        return;
    }

    jobs.forEach(job => {
        const jobCard = document.createElement("article");

        jobCard.classList.add("job-card");

        jobCard.innerHTML = `
            <h3>${job.title}</h3>
            <p>${job.company}</p>
            <p>${job.location}</p>
            <p>${job.salary}</p>
            <p>${job.type}</p>
            <a href="job-details.html?id=${job.id}">View Details</a>
        `;

        jobsContainer.appendChild(jobCard);
    });
}

function applyJobFilters() {
    const searchText = searchInput.value.toLowerCase();
    const selectedLocation = locationFilter.value;
    const selectedSalary = salaryFilter.value;

    const filteredJobs = allJobs.filter(job => {
        const matchesSearch =
            job.title.toLowerCase().includes(searchText) ||
            job.company.toLowerCase().includes(searchText) ||
            job.location.toLowerCase().includes(searchText);

        const matchesLocation =
            selectedLocation === "" ||
            job.location === selectedLocation;

        const matchesSalary =
            selectedSalary === "" ||
            job.salary === selectedSalary;

        return matchesSearch && matchesLocation && matchesSalary;
    });

    renderJobs(filteredJobs);
}

async function fetchJobDetails() {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("id");

    if (!jobId) {
        jobDetails.innerHTML = "<p>Job not found.</p>";
        return;
    }

    jobDetails.innerHTML = "<p>Loading job details...</p>";

    try {
        const response = await fetch(`/jobs/${jobId}`);

        if (!response.ok) {
            throw new Error("Job not found");
        }

        const job = await response.json();

        jobDetails.innerHTML = `
            <article class="job-card">
                <h2>${job.title}</h2>

                <p><strong>Company:</strong> ${job.company}</p>
                <p><strong>Location:</strong> ${job.location}</p>
                <p><strong>Salary:</strong> ${job.salary}</p>
                <p><strong>Type:</strong> ${job.type}</p>
                <p><strong>Description:</strong> ${job.description}</p>
            </article>
        `;

    } catch (error) {
        jobDetails.innerHTML = "<p>Unable to load job details.</p>";
    }
}


/* =========================
   INTERNSHIPS
========================= */

async function fetchInternships() {
    internshipsContainer.innerHTML = "<p>Loading internships...</p>";

    try {
        const response = await fetch("/internships");

        if (!response.ok) {
            throw new Error("Failed to load internships");
        }

        allInternships = await response.json();

        populateInternshipFilters();
        renderInternships(allInternships);

    } catch (error) {
        internshipsContainer.innerHTML =
            "<p>Unable to load internships.</p>";
    }
}

function populateInternshipFilters() {
    const locations = [
        ...new Set(allInternships.map(internship => internship.location))
    ];

    const salaries = [
        ...new Set(allInternships.map(internship => internship.salary))
    ];

    locations.forEach(location => {
        const option = document.createElement("option");

        option.value = location;
        option.textContent = location;

        internshipLocationFilter.appendChild(option);
    });

    salaries.forEach(salary => {
        const option = document.createElement("option");

        option.value = salary;
        option.textContent = salary;

        internshipSalaryFilter.appendChild(option);
    });
}

function renderInternships(internships) {
    internshipsContainer.innerHTML = "";

    if (internships.length === 0) {
        internshipsContainer.innerHTML = "<p>No internships found.</p>";
        return;
    }

    internships.forEach(internship => {
        const internshipCard = document.createElement("article");

        internshipCard.classList.add("job-card");

        internshipCard.innerHTML = `
            <h3>${internship.title}</h3>
            <p>${internship.company}</p>
            <p>${internship.location}</p>
            <p>${internship.salary}</p>
            <p>${internship.type}</p>
            <a href="internships.html?id=${internship.id}">
                View Details
            </a>
        `;

        internshipsContainer.appendChild(internshipCard);
    });
}

function applyInternshipFilters() {
    const searchText = internshipSearchInput.value.toLowerCase();
    const selectedLocation = internshipLocationFilter.value;
    const selectedSalary = internshipSalaryFilter.value;

    const filteredInternships = allInternships.filter(internship => {
        const matchesSearch =
            internship.title.toLowerCase().includes(searchText) ||
            internship.company.toLowerCase().includes(searchText) ||
            internship.location.toLowerCase().includes(searchText);

        const matchesLocation =
            selectedLocation === "" ||
            internship.location === selectedLocation;

        const matchesSalary =
            selectedSalary === "" ||
            internship.salary === selectedSalary;

        return matchesSearch && matchesLocation && matchesSalary;
    });

    renderInternships(filteredInternships);
}

async function fetchInternshipDetails() {
    const params = new URLSearchParams(window.location.search);
    const internshipId = params.get("id");

    if (!internshipId) {
        internshipDetails.innerHTML = "<p>Internship not found.</p>";
        return;
    }

    internshipDetails.innerHTML =
        "<p>Loading internship details...</p>";

    try {
        const response = await fetch(`/internships/${internshipId}`);

        if (!response.ok) {
            throw new Error("Internship not found");
        }

        const internship = await response.json();

        internshipDetails.innerHTML = `
            <h2>Internship Details</h2>

            <article class="job-card">
                <h3>${internship.title}</h3>

                <p><strong>Company:</strong> ${internship.company}</p>
                <p><strong>Location:</strong> ${internship.location}</p>
                <p><strong>Stipend:</strong> ${internship.salary}</p>
                <p><strong>Type:</strong> ${internship.type}</p>
                <p><strong>Description:</strong> ${internship.description}</p>

                <a href="internships.html">
                    Back to Internships
                </a>
            </article>
        `;

    } catch (error) {
        internshipDetails.innerHTML =
            "<p>Unable to load internship details.</p>";
    }
}


/* =========================
   PAGE DETECTION
========================= */

if (jobsContainer) {
    searchInput.addEventListener("input", applyJobFilters);
    locationFilter.addEventListener("change", applyJobFilters);
    salaryFilter.addEventListener("change", applyJobFilters);

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

        fetchInternships();
    }
}