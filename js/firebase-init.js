// ===== FIREBASE INIT (бүх хуудсанд ачаалагдана) =====
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA5alJmYGx7Gi6xizrl7NSXRqkm5uJtOo0",
  authDomain: "nbolzoo.firebaseapp.com",
  projectId: "nbolzoo",
  storageBucket: "nbolzoo.firebasestorage.app",
  messagingSenderId: "845704242758",
  appId: "1:845704242758:web:ffe980a3a7e79931168c47",
  measurementId: "G-F2V18RQ9L5"
};

let db = null;
let auth = null;
let storage = null;

try {
  if (typeof firebase !== "undefined") {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    auth = firebase.auth();
    storage = firebase.storage();
  }
} catch (e) {
  console.warn("Firebase init failed:", e.message);
}
