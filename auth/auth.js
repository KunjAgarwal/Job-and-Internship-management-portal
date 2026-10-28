/* ==========================================
   STORAGE KEYS
========================================== */

const USERS_KEY = "careerconnect_users";
const CURRENT_USER_KEY = "careerconnect_current_user";


/* ==========================================
   USER STORAGE
========================================== */

function getUsers() {

    const users = localStorage.getItem(USERS_KEY);

    if (!users) {
        return [];
    }

    return JSON.parse(users);
}


function saveUsers(users) {

    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(users)
    );

}


/* ==========================================
   ERROR FUNCTIONS
========================================== */

function showError(input, errorElement, message) {

    input.classList.add("error");

    errorElement.textContent = message;

    errorElement.classList.add("show");

}


function clearError(input, errorElement) {

    input.classList.remove("error");

    errorElement.textContent = "";

    errorElement.classList.remove("show");

}


/* ==========================================
   MESSAGE FUNCTION
========================================== */

function showMessage(element, message, type) {

    element.textContent = message;

    element.className =
        "form-message show " + type;

}


/* ==========================================
   SIGNUP ROLE SELECTION
========================================== */

const roleCards =
    document.querySelectorAll(".role-card");

const signupFormContainer =
    document.getElementById("signupFormContainer");

const signupRole =
    document.getElementById("signupRole");

const selectedRoleIcon =
    document.getElementById("selectedRoleIcon");

const selectedRoleText =
    document.getElementById("selectedRoleText");

const changeRole =
    document.getElementById("changeRole");


if (roleCards.length > 0) {

    roleCards.forEach(function (card) {

        card.addEventListener("click", function () {

            /* Remove selection from all cards */

            roleCards.forEach(function (item) {

                item.classList.remove("selected");

            });


            /* Select clicked card */

            card.classList.add("selected");


            /* Get selected role */

            const role =
                card.getAttribute("data-role");


            /* Store role */

            signupRole.value = role;


            /* Update selected role information */

            if (role === "candidate") {

                selectedRoleIcon.textContent = "🎯";

                selectedRoleText.textContent =
                    "Looking for a job";

            } else {

                selectedRoleIcon.textContent = "🏢";

                selectedRoleText.textContent =
                    "Hiring talent";

            }


            /* Show form */

            signupFormContainer.classList.add("show");

        });

    });

}


/* ==========================================
   CHANGE ROLE
========================================== */

if (changeRole) {

    changeRole.addEventListener("click", function () {

        /* Hide form */

        signupFormContainer.classList.remove("show");


        /* Clear selected role */

        signupRole.value = "";


        roleCards.forEach(function (card) {

            card.classList.remove("selected");

        });


        /* Scroll back to role selection */

        document
            .getElementById("roleSelection")
            .scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

    });

}


/* ==========================================
   SIGNUP
========================================== */

const signupForm =
    document.getElementById("signupForm");


if (signupForm) {

    signupForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            /* Get fields */

            const name =
                document.getElementById("signupName");

            const email =
                document.getElementById("signupEmail");

            const role =
                document.getElementById("signupRole");

            const password =
                document.getElementById("signupPassword");

            const confirmPassword =
                document.getElementById(
                    "signupConfirmPassword"
                );


            /* Get error elements */

            const nameError =
                document.getElementById(
                    "signupNameErr"
                );

            const emailError =
                document.getElementById(
                    "signupEmailErr"
                );

            const passwordError =
                document.getElementById(
                    "signupPasswordErr"
                );

            const confirmPasswordError =
                document.getElementById(
                    "signupConfirmPasswordErr"
                );


            const message =
                document.getElementById(
                    "signupMsg"
                );


            /* Clear previous errors */

            clearError(name, nameError);

            clearError(email, emailError);

            clearError(password, passwordError);

            clearError(
                confirmPassword,
                confirmPasswordError
            );


            message.className =
                "form-message";


            let valid = true;


            /* ======================================
               NAME VALIDATION
            ====================================== */

            if (name.value.trim() === "") {

                showError(
                    name,
                    nameError,
                    "Please enter your full name."
                );

                valid = false;

            }


            /* ======================================
               ROLE VALIDATION
            ====================================== */

            if (role.value === "") {

                showMessage(
                    message,
                    "Please select what you are here to do.",
                    "error"
                );

                valid = false;

            }


            /* ======================================
               GMAIL VALIDATION
            ====================================== */

            const emailName =
                email.value.trim();


            const gmailNamePattern =
                /^[A-Za-z0-9]+(\.[A-Za-z0-9]+)*$/;


            if (
                emailName === "" ||
                !gmailNamePattern.test(emailName)
            ) {

                showError(
                    email,
                    emailError,
                    "Please enter a valid Gmail username."
                );

                valid = false;

            }


            /* Create complete Gmail address */

            const fullEmail =
                emailName.toLowerCase() +
                "@gmail.com";


            /* ======================================
               PASSWORD VALIDATION
            ====================================== */

            if (password.value.length < 6) {

                showError(
                    password,
                    passwordError,
                    "Password must be at least 6 characters."
                );

                valid = false;

            }


            /* ======================================
               CONFIRM PASSWORD
            ====================================== */

            if (
                confirmPassword.value !==
                password.value
            ) {

                showError(
                    confirmPassword,
                    confirmPasswordError,
                    "Passwords do not match."
                );

                valid = false;

            }


            /* Stop if invalid */

            if (!valid) {
                return;
            }


            /* ======================================
               CHECK EXISTING USER
            ====================================== */

            const users = getUsers();


            const existingUser =
                users.find(function (user) {

                    return (
                        user.email.toLowerCase() ===
                        fullEmail
                    );

                });


            if (existingUser) {

                showError(
                    email,
                    emailError,
                    "An account with this Gmail already exists."
                );

                return;

            }


            /* ======================================
               CREATE USER
            ====================================== */

            const newUser = {

                name: name.value.trim(),

                email: fullEmail,

                role: role.value,

                password: password.value

            };


            users.push(newUser);

            saveUsers(users);


            /* ======================================
               SUCCESS
            ====================================== */

            showMessage(
                message,
                "Account created successfully! Redirecting to login...",
                "success"
            );


            setTimeout(function () {

                window.location.href =
                    "login.html";

            }, 1200);

        }
    );

}


