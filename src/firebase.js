// src/firebase.js

// 1. IMPORTAR TUDO QUE PRECISAMOS
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Suas credenciais do NOVO projeto
const firebaseConfig = {
  apiKey: "AIzaSyCZGXCFOaKitaUlVcOIyTwweuL-ijx6v_Q",
  authDomain: "meu-app-treinos-final.firebaseapp.com",
  projectId: "meu-app-treinos-final",
  // 2. CORREÇÃO CRÍTICA AQUI:
  storageBucket: "meu-app-treinos-final.appspot.com",
  messagingSenderId: "275965865835",
  appId: "1:275965865835:web:99fdc661ff23916ea7662e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 3. EXPORTAR OS SERVIÇOS PARA O RESTO DO APP USAR
export const auth = getAuth(app);
export const db = getFirestore(app);