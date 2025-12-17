
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query, orderBy } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyBTYbhIM1b0TLQEDQVw8nQr5zjJCVoIx4E",
    authDomain: "pdca-nl.firebaseapp.com",
    projectId: "pdca-nl",
    storageBucket: "pdca-nl.firebasestorage.app",
    messagingSenderId: "822955504406",
    appId: "1:822955504406:web:92216a559d9ab87152d637",
    measurementId: "G-KCX6DB2KKC",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectData() {
    try {
        console.log("Fetching daily_operations...");
        const q = query(collection(db, "daily_operations"), orderBy("date", "desc"), limit(5));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log("No value found in daily_operations");
            return;
        }

        snapshot.forEach(doc => {
            console.log(`\n--- DOCUMENT ID: ${doc.id} ---`);
            console.log(JSON.stringify(doc.data(), null, 2));
        });

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

inspectData();
