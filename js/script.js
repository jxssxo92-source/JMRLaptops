// =========================
// CART STATE
// =========================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// =========================
// CART HELPERS
// =========================
function updateCartCount() {
    const badge = document.getElementById("cartCount");
    if (!badge) return;

    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = count;
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));

    // Save to Firestore if logged in
    if (typeof saveCartToFirestore === "function" && auth.currentUser) {
        saveCartToFirestore(cart);
    }

    updateCartCount();
}

// =========================
// ADD / REMOVE ITEMS
// =========================
function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    loadCartPanel();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    loadCartPanel();
}

// =========================
// CART PANEL UI
// =========================
function loadCartPanel() {
    const container = document.getElementById("cartItems");
    const totalEl = document.getElementById("cartTotal");

    if (!container || !totalEl) return;

    container.innerHTML = "";

    if (cart.length === 0) {
        container.innerHTML = `<p class="cart-empty">Your cart is empty.</p>`;
        totalEl.textContent = "£0";
        return;
    }

    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;

        container.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <span>£${item.price} × ${item.quantity}</span>
                </div>
                <span class="cart-item-remove" onclick="removeFromCart(${item.id})">✖</span>
            </div>
        `;
    });

    totalEl.textContent = "£" + total;
}

// =========================
// UPDATE CART UI
// =========================
function updateCartUI() {
    cart = JSON.parse(localStorage.getItem("cart") || "[]");
    updateCartCount();
    loadCartPanel();
}

// =========================
// INITIALIZE PAGE
// =========================
document.addEventListener("DOMContentLoaded", () => {

    const cartBtn = document.getElementById("cartBtn");
    const cartPanel = document.getElementById("cartPanel");
    const cartOverlay = document.getElementById("cartOverlay");
    const closeCart = document.getElementById("closeCart");

    if (cartBtn && cartPanel && cartOverlay && closeCart) {

        cartBtn.onclick = () => {
            cartPanel.classList.add("active");
            cartOverlay.classList.add("active");
            loadCartPanel();

            const notice = document.getElementById("cartAuthNotice");

            const user = auth.currentUser;

            if (!user && notice) {
                notice.style.display = "block";
            } else if (notice) {
                notice.style.display = "none";
            }
        };

        closeCart.onclick = () => {
            cartPanel.classList.remove("active");
            cartOverlay.classList.remove("active");
        };

        cartOverlay.onclick = () => {
            cartPanel.classList.remove("active");
            cartOverlay.classList.remove("active");
        };
    }

    updateCartUI();
});

// Expose globally
window.addToCart = addToCart;
window.updateCartUI = updateCartUI;

// =========================
// SAFETY RESET
// =========================
window.addEventListener("load", () => {
    document.body.style.overflow = "auto";

    const overlay = document.getElementById("cartOverlay");
    const panel = document.getElementById("cartPanel");

    if (overlay) overlay.classList.remove("active");
    if (panel) panel.classList.remove("active");
});
