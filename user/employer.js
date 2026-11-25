const EMPLOYER_LISTINGS_KEY = "careerConnectEmployerListings";

document.addEventListener("DOMContentLoaded", () => {
    initializeEmployerWizard().catch(error => {
        console.error("Unable to initialize employer posting:", error);
        const feedback = document.getElementById("wizardFeedback");
        if (feedback) feedback.textContent = `The posting form could not be initialized: ${error.message}`;
    });
});

async function initializeEmployerWizard() {
    const form = document.getElementById("employerWizard");
    const stages = [...form.querySelectorAll("[data-step-panel]")];
    const indicators = [...document.querySelectorAll("[data-step-indicator]")];
    const title = document.getElementById("wizardTitle");
    const feedback = document.getElementById("wizardFeedback");
    const phone = form.elements.phone;
    const countryCode = form.elements.countryCode;
    const verifyButton = document.getElementById("verifyPhone");
    const phoneStatus = document.getElementById("phoneStatus");
    const stepHint = document.getElementById("personalStepHint");
    const verificationBanner = document.getElementById("employerVerification");
    const verificationMessage = document.getElementById("verificationMessage");
    const registrationNumber = document.getElementById("registrationNumber");
    const requestVerification = document.getElementById("requestVerification");
    const titles = ["Personal details", "Organization details", "Post internship or job"];
    let activeStep = 0;
    let phoneVerified = false;
    let profile;

    try {
        profile = CareerConnectAuth.readProfile();
    } catch (error) {
        feedback.textContent = `Your account could not be loaded: ${error.message}`;
        form.hidden = true;
        return;
    }
    if (!profile) {
        const next = encodeURIComponent("profile.html");
        location.replace(`login.html?next=${next}`);
        return;
    }

    profile.role = "employer";
    profile.employerVerificationStatus = profile.employerVerificationStatus || "unverified";
    try {
        CareerConnectAuth.saveProfile(profile);
    } catch (error) {
        feedback.textContent = `Your employer profile could not be saved: ${error.message}`;
        form.hidden = true;
        return;
    }

    try {
        const data = await CareerConnectData.load();
        const name = String(profile.name || data.user.name || "").trim().split(/\s+/);
        form.elements.firstName.value = name.shift() || "";
        form.elements.lastName.value = name.join(" ");
        form.elements.email.value = profile.email || data.user.email || "";
        const demoPhone = String(profile.phone || data.user.phone || "");
        if (demoPhone.startsWith("91") && demoPhone.length > 10) {
            countryCode.value = "+91";
            phone.value = demoPhone.slice(2);
        } else {
            phone.value = demoPhone;
        }
        const organization = profile.employerOrganization || {};
        ["company", "industry", "companySize", "headquarters", "website"].forEach(name => {
            form.elements[name].value = organization[name] || "";
        });
        registrationNumber.value = profile.employerVerificationRequest?.registrationNumber || "";
    } catch (error) {
        console.error("Unable to load employer form defaults:", error);
        feedback.textContent = `Demo contact details could not be loaded: ${error.message} Enter your details manually to continue.`;
    }

    function currentStepIsValid() {
        const requiredFields = [...stages[activeStep].querySelectorAll("input[required], select[required], textarea[required]")];
        const requiredFieldsValid = requiredFields.every(field => field.value.trim() && field.checkValidity());
        const optionalFieldsValid = [...stages[activeStep].querySelectorAll("input:not([required]), select:not([required]), textarea:not([required])")]
            .every(field => !field.value || field.checkValidity());
        const verifiedEmployer = activeStep !== 2 || profile.employerVerificationStatus === "verified";
        return requiredFieldsValid && optionalFieldsValid &&
            (activeStep !== 0 || phoneVerified) && verifiedEmployer;
    }

    function updateActions() {
        const canContinue = currentStepIsValid();
        const nextButton = stages[activeStep].querySelector("[data-next]");
        const publishButton = stages[activeStep].querySelector(".wizard-publish");
        if (nextButton) nextButton.disabled = !canContinue;
        if (publishButton) publishButton.disabled = !canContinue;
        if (verificationBanner) {
            const status = profile.employerVerificationStatus || "unverified";
            verificationBanner.hidden = status === "verified";
            verificationBanner.dataset.status = status;
            verificationMessage.textContent = status === "pending"
                ? "Your verification request is pending review. You can post after your employer profile is approved."
                : "Verify your organization before posting a job or internship. Submit your business registration number for review.";
            requestVerification.disabled = status === "pending";
            requestVerification.hidden = status === "verified";
        }
        if (activeStep === 0) {
            stepHint.textContent = phoneVerified
                ? "Your contact details are ready."
                : "Complete all fields and verify your phone number to continue.";
        }
    }

    function showStep(step) {
        activeStep = step;
        title.textContent = titles[step];
        stages.forEach((stage, index) => {
            stage.hidden = index !== step;
        });
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle("is-active", index === step);
            indicator.classList.toggle("is-complete", index < step);
            if (index === step) indicator.setAttribute("aria-current", "step");
            else indicator.removeAttribute("aria-current");
        });
        feedback.textContent = "";
        updateActions();
        title.focus({ preventScroll: true });
    }

    function resetPhoneVerification() {
        phoneVerified = false;
        verifyButton.textContent = "Verify";
        verifyButton.disabled = false;
        phoneStatus.textContent = "Enter your number, then select Verify.";
        phoneStatus.classList.remove("is-success", "is-error");
        updateActions();
    }

    verifyButton.addEventListener("click", () => {
        const phoneDigits = phone.value.replace(/\D/g, "");
        const callingCodeDigits = countryCode.value.replace(/\D/g, "");
        const internationalLength = phoneDigits.length + callingCodeDigits.length;
        if (!phone.checkValidity() || internationalLength < 10 || internationalLength > 15) {
            phoneVerified = false;
            phoneStatus.textContent = "Enter a valid phone number before verifying.";
            phoneStatus.classList.add("is-error");
            phone.focus();
            updateActions();
            return;
        }
        phoneVerified = true;
        verifyButton.textContent = "Verified";
        verifyButton.disabled = true;
        phoneStatus.textContent = "Phone number format verified locally. No SMS was sent.";
        phoneStatus.classList.remove("is-error");
        phoneStatus.classList.add("is-success");
        updateActions();
    });

    [phone, countryCode].forEach(field => field.addEventListener("input", resetPhoneVerification));
    countryCode.addEventListener("change", resetPhoneVerification);

    form.querySelectorAll("input, select, textarea").forEach(field => {
        field.addEventListener("input", updateActions);
        field.addEventListener("change", updateActions);
    });

    form.querySelectorAll("[data-next]").forEach(button => {
        button.addEventListener("click", () => {
            if (!currentStepIsValid()) return;
            if (activeStep === 1) {
                try {
                    saveOrganization();
                } catch (error) {
                    console.error("Unable to save employer organization:", error);
                    feedback.textContent = `Unable to save your organization details: ${error.message}`;
                    return;
                }
            }
            showStep(activeStep + 1);
        });
    });

    form.querySelectorAll("[data-previous]").forEach(button => {
        button.addEventListener("click", () => showStep(activeStep - 1));
    });

    form.addEventListener("submit", event => {
        event.preventDefault();
        feedback.textContent = "";
        if (activeStep !== stages.length - 1) return;
        if (profile.employerVerificationStatus !== "verified") {
            feedback.textContent = "Your employer profile must be verified before you can post an opportunity.";
            updateActions();
            return;
        }
        if (!currentStepIsValid()) return;

        const value = name => form.elements[name].value.trim();
        const company = value("company");
        const companyInitials = company
            .split(/\s+/)
            .map(part => part[0] || "")
            .join("")
            .slice(0, 3)
            .toUpperCase();
        const opportunity = {
            id: `employer-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
            title: value("title"),
            company,
            companyInitials,
            type: value("type"),
            location: value("location"),
            experience: value("experience") || "Fresher",
            employmentType: value("employmentType"),
            salary: value("salary"),
            description: value("description"),
            skills: value("skills").split(",").map(skill => skill.trim()).filter(Boolean),
            categories: [value("category")],
            industry: value("industry"),
            companySize: value("companySize"),
            headquarters: value("headquarters"),
            companyWebsite: value("website"),
            contact: {
                name: `${value("firstName")} ${value("lastName")}`.trim(),
                designation: value("designation"),
                email: value("email"),
                phone: `${countryCode.value} ${value("phone")}`
            },
            postedOn: new Date().toISOString()
        };

        try {
            const listings = CareerConnectData.read(EMPLOYER_LISTINGS_KEY, []);
            if (!Array.isArray(listings)) {
                throw new Error("Saved employer listings are invalid. Clear this site's local storage and try again.");
            }
            CareerConnectData.write(EMPLOYER_LISTINGS_KEY, [opportunity, ...listings]);
            showPublishedOpportunity(opportunity);
        } catch (error) {
            console.error("Unable to save employer listing:", error);
            feedback.textContent = `Unable to post this opportunity: ${error.message}`;
        }
    });

    function saveOrganization() {
        profile.employerOrganization = organizationValues();
        CareerConnectAuth.saveProfile(profile);
    }

    function organizationValues() {
        return {
            company: form.elements.company.value.trim(),
            industry: form.elements.industry.value,
            companySize: form.elements.companySize.value,
            headquarters: form.elements.headquarters.value.trim(),
            website: form.elements.website.value.trim()
        };
    }

    function handleOrganizationChange() {
        const reviewedOrganization = profile.employerVerificationStatus === "verified"
            ? profile.employerOrganization
            : profile.employerVerificationStatus === "pending"
                ? profile.employerVerificationRequest?.organization
                : null;
        const currentOrganization = organizationValues();
        const changed = reviewedOrganization && Object.keys(currentOrganization)
            .some(key => String(reviewedOrganization[key] || "") !== currentOrganization[key]);
        if (changed) {
            profile.employerVerificationStatus = "unverified";
            delete profile.employerVerificationRequest;
            try {
                CareerConnectAuth.saveProfile(profile);
                verificationMessage.textContent = "Organization details changed. Submit a new verification request before posting.";
            } catch (error) {
                console.error("Unable to update employer verification status:", error);
                verificationMessage.textContent = `Unable to update verification status: ${error.message}`;
            }
        }
        updateActions();
    }

    [form.elements.company, form.elements.industry, form.elements.companySize, form.elements.headquarters, form.elements.website].forEach(field => {
        field.addEventListener("input", handleOrganizationChange);
        field.addEventListener("change", handleOrganizationChange);
    });

    requestVerification.addEventListener("click", () => {
        const number = registrationNumber.value.trim();
        if (!number) {
            verificationMessage.textContent = "Enter your business registration number before submitting the request.";
            registrationNumber.focus();
            return;
        }
        try {
            saveOrganization();
            profile.employerVerificationStatus = "pending";
            profile.employerVerificationRequest = {
                registrationNumber: number,
                organization: profile.employerOrganization,
                submittedOn: new Date().toISOString()
            };
            CareerConnectAuth.saveProfile(profile);
            verificationMessage.textContent = "Your verification request has been submitted for review. Posting remains locked until approval.";
            updateActions();
        } catch (error) {
            console.error("Unable to save employer verification request:", error);
            verificationMessage.textContent = `Unable to submit your request: ${error.message}`;
            updateActions();
        }
    });

    showStep(0);

    function showPublishedOpportunity(opportunity) {
        const page = opportunity.type === "internship" ? "../jobs/internships.html" : "../jobs/jobs.html";
        document.getElementById("publishSuccess").hidden = false;
        form.hidden = true;
        document.querySelector(".wizard-progress").hidden = true;
        title.hidden = true;
        document.getElementById("publishedSummary").textContent =
            `${opportunity.title} at ${opportunity.company} has been saved in this browser and added to the listings.`;
        document.getElementById("viewPublishedOpportunity").href =
            `../jobs/opportunity-details.html?id=${encodeURIComponent(opportunity.id)}`;
        document.getElementById("browsePublishedType").href = page;
    }
}
