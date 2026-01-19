console.log("checkout.js loaded");

/**
 * IMPORTANT:
 * Always use a RELATIVE API path on Vercel
 * This prevents CORS + preview deployment issues
 */
const STRIPE_ENDPOINT = "/api/create-checkout-session";

document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     ELEMENT REFERENCES
  ========================== */
  const orderSummaryMain = document.getElementById("orderSummaryMain");
  const savedAddresses = document.getElementById("savedAddresses");

  const shipName = document.getElementById("shipName");
  const shipLine1 = document.getElementById("shipLine1");
  const shipLine2 = document.getElementById("shipLine2");
  const shipCity = document.getElementById("shipCity");
  const shipPostcode = document.getElementById("shipPostcode");
  const shipCountry = document.getElementById("shipCountry");

  const newAddressForm = document.getElementById("newAddressForm");
  const useNewAddressBtn = document.getElementById("useNewAddressBtn");
  const continueBtn = document.getElementById("continueBtn");
  const backBtn = document.getElementById("backBtn");
  const placeOrderBtn = document.getElementById("placeOrderBtn");

  const reviewColumn = document.getElementById("reviewColumn");
  const shippingColumn = document.getElementById("shippingColumn");

  const authModal = document.getElementById("authModal");
  const authModalClose = document.getElementById("authModalClose");
  const authModalLogin = document.getElementById("authModalLogin");
  const authModalSignup = document.getElementById("authModalSignup");

  /* =========================
     STATE
  ========================== */
  let selectedAddress = null;
  let cart = [];

  try {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    cart = [];
  }

  /* =========================
     HELPERS
  ========================== */
  function getCartTotal() {
    return cart.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );
  }

  function formatGBP(amount) {
    return `£${amount.toFixed(2)}`;
  }

  function buildAddressFromForm() {
    return {
      fullName: shipName?.value.trim(),
      line1: shipLine1?.value.trim(),
      line2: shipLine2?.value.trim(),
      city: shipCity?.value.trim(),
      postcode: shipPostcode?.value.trim(),
      country: shipCountry?.value.trim()
    };
  }

  function validateAddress(a) {
    return (
      a &&
      a.fullName &&
      a.line1 &&
      a.city &&
      a.postcode &&
      a.country
    );
  }

  /* =========================
     ORDER SUMMARY
  ========================== */
  function generateOrderSummaryHTML() {
    if (!cart.length) return "<p>Your cart is empty.</p>";

    const itemsHTML = cart
      .map(
        i => `
        <div class="summary-item">
          <span>${i.name} × ${i.quantity}</span>
          <span>${formatGBP(i.price * i.quantity)}</span>
        </div>
      `
      )
      .join("");

    const total = getCartTotal();

    const shippingHTML = selectedAddress
      ? `
        <div class="summary-block">
          <h3>Shipping to</h3>
          <p>${selectedAddress.fullName}</p>
          <p>${selectedAddress.line1}${selectedAddress.line2 ? ", " + selectedAddress.line2 : ""}</p>
          <p>${selectedAddress.city}, ${selectedAddress.postcode}</p>
          <p>${selectedAddress.country}</p>
        </div>
      `
      : "";

    return `
      <div class="summary-block">
        <h3>Items</h3>
        ${itemsHTML}
        <div class="summary-total">
          <strong>Total</strong>
          <strong>${formatGBP(total)}</strong>
        </div>
      </div>
      ${shippingHTML}
    `;
  }

  function renderOrderSummary() {
    if (orderSummaryMain) {
      orderSummaryMain.innerHTML = generateOrderSummaryHTML();
    }
  }

  /* =========================
     AUTH MODAL
  ========================== */
  function showAuthModal() {
    if (!authModal) return;
    authModal.style.display = "flex";

    authModalClose.onclick = () => (authModal.style.display = "none");
    authModalLogin.onclick = () =>
      (window.location.href = "login.html?redirect=checkout.html");
    authModalSignup.onclick = () =>
      (window.location.href = "register.html?redirect=checkout.html");
  }

  /* =========================
     LOAD ADDRESSES
  ========================== */
  async function loadSavedAddresses(user) {
    try {
      const ref = db
        .collection("users")
        .doc(user.uid)
        .collection("addresses");

      const snap = await ref.orderBy("isDefault", "desc").get();

      if (snap.empty) {
        savedAddresses.innerHTML =
          "<p>No saved addresses. Enter a new one below.</p>";
        newAddressForm?.classList.remove("hidden");
        return;
      }

      const addresses = [];
      snap.forEach(doc => addresses.push({ id: doc.id, ...doc.data() }));

      savedAddresses.innerHTML = addresses
        .map(
          a => `
        <label class="address-option">
          <input type="radio" name="addressChoice" value="${a.id}" ${a.isDefault ? "checked" : ""}>
          <div>
            <strong>${a.label || "Address"}</strong>
            <p>${a.fullName}</p>
            <p>${a.line1}${a.line2 ? ", " + a.line2 : ""}</p>
            <p>${a.city}, ${a.postcode}</p>
            <p>${a.country}</p>
          </div>
        </label>
      `
        )
        .join("");

      const checked = savedAddresses.querySelector(
        "input[name='addressChoice']:checked"
      );

      if (checked) {
        selectedAddress = addresses.find(a => a.id === checked.value);
        renderOrderSummary();
      }

      savedAddresses.onchange = e => {
        if (e.target.name === "addressChoice") {
          selectedAddress = addresses.find(a => a.id === e.target.value);
          renderOrderSummary();
        }
      };
    } catch (err) {
      console.error("Error loading addresses:", err);
      savedAddresses.innerHTML = "<p>Error loading saved addresses.</p>";
    }
  }

  /* =========================
     STRIPE CHECKOUT
  ========================== */
  async function placeOrder() {
    console.log("PLACE ORDER CLICKED");

    const user = auth.currentUser;

    if (!user) {
      showAuthModal();
      return;
    }

    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }

    if (!selectedAddress || !validateAddress(selectedAddress)) {
      alert("Please select or enter a valid shipping address.");
      return;
    }

    try {
      const payload = {
        email: user.email,
        cart,
        shipping: selectedAddress
      };

      console.log("Sending payload:", payload);

      const res = await fetch(STRIPE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Stripe error:", data);
        alert(data?.error || "Checkout failed.");
        return;
      }

      if (!data?.url) {
        alert("Stripe session failed to initialize.");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Network error. Please try again.");
    }
  }

  /* =========================
     EVENTS
  ========================== */
  renderOrderSummary();

  auth.onAuthStateChanged(user => {
    if (!user) {
      showAuthModal();
      return;
    }
    loadSavedAddresses(user);
  });

  useNewAddressBtn?.addEventListener("click", () => {
    newAddressForm?.classList.toggle("hidden");
    selectedAddress = null;
    renderOrderSummary();
  });

  continueBtn?.addEventListener("click", () => {
    const addr = buildAddressFromForm();

    if (!selectedAddress && !validateAddress(addr)) {
      alert("Please select or enter an address.");
      return;
    }

    if (validateAddress(addr)) selectedAddress = addr;

    renderOrderSummary();
    reviewColumn?.scrollIntoView({ behavior: "smooth" });
  });

  backBtn?.addEventListener("click", () => {
    shippingColumn?.scrollIntoView({ behavior: "smooth" });
  });

  placeOrderBtn?.addEventListener("click", placeOrder);
});
