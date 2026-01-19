console.log("product-page.js loaded");

// =========================
// GET PRODUCT ID
// =========================
const params = new URLSearchParams(window.location.search);
const productId = parseInt(params.get("id"));

// =========================
// ELEMENTS
// =========================
const imgEl = document.getElementById("productImage");
const nameEl = document.getElementById("productName");
const specsEl = document.getElementById("productSpecs");
const priceEl = document.getElementById("productPrice");

const addBtn = document.getElementById("addToCartBtn");
const buyBtn = document.getElementById("buyNowBtn");

const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const modalCancel = document.getElementById("modalCancel");

let currentProduct = null;

// =========================
// CART UI REFRESH
// =========================
function refreshCartUI() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  const badge = document.getElementById("cartCount");
  if (badge) {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = total;
  }

  const itemsEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (itemsEl && totalEl) {
    itemsEl.innerHTML = "";

    cart.forEach(item => {
      const div = document.createElement("div");
      div.classList.add("cart-item");
      div.innerHTML = `
        <span>${item.name} × ${item.quantity}</span>
        <span>£${item.price * item.quantity}</span>
      `;
      itemsEl.appendChild(div);
    });

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    totalEl.textContent = "£" + total;
  }
}

// =========================
// LOAD PRODUCT FROM FIRESTORE
// =========================
async function loadProduct() {
  try {
    const snap = await db.collection("products")
      .doc(String(productId))
      .get();

    if (!snap.exists) {
      nameEl.textContent = "Product not found";
      if (addBtn) addBtn.disabled = true;
      if (buyBtn) buyBtn.disabled = true;
      return;
    }

    currentProduct = snap.data();

    if (imgEl) imgEl.src = currentProduct.image;
    if (nameEl) nameEl.textContent = currentProduct.name;
    if (specsEl) specsEl.textContent = currentProduct.specs || "";
    if (priceEl) priceEl.textContent = "£" + currentProduct.price;

    applyStockProtection();
    setupButtons();
    refreshCartUI();
  } catch (err) {
    console.error("Error loading product:", err);
    if (nameEl) nameEl.textContent = "Error loading product";
  }
}

// =========================
// DISABLE IF OUT OF STOCK
// =========================
function applyStockProtection() {
  if (!currentProduct || !addBtn || !buyBtn) return true;

  const out = (currentProduct.stock ?? 0) <= 0 || currentProduct.inStock === false;

  if (out) {
    addBtn.disabled = true;
    buyBtn.disabled = true;

    addBtn.textContent = "Out of Stock";
    buyBtn.textContent = "Unavailable";

    addBtn.classList.add("disabled-btn");
    buyBtn.classList.add("disabled-btn");
  }

  return out;
}

// =========================
// BUTTON LOGIC
// =========================
function setupButtons() {
  if (!addBtn || !buyBtn) return;

  let isOut = applyStockProtection();

  addBtn.onclick = () => {
    if (isOut || !currentProduct) return;

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existing = cart.find(i => i.id === currentProduct.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...currentProduct, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    refreshCartUI();
  };

  buyBtn.onclick = () => {
    if (isOut) return;
    if (modalOverlay) modalOverlay.classList.add("active");
  };
}

// =========================
// MODAL CONTROLS
// =========================
if (modalClose && modalOverlay) {
  modalClose.onclick = () => modalOverlay.classList.remove("active");
}
if (modalCancel && modalOverlay) {
  modalCancel.onclick = () => modalOverlay.classList.remove("active");
}

// =========================
// INIT
// =========================
loadProduct();
