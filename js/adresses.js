let currentAddressId = null;

const user = () => auth.currentUser;

function getAddressesRef() {
    return db.collection("users").doc(user().uid).collection("addresses");
}

async function loadAddresses() {
    const list = document.getElementById("addressesList");
    list.innerHTML = "Loading...";

    const snap = await getAddressesRef().orderBy("isDefault", "desc").get();

    if (snap.empty) {
        list.innerHTML = "<p>No saved addresses yet.</p>";
        return;
    }

    list.innerHTML = "";
    snap.forEach(doc => {
        const a = doc.data();
        list.innerHTML += `
            <div class="address-card">
                <div>
                    <strong>${a.label || "Address"}</strong>
                    ${a.isDefault ? `<span class="badge badge-primary">Default</span>` : ""}
                    <p>${a.fullName}</p>
                    <p>${a.line1}</p>
                    ${a.line2 ? `<p>${a.line2}</p>` : ""}
                    <p>${a.city}, ${a.postcode}</p>
                    <p>${a.country}</p>
                </div>
                <div class="address-actions">
                    <button onclick="editAddress('${doc.id}')" class="action-btn">Edit</button>
                    <button onclick="deleteAddress('${doc.id}')" class="action-btn delete-btn">Delete</button>
                </div>
            </div>
        `;
    });
}

async function openAddressModal(id = null) {
    currentAddressId = id;

    if (id) {
        const docSnap = await getAddressesRef().doc(id).get();
        const a = docSnap.data();
        addrLabel.value = a.label || "";
        addrName.value = a.fullName || "";
        addrLine1.value = a.line1 || "";
        addrLine2.value = a.line2 || "";
        addrCity.value = a.city || "";
        addrPostcode.value = a.postcode || "";
        addrCountry.value = a.country || "";
        addrDefault.checked = !!a.isDefault;
    } else {
        addrLabel.value = "";
        addrName.value = "";
        addrLine1.value = "";
        addrLine2.value = "";
        addrCity.value = "";
        addrPostcode.value = "";
        addrCountry.value = "";
        addrDefault.checked = false;
    }

    addressModal.style.display = "flex";
}

function closeAddressModal() {
    addressModal.style.display = "none";
    currentAddressId = null;
}

async function saveAddress() {
    if (!user()) {
        alert("You must be signed in.");
        return;
    }

    const data = {
        label: addrLabel.value.trim(),
        fullName: addrName.value.trim(),
        line1: addrLine1.value.trim(),
        line2: addrLine2.value.trim(),
        city: addrCity.value.trim(),
        postcode: addrPostcode.value.trim(),
        country: addrCountry.value.trim(),
        isDefault: addrDefault.checked
    };

    if (!data.fullName || !data.line1 || !data.city || !data.postcode || !data.country) {
        alert("Please fill in all required fields.");
        return;
    }

    const ref = getAddressesRef();

    if (data.isDefault) {
        const snap = await ref.where("isDefault", "==", true).get();
        const batch = db.batch();
        snap.forEach(d => batch.update(d.ref, { isDefault: false }));
        await batch.commit();
    }

    if (currentAddressId) {
        await ref.doc(currentAddressId).update(data);
    } else {
        await ref.add(data);
    }

    closeAddressModal();
    loadAddresses();
}

async function editAddress(id) {
    await openAddressModal(id);
}

async function deleteAddress(id) {
    if (!confirm("Delete this address?")) return;
    await getAddressesRef().doc(id).delete();
    loadAddresses();
}

document.addEventListener("DOMContentLoaded", () => {
    auth.onAuthStateChanged(u => {
        if (!u) return;
        loadAddresses();
    });

    addAddressBtn.onclick = () => openAddressModal();
    cancelAddressBtn.onclick = closeAddressModal;
    saveAddressBtn.onclick = saveAddress;
});
