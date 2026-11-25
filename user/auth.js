(() => {
    const form = document.querySelector(".auth-form");
    if (!form) return;
    const message = document.querySelector(".auth-message");
    const usersKey = "careerConnectUsers";
    const profileKey = "careerConnectProfile";
    const redirect = new URLSearchParams(location.search).get("next");
    const target = redirect ? new URL(redirect, location.href) : new URL("../index.html", location.href);
    const safeNext = target.origin === location.origin ? target.href : new URL("../index.html", location.href).href;
    document.querySelectorAll('.auth-nav a[href="signup.html"], .auth-switch a[href="signup.html"], .auth-nav a[href="login.html"], .auth-switch a[href="login.html"]').forEach(link => {
        const nextLink = new URL(link.href);
        if (redirect && target.origin === location.origin) nextLink.searchParams.set("next", redirect);
        link.href = nextLink.href;
    });
    form.addEventListener("submit", event => {
        event.preventDefault();
        message.textContent = "";
        const values = Object.fromEntries(new FormData(form));
        const users = JSON.parse(localStorage.getItem(usersKey) || "[]");
        const email = String(values.email || "").trim().toLowerCase();
        if (form.dataset.mode === "signup") {
            if (users.some(user => user.email === email)) { message.textContent = "An account with this email already exists."; return; }
            const user = {
                name: String(values.name).trim(),
                email,
                password: values.password,
                role: "candidate",
                employerVerificationStatus: "unverified"
            };
            users.push(user);
            localStorage.setItem(usersKey, JSON.stringify(users));
            localStorage.setItem(profileKey, JSON.stringify({
                name: user.name,
                email: user.email,
                role: user.role,
                employerVerificationStatus: user.employerVerificationStatus
            }));
        } else {
            const user = users.find(item => item.email === email && item.password === values.password);
            if (!user) { message.textContent = "We couldn't find an account with those details. Check your email and password or create an account."; return; }
            localStorage.setItem(profileKey, JSON.stringify({
                ...JSON.parse(localStorage.getItem(profileKey) || "{}"),
                name: user.name,
                email: user.email,
                role: user.role || "candidate",
                employerVerificationStatus: user.employerVerificationStatus || "unverified",
                employerOrganization: user.employerOrganization,
                employerVerificationRequest: user.employerVerificationRequest
            }));
        }
        location.href = safeNext;
    });
})();
