import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDWwbl-EfJ2Ks3LG1rRf39xeCn_TrM3E9k",
  authDomain: "earsound-v1.firebaseapp.com",
  projectId: "earsound-v1",
  storageBucket: "earsound-v1.firebasestorage.app",
  messagingSenderId: "522125091301",
  appId: "1:522125091301:web:d8b8f79a39bdad90b8cf0c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspect() {
  console.log("=== INSPECTING FIRESTORE DATA ===");

  const collections = [
    'jasa_periksa',
    'jasaPeriksa',
    'abd',
    'aksesoris',
    'inventoryABD',
    'inventoryAksesoris',
    'kas_kecil',
    'kasKecil',
    'earmould',
    'reparasi'
  ];

  for (const col of collections) {
    const snap = await getDocs(collection(db, col));
    console.log(`\n--- Collection: ${col} (${snap.size} docs) ---`);
    snap.forEach(d => {
      const data = d.data();
      console.log(`[${d.id}]`, JSON.stringify(data).slice(0, 160));
    });
  }
}

inspect().catch(err => {
  console.error("Inspect error:", err);
  process.exit(1);
});
