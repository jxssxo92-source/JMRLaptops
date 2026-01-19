// js/cart.js
console.log("cart.js loaded");

// =============================
// Storage helpers
// =============================
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
}

function setCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// =============================
// Badge
// =============================
function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;

  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = count > 0 ? count : "";
}

// =============================
// Drawer render
// =============================
function renderCartDrawer() {
  const cartItems = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");
  if (!cartItems) return;

  const cart = getCart();

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
    if (cartTotalEl) cartTotalEl.textContent = "£0";
    return;
  }

  cartItems.innerHTML = cart
    .map(
      item => `
      <div class="cart-item">
        
        <img src="${item.image}" class="cart-item-img" alt="${item.name}" />

        <div class="cart-item-info">
          <strong>${item.name}</strong><br>
          £${item.price} × ${item.quantity}
        </div>

        <div class="cart-item-actions">
          <button class="qty-btn" data-id="${item.id}" data-action="minus">−</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" data-id="${item.id}" data-action="plus">+</button>
          <button class="remove-btn" data-id="${item.id}">Remove</button>
        </div>

      </div>
    `
    )
    .join("");

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (cartTotalEl) cartTotalEl.textContent = `£${total}`;

  // Quantity buttons
  cartItems.querySelectorAll(".qty-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      updateQuantity(btn.dataset.id, btn.dataset.action);
    });
  });

  // Remove buttons
  cartItems.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      removeItem(btn.dataset.id);
    });
  });
}

// =============================
// Cart mutations
// =============================
function updateQuantity(id, action) {
  const cart = getCart();
  const item = cart.find(i => String(i.id) === String(id));
  if (!item) return;

  if (action === "plus") item.quantity += 1;
  if (action === "minus") item.quantity = Math.max(1, item.quantity - 1);

  setCart(cart);
  updateCartBadge();
  renderCartDrawer();
}

function removeItem(id) {
  const cart = getCart().filter(i => String(i.id) !== String(id));
  setCart(cart);
  updateCartBadge();
  renderCartDrawer();
}

// =============================
// Add to cart (product page)
// =============================
function addToCart(product) {
  if (!product || !product.id) {
    console.error("Invalid product passed to addToCart");
    return;
  }

  const cart = getCart();
  const existing = cart.find(i => String(i.id) === String(product.id));

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image, // ⭐ FIXED: image now stored
      quantity: 1
    });
  }

  setCart(cart);
  updateCartBadge();
  renderCartDrawer();
}

window.addToCart = addToCart;

// =============================
// Drawer open / close
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const cartBtn = document.getElementById("cartBtn");
  const cartPanel = document.getElementById("cartPanel");
  const cartOverlay = document.getElementById("cartOverlay");
  const closeCart = document.getElementById("closeCart");

  updateCartBadge();
  renderCartDrawer();

  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      cartPanel.classList.add("open");
      cartOverlay.classList.add("active");
      renderCartDrawer();
    });
  }

  if (closeCart) {
    closeCart.addEventListener("click", () => {
      cartPanel.classList.remove("open");
      cartOverlay.classList.remove("active");
    });
  }

  if (cartOverlay) {
    cartOverlay.addEventListener("click", () => {
      cartPanel.classList.remove("open");
      cartOverlay.classList.remove("active");
    });
  }
});
