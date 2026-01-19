console.log("order-history.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  // FIXED: this must match your HTML
  const ordersContainer = document.getElementById("orderTimeline");

  function renderMessage(html) {
    ordersContainer.innerHTML = html;
  }

  auth.onAuthStateChanged(async user => {
    if (!user) {
      renderMessage(`
        <div class="auth-required">
          <h2>Sign in required</h2>
          <p>You must be signed in to view your order history.</p>
          <div class="auth-buttons">
            <button onclick="window.location='login.html?redirect=order-history.html'" class="btn-primary">Sign In</button>
            <button onclick="window.location='signup.html?redirect=order-history.html'" class="btn-secondary">Create Account</button>
          </div>
        </div>
      `);
      return;
    }

    try {
      const snap = await db.collection("users")
        .doc(user.uid)
        .collection("orders")
        .orderBy("createdAt", "desc")
        .get();

      if (snap.empty) {
        renderMessage("<p>No orders found.</p>");
        return;
      }

      ordersContainer.innerHTML = "";

      snap.forEach(doc => {
        const data = doc.data();

        const createdAt = data.createdAt && data.createdAt.toDate
          ? data.createdAt.toDate()
          : new Date();

        const itemsHTML = (data.items || []).map(item => `
          <p>${item.name} × ${item.quantity} — £${item.price * item.quantity}</p>
        `).join("");

        const el = document.createElement("div");
        el.classList.add("order-entry");

        el.innerHTML = `
          <h3>Order #${data.id || doc.id}</h3>
          ${itemsHTML}
          <p><strong>Total:</strong> £${data.total}</p>
          <p><strong>Date:</strong> ${createdAt.toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${data.status || "Processing"}</p>
        `;

        ordersContainer.appendChild(el);
      });

    } catch (err) {
      console.error("Error loading orders:", err);
      renderMessage("<p>Error loading order history.</p>");
    }
  });
});
