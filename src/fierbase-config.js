import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyAv5H0-jgze_z1dvT8mHFRwusYXAiTSJgw",
    authDomain: "digitalrakhi-f8060.firebaseapp.com",
    databaseURL: "https://digitalrakhi-f8060-default-rtdb.firebaseio.com",
    projectId: "digitalrakhi-f8060",
    storageBucket: "digitalrakhi-f8060.appspot.com",
    messagingSenderId: "360526523502",
    appId: "1:360526523502:web:3e1af0fd17e9bb1ca5ca7f",
    measurementId: "G-FPJ5LHJEVS"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };
