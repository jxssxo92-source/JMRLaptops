// js/firebase-config.js
// Replace with your actual Firebase config from the Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyAbKpIKIWhb5zLFwHxmpF-uNvJ_Fb_Rw14",
  authDomain: "jmr-laptops-94f69.firebaseapp.com",
  projectId: "jmr-laptops-94f69",
  storageBucket: "jmr-laptops-94f69.appspot.com", // ✅ FIXED
  messagingSenderId: "861418823131",
  appId: "1:861418823131:web:c0104af48daea7dd845bfe"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);

// Global auth + db
const auth = firebase.auth();
const db = firebase.firestore();

// Store current user ID in localStorage
function setCurrentUser(uid) {
  if (uid) {
    localStorage.setItem("userId", uid);
  } else {
    localStorage.removeItem("userId");
  }
}

function getCurrentUser() {
  return localStorage.getItem("userId");
}

// Expose helpers globally (for other scripts)
window.auth = auth;
window.db = db;
window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
