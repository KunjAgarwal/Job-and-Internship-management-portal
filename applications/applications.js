const withdrawButton = document.querySelector(".details-card button");

if (withdrawButton) {
    withdrawButton.addEventListener("click", function () {
        const confirmWithdraw = confirm("Are you sure you want to withdraw this application?");

        if (confirmWithdraw) {
            alert("Application withdrawn successfully.");
        }
    });
}
// const applicationForm = document.getElementById("applicationForm");

// if (applicationForm) {
//     applicationForm.addEventListener("submit", async function (event) {
//         event.preventDefault();

//         const application = {
//             jobTitle: document.getElementById("jobTitle").value,
//             company: document.getElementById("company").value,
//             name: document.getElementById("name").value,
//             email: document.getElementById("email").value,
//             phone: document.getElementById("phone").value,
//             resume: document.getElementById("resume").value,
//             message: document.getElementById("message").value,
//             status: "Applied",
//             appliedOn: new Date().toLocaleDateString()
//         };

//         try {
//             const response = await fetch("http://localhost:3000/applications", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify(application)
//             });

//             if (response.ok) {
//                 alert("Application submitted successfully!");
//                 applicationForm.reset();
//             } else {
//                 alert("Failed to submit application.");
//             }
//         } catch (error) {
//             alert("JSON Server is not running.");
//         }
//     });
// }