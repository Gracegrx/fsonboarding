// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCgxa-qPymV6zcVFP-REh1zWpMTOV9Yk_A",
  authDomain: "react-recipe-app-55e41.firebaseapp.com",
  projectId: "react-recipe-app-55e41",
  storageBucket: "react-recipe-app-55e41.appspot.com",
  messagingSenderId: "532046967698",
  appId: "1:532046967698:web:86c8245fc2f523f533c74b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };