document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("profileForm");

    if (form) {

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const profile = {
                name: document.getElementById("editName").value,
                email: document.getElementById("editEmail").value,
                phone: document.getElementById("editPhone").value,
                dob: document.getElementById("editDob").value,
                location: document.getElementById("editLocation").value,
                gender: document.getElementById("editGender").value,
                education: document.getElementById("editEducation").value,
                skills: document.getElementById("editSkills").value
            };

            localStorage.setItem("userProfile", JSON.stringify(profile));

            alert("Profile updated successfully!");

            window.location.href = "profile.html";
        });
    }

    const savedData = localStorage.getItem("userProfile");

    if (savedData) {

        const profile = JSON.parse(savedData);

        if (document.getElementById("name")) {
            document.getElementById("name").textContent = profile.name;
            document.getElementById("email").textContent = profile.email;
            document.getElementById("phone").textContent = profile.phone;
            document.getElementById("dob").textContent = profile.dob;
            document.getElementById("location").textContent = profile.location;
            document.getElementById("gender").textContent = profile.gender;
        }

        if (document.getElementById("editName")) {
            document.getElementById("editName").value = profile.name;
            document.getElementById("editEmail").value = profile.email;
            document.getElementById("editPhone").value = profile.phone;
            document.getElementById("editDob").value = profile.dob;
            document.getElementById("editLocation").value = profile.location;
            document.getElementById("editGender").value = profile.gender;
            document.getElementById("editEducation").value = profile.education;
            document.getElementById("editSkills").value = profile.skills;
        }
    }
});