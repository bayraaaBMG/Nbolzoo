// ===== FIREBASE INIT (бүх хуудсанд ачаалагдана) =====
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBGAAuDyU13Z13KfZIEcXFvHFjPJhC1JKY",
  authDomain: "nbolzoo-e2267.firebaseapp.com",
  projectId: "nbolzoo-e2267",
  storageBucket: "nbolzoo-e2267.firebasestorage.app",
  messagingSenderId: "315466158652",
  appId: "1:315466158652:web:f1ecbefcbc26bd164ce939",
  measurementId: "G-W0CJ2GPCVK"
};

let db = null;
let auth = null;
let storage = null;
let analytics = null;

try {
  if (typeof firebase !== "undefined") {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    auth = firebase.auth();
    storage = firebase.storage();
    if (firebase.analytics) analytics = firebase.analytics();
  }
} catch (e) {
  console.warn("Firebase init failed:", e.message);
}
