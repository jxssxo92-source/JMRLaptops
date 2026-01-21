console.log("admin.js loaded");

const adminWarning = document.getElementById("adminWarning");
const adminPanel = document.getElementById("adminPanel");
const productTableBody = document.getElementById("productTableBody");

const addProductBtn = document.getElementById("addProductBtn");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const prodName = document.getElementById("prodName");
const prodSpecs = document.getElementById("prodSpecs");
const prodPrice = document.getElementById("prodPrice");
const prodImage = document.getElementById("prodImage");
const prodStock = document.getElementById("prodStock");
const saveProductBtn = document.getElementById("saveProductBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

let editingId = null;

const ADMIN_EMAIL = "jmrlaptops60@gmail.com";

auth.onAuthStateChanged(user => {
  if (!user) {
    adminWarning.textContent = "You must be logged in as admin.";
    return;
  }

  if (user.email !== ADMIN_EMAIL) {
    adminWarning.textContent = "You do not have admin access.";
    return;
  }

  adminWarning.style.display = "none";
  adminPanel.style.display = "block";
  loadProducts();
});

async function loadProducts() {
  try {
    const snap = await db.collection("products").get();

    const products = snap.docs.map(d => ({
      id: d.id,        // FIXED: store Firestore doc ID
      ...d.data()
    }));

    if (!products.length) {
      productTableBody.innerHTML = `<tr><td colspan="6">No products found.</td></tr>`;
      return;
    }

    productTableBody.innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.image}" alt="${p.name}" class="admin-thumb"></td>
        <td>${p.name}</td>
        <td>£${p.price}</td>
        <td id="stock-${p.id}">${p.stock ?? 0}</td>
        <td>
          <button class="stock-btn" data-id="${p.id}" data-delta="-1">-1</button>
          <button class="stock-btn" data-id="${p.id}" data-delta="1">+1</button>
          <button class="edit-btn" data-id="${p.id}">Edit</button>
          <button class="delete-btn" data-id="${p.id}">Delete</button>
        </td>
      </tr>
    `).join("");

    document.querySelectorAll(".stock-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const delta = parseInt(btn.getAttribute("data-delta"), 10);
        changeStock(id, delta);
      });
    });

    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => openEditModal(btn.getAttribute("data-id")));
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteProduct(btn.getAttribute("data-id")));
    });

  } catch (err) {
    console.error("Error loading products:", err);
    productTableBody.innerHTML = `<tr><td colspan="6">Error loading products.</td></tr>`;
  }
}

async function deleteProduct(id) {
  const confirmDelete = confirm("Are you sure you want to delete this product?");
  if (!confirmDelete) return;

  try {
    await db.collection("products").doc(id).delete();
    loadProducts();
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Failed to delete product.");
  }
}

async function changeStock(id, delta) {
  const ref = db.collection("products").doc(String(id));
  const snap = await ref.get();
  if (!snap.exists) return;

  const data = snap.data();
  let newStock = (data.stock ?? 0) + delta;
  if (newStock < 0) newStock = 0;

  await ref.update({
    stock: newStock,
    inStock: newStock > 0
  });

  const stockCell = document.getElementById(`stock-${id}`);
  if (stockCell) stockCell.textContent = newStock;
}

function openAddModal() {
  editingId = null;
  modalTitle.textContent = "Add Product";
  prodName.value = "";
  prodSpecs.value = "";
  prodPrice.value = "";
  prodImage.value = "";
  prodStock.value = "";
  modalOverlay.style.display = "flex";
}

async function openEditModal(id) {
  const ref = db.collection("products").doc(String(id));
  const snap = await ref.get();
  if (!snap.exists) return;

  const p = snap.data();
  editingId = id;

  modalTitle.textContent = "Edit Product";
  prodName.value = p.name || "";
  prodSpecs.value = p.specs || "";
  prodPrice.value = p.price || "";
  prodImage.value = p.image || "";
  prodStock.value = p.stock ?? 0;

  modalOverlay.style.display = "flex";
}

async function saveProduct() {
  const name = prodName.value.trim();
  const specs = prodSpecs.value.trim();
  const price = parseFloat(prodPrice.value);
  const image = prodImage.value.trim();
  const stock = parseInt(prodStock.value, 10) || 0;

  if (!name || isNaN(price) || !image) {
    alert("Name, price and image are required.");
    return;
  }

  if (editingId) {
    const ref = db.collection("products").doc(String(editingId));
    await ref.update({
      name,
      specs,
      price,
      image,
      stock,
      inStock: stock > 0
    });
  } else {
    const id = Date.now().toString();
    const ref = db.collection("products").doc(id);
    await ref.set({
      id,
      name,
      specs,
      price,
      image,
      stock,
      inStock: stock > 0
    });
  }

  modalOverlay.style.display = "none";
  loadProducts();
}

if (addProductBtn) addProductBtn.addEventListener("click", openAddModal);
if (closeModalBtn) closeModalBtn.addEventListener("click", () => modalOverlay.style.display = "none");
if (saveProductBtn) saveProductBtn.addEventListener("click", saveProduct);
