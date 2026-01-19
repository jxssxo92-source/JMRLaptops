// =========================
// GET PRODUCT ID FROM URL
// =========================

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

// =========================
// LOAD PRODUCT FROM FIRESTORE
// =========================

let product = null;

async function loadProduct() {
    try {
        const docSnap = await db.collection("products").doc(productId).get();

        if (!docSnap.exists) {
            document.body.innerHTML = "<h2>Product not found.</h2>";
            return;
        }

        product = docSnap.data();

        document.getElementById("product-image").src = product.image;
        document.getElementById("product-name").textContent = product.name;
        document.getElementById("product-specs").textContent = product.specs;
        document.getElementById("product-price").textContent = "£" + product.price;

        document.getElementById("product-stock").textContent =
            product.stock > 0 ? `${product.stock} in stock` : "Out of stock";

    } catch (err) {
        console.error("Error loading product:", err);
        document.body.innerHTML = "<h2>Error loading product.</h2>";
    }
}

loadProduct();

// =========================
// CART SYSTEM
// =========================

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("cartCount").textContent = count;
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

function addToCart(product) {
    if (!product) return;

    if (product.stock <= 0) {
        alert("This item is out of stock.");
        return;
    }

    const existing = cart.find(item => item.id === product.id);

    if (existing) {
        if (existing.quantity >= product.stock) {
            alert("No more stock available.");
            return;
        }
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

const cartBtn = document.getElementById("cartBtn");
const cartPanel = document.getElementById("cartPanel");
const cartOverlay = document.getElementById("cartOverlay");
const closeCart = document.getElementById("closeCart");

cartBtn.onclick = () => {
    cartPanel.classList.add("active");
    cartOverlay.classList.add("active");
    loadCartPanel();
};

closeCart.onclick = () => {
    cartPanel.classList.remove("active");
    cartOverlay.classList.remove("active");
};

cartOverlay.onclick = closeCart;

function loadCartPanel() {
    const container = document.getElementById("cartItems");
    const totalEl = document.getElementById("cartTotal");

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
                <span class="cart-item-remove" onclick="removeFromCart('${item.id}')">✖</span>
            </div>
        `;
    });

    totalEl.textContent = "£" + total;
}

// =========================
// BUY NOW POPUP
// =========================

const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const modalCancel = document.getElementById("modalCancel");
const buyNowBtn = document.getElementById("buyNowBtn");

buyNowBtn.onclick = () => {
    modalOverlay.style.display = "flex";
};

modalClose.onclick = () => {
    modalOverlay.style.display = "none";
};

modalCancel.onclick = () => {
    modalOverlay.style.display = "none";
};

// Add to cart button
document.getElementById("addToCartBtn").onclick = () => {
    if (!product) return;
    addToCart(product);
};

updateCartCount();

// =========================
// SUBMIT REVIEW
// =========================

document.getElementById("submitReview").onclick = async () => {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be signed in to leave a review.");
        return;
    }

    const rating = parseInt(document.getElementById("reviewRating").value);
    const comment = document.getElementById("reviewComment").value.trim();

    if (!comment) {
        alert("Please write a comment.");
        return;
    }

    await db.collection("products")
        .doc(productId)
        .collection("reviews")
        .add({
            userId: user.uid,
            rating,
            comment,
            timestamp: Date.now()
        });

    document.getElementById("reviewComment").value = "";
    loadReviews();
};

// =========================
// LOAD REVIEWS
// =========================

function loadReviews() {
    const list = document.getElementById("reviewsList");
    list.innerHTML = "Loading...";

    db.collection("products")
        .doc(productId)
        .collection("reviews")
        .orderBy("timestamp", "desc")
        .get()
        .then(snapshot => {
            list.innerHTML = "";

            if (snapshot.empty) {
                list.innerHTML = "<p>No reviews yet.</p>";
                return;
            }

            snapshot.forEach(doc => {
                const r = doc.data();

                list.innerHTML += `
                    <div class="review">
                        <div class="review-rating">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
                        <p>${r.comment}</p>
                        <small>${new Date(r.timestamp).toLocaleString()}</small>
                    </div>
                `;
            });
        });
}

loadReviews();