/* ==========================================
   LOGIN
========================================== */

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const email =
                document.getElementById(
                    "loginEmail"
                );

            const password =
                document.getElementById(
                    "loginPassword"
                );

            const role =
                document.getElementById(
                    "loginRole"
                );


            const emailError =
                document.getElementById(
                    "loginEmailErr"
                );

            const passwordError =
                document.getElementById(
                    "loginPasswordErr"
                );

            const roleError =
                document.getElementById(
                    "loginRoleErr"
                );


            const message =
                document.getElementById(
                    "loginMsg"
                );


            clearError(
                email,
                emailError
            );

            clearError(
                password,
                passwordError
            );

            clearError(
                role,
                roleError
            );


            message.className =
                "form-message";


            let valid = true;


            /* Gmail username */

            const emailName =
                email.value.trim();


            if (emailName === "") {

                showError(
                    email,
                    emailError,
                    "Please enter your Gmail username."
                );

                valid = false;

            }


            /* Password */

            if (password.value.length < 6) {

                showError(
                    password,
                    passwordError,
                    "Password must be at least 6 characters."
                );

                valid = false;

            }


            /* Role */

            if (role.value === "") {

                showError(
                    role,
                    roleError,
                    "Please select your role."
                );

                valid = false;

            }


            if (!valid) {
                return;
            }


            /* Complete Gmail */

            const fullEmail =
                emailName.toLowerCase() +
                "@gmail.com";


            /* Find user */

            const users = getUsers();


            const user =
                users.find(function (item) {

                    return (
                        item.email.toLowerCase() ===
                        fullEmail &&

                        item.password ===
                        password.value &&

                        item.role ===
                        role.value
                    );

                });


            if (!user) {

                showMessage(
                    message,
                    "Invalid Gmail, password or role.",
                    "error"
                );

                return;

            }


            /* Store logged-in user */

            const loggedInUser = {

                name: user.name,

                email: user.email,

                role: user.role

            };


            localStorage.setItem(
                CURRENT_USER_KEY,
                JSON.stringify(loggedInUser)
            );


            showMessage(
                message,
                "Login successful!",
                "success"
            );


            /* Redirect */

            setTimeout(function () {

                if (user.role === "candidate") {

                    window.location.href =
                        "../candidate/dashboard.html";

                } else {

                    window.location.href =
                        "../recruiter/dashboard.html";

                }

            }, 800);

        }
    );

}


/* ==========================================
   CURRENT USER
========================================== */

function getCurrentUser() {

    const user =
        localStorage.getItem(
            CURRENT_USER_KEY
        );


    if (!user) {
        return null;
    }


    return JSON.parse(user);

}


/* ==========================================
   LOGOUT
========================================== */

function logout() {

    localStorage.removeItem(
        CURRENT_USER_KEY
    );


    window.location.href =
        "login.html";

}


/* ==========================================
   AUTH OBJECT
========================================== */

window.Auth = {

    getCurrentUser:
        getCurrentUser,

    logout:
        logout

};
