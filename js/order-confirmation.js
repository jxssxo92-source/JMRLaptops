// =========================
// GET ORDER ID FROM URL
// =========================
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get("id");

const orderDetailsDiv = document.getElementById("orderDetails");

if (!orderId) {
    orderDetailsDiv.innerHTML = "<p>Order ID missing.</p>";
} else {
    db.collection("orders").doc(orderId).get()
        .then(doc => {
            if (!doc.exists) {
                orderDetailsDiv.innerHTML = "<p>Order not found.</p>";
                return;
            }

            const data = doc.data();
            const ship = data.shipping;

            let html = `
                <h2>Order ID: ${orderId}</h2>

                <p><strong>Status:</strong> ${data.status || "Processing"}</p>
                <p><strong>Date:</strong> ${new Date(data.createdAt).toLocaleString()}</p>

                <h3 style="margin-top:1.5rem;">Shipping Information</h3>
                <p><strong>Name:</strong> ${ship.fullName}</p>
                <p><strong>Address:</strong></p>
                <p>${ship.line1}</p>
                ${ship.line2 ? `<p>${ship.line2}</p>` : ""}
                <p>${ship.city}, ${ship.postcode}</p>
                <p>${ship.country}</p>

                <h3 style="margin-top:1.5rem;">Items</h3>
            `;

            data.items.forEach(item => {
                html += `
                    <p>${item.name} × ${item.quantity} — £${item.price * item.quantity}</p>
                `;
            });

            html += `
                <h2 style="margin-top:1.5rem;">Total: £${data.total}</h2>
            `;

            orderDetailsDiv.innerHTML = html;
        })
        .catch(err => {
            console.error(err);
            orderDetailsDiv.innerHTML = "<p>Error loading order details.</p>";
        });
}
