// =========================
// AUTH STATE HELPERS
// =========================
function setCurrentUser(uid) {
    if (uid) {
        localStorage.setItem("currentUser", uid);
    } else {
        localStorage.removeItem("currentUser");
    }
}

function getCurrentUser() {
    return localStorage.getItem("currentUser");
}

// =========================
// BUILD PROFILE DROPDOWN
// =========================
function updateProfileDropdown(user) {
    const dropdown = document.getElementById("profileDropdown");
    if (!dropdown) return;

    if (user) {
        let adminLink = "";

        // Admin email check
        if (user.email?.toLowerCase().trim() === "jmrlaptops60@gmail.com") {
            adminLink = `<a href="admin.html" class="admin-link">Admin Dashboard</a>`;
        }

        const emailDisplay = user.email || "Unknown User";

        dropdown.innerHTML = `
            <p class="dropdown-email">${emailDisplay}</p>
            <a href="account.html">My Account</a>
            <a href="order-history.html">Order History</a>
            ${adminLink}
            <a id="logoutBtn">Logout</a>
        `;

        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => auth.signOut());
        }

    } else {
        dropdown.innerHTML = `
            <a href="login.html">Login</a>
            <a href="signup.html">Sign Up</a>
        `;
    }
}

// =========================
// FIREBASE AUTH LISTENER
// =========================
auth.onAuthStateChanged(user => {
    setCurrentUser(user ? user.uid : null);
    updateProfileDropdown(user);
});

// =========================
// DROPDOWN TOGGLE
// =========================
document.addEventListener("DOMContentLoaded", () => {
    const profileBtn = document.getElementById("profileBtn");
    const dropdown = document.getElementById("profileDropdown");

    if (!profileBtn || !dropdown) return;

    // Toggle dropdown
    profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("show");
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
        if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove("show");
        }
    });
});
