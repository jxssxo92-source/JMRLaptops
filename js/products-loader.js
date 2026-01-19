// =========================
// MASTER PRODUCT LIST
// =========================
let allProducts = [];

// =========================
// BADGE PILL
// =========================
function getBadge(p) {
  if (p.sale) return `<span class="product-pill pill-sale">Sale</span>`;
  if (p.featured) return `<span class="product-pill pill-featured">Featured</span>`;

  // ⭐ NEW: Replace "Low stock" with actual stock count
  if (typeof p.stock !== "undefined") {
    if (p.stock <= 0) {
      return `<span class="product-pill pill-out">Out of Stock</span>`;
    }
    return `<span class="product-pill pill-stock">Stock: ${p.stock}</span>`;
  }

  return "";
}

// =========================
// RATING STARS
// =========================
function getRatingStars(rating) {
  if (!rating && rating !== 0) return "";

  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  let stars = "";
  for (let i = 0; i < full; i++) stars += "★";
  if (half) stars += "☆";
  for (let i = 0; i < empty; i++) stars += "✩";

  return `
    <span class="product-rating">
      ${stars}
      <span class="rating-value">${rating.toFixed(1)}</span>
    </span>
  `;
}

// =========================
// FILTER LOGIC (PRICE + STOCK ONLY)
// =========================
function applyFilters(products) {
  const hideOutOfStock = document.getElementById("hideOutOfStock")?.checked;

  const min = parseFloat(document.getElementById("priceMin")?.value);
  const max = parseFloat(document.getElementById("priceMax")?.value);

  return products.filter(p => {
    const hasStockField = typeof p.stock !== "undefined";
    const isInStockFlag =
      p.inStock === true ||
      p.inStock === "true" ||
      (hasStockField && p.stock > 0);

    if (hideOutOfStock && !isInStockFlag) return false;

    if (!isNaN(min) && p.price < min) return false;
    if (!isNaN(max) && p.price > max) return false;

    return true;
  });
}

// =========================
// RENDER PRODUCTS
// =========================
function renderProducts(products) {
  const list = document.getElementById("productList");
  if (!list) return;

  list.innerHTML = "";

  products.forEach(p => {
    const badge = getBadge(p);
    const rating = getRatingStars(p.rating || 4.8);

    list.innerHTML += `
      <article class="product-row" data-id="${p.id}">
        <div class="product-row-image">
          <img src="${p.image}" alt="${p.name}">
        </div>

        <div class="product-row-main">
          <div class="product-row-top">
            <h2 class="product-row-title">${p.name}</h2>
            ${badge}
          </div>

          <ul class="product-row-specs">
            ${p.cpu ? `<li>${p.cpu}</li>` : ""}
            ${p.ram ? `<li>${p.ram}GB RAM</li>` : ""}
            ${p.storage ? `<li>${p.storage}</li>` : ""}
            ${p.gpu ? `<li>${p.gpu}</li>` : ""}
          </ul>

          <div class="product-row-meta">${rating}</div>
        </div>

        <div class="product-row-side">
          <div class="product-row-price">
            <span class="price-main">£${p.price}</span>
          </div>

          <div class="product-row-actions">
            <a href="product.html?id=${p.id}" class="btn-link">View product</a>
          </div>
        </div>
      </article>
    `;
  });

  document.querySelectorAll(".product-row").forEach(row => {
    row.addEventListener("click", e => {
      if (e.target.classList.contains("btn-link")) return;
      const id = row.getAttribute("data-id");
      if (!id) return;
      window.location.href = `product.html?id=${id}`;
    });
  });
}

// =========================
// LOAD PRODUCTS
// =========================
async function loadProducts() {
  const list = document.getElementById("productList");
  if (!list) return;

  list.innerHTML = "Loading products...";

  try {
    const snapshot = await db.collection("products").orderBy("id").get();

    if (snapshot.empty) {
      list.innerHTML = "<p>No products available.</p>";
      return;
    }

    allProducts = [];
    snapshot.forEach(doc => allProducts.push(doc.data()));

    renderProducts(applyFilters(allProducts));

    document.getElementById("hideOutOfStock").addEventListener("change", () => {
      renderProducts(applyFilters(allProducts));
    });

    document.getElementById("applyPriceFilter").addEventListener("click", () => {
      renderProducts(applyFilters(allProducts));
    });

  } catch (err) {
    console.error("Error loading products:", err);
    list.innerHTML = "<p>Error loading products.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadProducts);
