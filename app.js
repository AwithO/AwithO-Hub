import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBpLuL8fVwowVXscZ7ZSjk9l4Cx0nEqU4Y",
    authDomain: "awithoyouth.firebaseapp.com",
    databaseURL: "https://awithoyouth-default-rtdb.firebaseio.com/",
    projectId: "awithoyouth",
    storageBucket: "awithoyouth.firebasestorage.app",
    messagingSenderId: "895546768017",
    appId: "1:895546768017:web:75f429127fb7784f9f1d30"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const urlParams = new URLSearchParams(window.location.search);
const threadId = urlParams.get('post');

const feedContainer = document.getElementById('thread-feed');
const mainContent = document.getElementById('main-content');
const threadHeader = document.getElementById('thread-header');
const inputLabel = document.getElementById('input-label');
const submitBtn = document.getElementById('submit-button');

if (threadId) {
    mainContent.style.display = 'none';
    threadHeader.style.display = 'block';
    inputLabel.innerText = "// INPUT_REPLY";
    submitBtn.innerText = "SEND_TO_THREAD";
    loadSingleThread(threadId);
} else {
    mainContent.style.display = 'block';
    threadHeader.style.display = 'none';
    inputLabel.innerText = "// INPUT_INTEL";
    submitBtn.innerText = "POST_TO_THE_WIRE";
    loadMainFeed();
}

function loadMainFeed() {
    onValue(ref(db, 'messages'), (snapshot) => {
        feedContainer.innerHTML = '';
        const data = snapshot.val();
        if (!data) return;
        Object.entries(data).reverse().forEach(([key, msg]) => {
            const replyCount = msg.replies ? Object.keys(msg.replies).length : 0;
            const postDiv = document.createElement('div');
            postDiv.className = 'post';
            postDiv.innerHTML = `
                <div class="post-header"><span style="color:var(--white)">${msg.username}</span></div>
                <div class="post-body">${msg.text}</div>
                <a href="?post=${key}" class="thread-link">[ VIEW_THREAD (${replyCount}) ]</a>
            `;
            feedContainer.appendChild(postDiv);
        });
    });
}

function loadSingleThread(id) {
    onValue(ref(db, `messages/${id}`), (snapshot) => {
        feedContainer.innerHTML = '';
        const msg = snapshot.val();
        if (!msg) return;

        const original = document.createElement('div');
        original.className = 'post';
        original.style.borderColor = 'var(--green)';
        original.innerHTML = `
            <div class="post-header"><span style="color:var(--white)">${msg.username}</span></div>
            <div class="post-body" style="font-size:1.2rem">${msg.text}</div>
        `;
        feedContainer.appendChild(original);

        if (msg.replies) {
            Object.values(msg.replies).forEach(r => {
                const rDiv = document.createElement('div');
                rDiv.className = 'post';
                rDiv.style.marginLeft = '20px';
                rDiv.innerHTML = `<div class="post-header"><span>${r.username}</span></div><div>${r.text}</div>`;
                feedContainer.appendChild(rDiv);
            });
        }
    });
}

document.getElementById('anonymous-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name-input').value || "Anonymous";
    const text = document.getElementById('message-input').value;
    const targetRef = threadId ? ref(db, `messages/${threadId}/replies`) : ref(db, 'messages');
    
    push(targetRef, { username: name, text: text, timestamp: serverTimestamp() });
    document.getElementById('message-input').value = '';
});