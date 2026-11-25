(() => {
    const PROFILE_KEY = "careerConnectProfile";
    const USERS_KEY = "careerConnectUsers";

    function readProfile() {
        const stored = localStorage.getItem(PROFILE_KEY);
        if (stored === null) return null;

        const profile = JSON.parse(stored);
        if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
            throw new Error("Saved account profile is invalid. Clear this site's local storage and sign in again.");
        }
        return profile;
    }

    function saveProfile(profile) {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
        if (!Array.isArray(users)) {
            throw new Error("Saved accounts are invalid. Clear this site's local storage and try again.");
        }
        const currentUser = users.find(user => user.email === profile.email);
        if (currentUser) {
            Object.assign(currentUser, {
                role: profile.role,
                employerVerificationStatus: profile.employerVerificationStatus,
                employerOrganization: profile.employerOrganization,
                employerVerificationRequest: profile.employerVerificationRequest
            });
        }
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        if (currentUser) localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    window.CareerConnectAuth = { readProfile, saveProfile };

    document.addEventListener("DOMContentLoaded", () => {
        const actions = document.querySelector(".nav-actions");
        if (!actions) return;

        let profile;
        try {
            profile = readProfile();
        } catch (error) {
            console.error("Unable to read account profile:", error);
            return;
        }

        const login = actions.querySelector('a[href*="login.html"]');
        const signup = actions.querySelector('a[href*="signup.html"]');
        const applications = actions.querySelector(".dashboard-link");
        if (!profile) {
            if (applications) applications.hidden = true;
            return;
        }

        if (login) login.hidden = true;
        if (signup) signup.hidden = true;
        if (applications) applications.hidden = false;

        const isEmployer = profile.role === "employer";
        const name = String(profile.name || profile.email || "Account").trim();
        const initials = name.split(/\s+/).map(part => part[0] || "").join("").slice(0, 2).toUpperCase();
        const menu = document.createElement("details");
        menu.className = "nav-profile-menu";

        const summary = document.createElement("summary");
        summary.className = "nav-profile-trigger";
        summary.setAttribute("aria-label", `Account menu for ${name}`);

        const avatar = document.createElement("span");
        avatar.className = "nav-profile-avatar";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = initials;
        summary.append(avatar);
        const summaryName = document.createElement("span");
        summaryName.className = "nav-profile-name";
        summaryName.textContent = name;
        summary.append(summaryName);
        const chevron = document.createElement("span");
        chevron.className = "nav-profile-chevron";
        chevron.setAttribute("aria-hidden", "true");
        chevron.textContent = "⌄";
        summary.append(chevron);
        menu.append(summary);

        const panel = document.createElement("div");
        panel.className = "nav-profile-panel";
        const identity = document.createElement("div");
        identity.className = "nav-profile-identity";
        const identityName = document.createElement("strong");
        identityName.textContent = name;
        const badge = document.createElement("span");
        badge.className = "nav-role-badge";
        badge.textContent = isEmployer ? "Employer" : "Candidate";
        identity.append(identityName, badge);
        panel.append(identity);

        const dashboard = document.createElement("a");
        const home = document.querySelector(".navbar .logo");
        const root = home ? new URL(home.getAttribute("href"), location.href) : new URL(".", location.href);
        dashboard.href = new URL(isEmployer ? "user/profile.html" : "applications/applications.html", root).href;
        dashboard.textContent = isEmployer ? "Employer profile" : "My applications";
        panel.append(dashboard);

        const logout = document.createElement("button");
        logout.type = "button";
        logout.className = "nav-logout";
        logout.textContent = "Log out";
        logout.addEventListener("click", () => {
            localStorage.removeItem(PROFILE_KEY);
            location.href = home ? new URL(home.getAttribute("href"), location.href).href : "index.html";
        });
        panel.append(logout);
        menu.append(panel);
        if (login) login.after(menu);
        else actions.append(menu);
    });
})();
