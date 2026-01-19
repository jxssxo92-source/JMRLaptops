// =========================
// ACCOUNT PAGE CONTROLLER
// =========================

// Wait for Firebase auth to finish loading
auth.onAuthStateChanged(async user => {
    if (!user) {
        // Not logged in → redirect to login
        window.location = "login.html?redirect=account.html";
        return;
    }

    // Load account data
    loadAccountPage(user);
});

// =========================
// LOAD ACCOUNT DATA
// =========================
async function loadAccountPage(user) {
    const accountInfo = document.getElementById("accountInfo");

    // Fetch order count
    let orderCount = 0;
    try {
        const orders = await db.collection("orders")
            .where("userId", "==", user.uid)
            .get();

        orderCount = orders.size;
    } catch (err) {
        console.error("Error loading orders:", err);
    }

    // Admin check
    const isAdmin = user.email.toLowerCase().trim() === "jmrlaptops60@gmail.com";

    // Display account info
    accountInfo.innerHTML = `
        <div class="account-row"><strong>Email:</strong> ${user.email}</div>
        <div class="account-row"><strong>User ID:</strong> ${user.uid}</div>
        <div class="account-row"><strong>Orders:</strong> ${orderCount}</div>
        <div class="account-row"><strong>Admin:</strong> 
            ${isAdmin ? `<span class="admin-badge">Admin</span>` : "No"}
        </div>
    `;

    // Attach button actions
    setupButtons(user);
}

// =========================
// BUTTON ACTIONS
// =========================
function setupButtons(user) {
    // Change password
    const changePasswordBtn = document.getElementById("changePasswordBtn");
    changePasswordBtn.onclick = () => {
        auth.sendPasswordResetEmail(user.email)
            .then(() => alert("Password reset email sent."))
            .catch(err => alert(err.message));
    };

    // Delete account
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");
    deleteAccountBtn.onclick = async () => {
        if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;

        try {
            await user.delete();
            alert("Account deleted.");
            window.location = "index.html";
        } catch (err) {
            alert("You must re-login before deleting your account.");
        }
    };

    // Logout
    const logoutBtn2 = document.getElementById("logoutBtn2");
    logoutBtn2.onclick = () => auth.signOut();
}
