import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// !!! PASTE YOUR NEW FIREBASE CONFIG HERE !!!
const firebaseConfig = {
    apiKey: "YOUR_NEW_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com/",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- ROUTING LOGIC ---
const urlParams = new URLSearchParams(window.location.search);
const threadId = urlParams.get('post');

const feedContainer = document.getElementById('thread-feed');
const mainContent = document.getElementById('main-content');
const threadHeader = document.getElementById('thread-header');
const inputLabel = document.getElementById('input-label');
const submitBtn = document.getElementById('submit-button');

// Check if we are in a thread or on the main wire
if (threadId) {
    // THREAD MODE
    if(mainContent) mainContent.style.display = 'none';
    if(threadHeader) threadHeader.style.display = 'block';
    if(inputLabel) inputLabel.innerText = "// INPUT_REPLY";
    if(submitBtn) submitBtn.innerText = "SEND_TO_THREAD";
    loadSingleThread(threadId);
} else {
    // MAIN FEED MODE
    if(mainContent) mainContent.style.display = 'block';
    if(threadHeader) threadHeader.style.display = 'none';
    if(inputLabel) inputLabel.innerText = "// INPUT_INTEL";
    if(submitBtn) submitBtn.innerText = "POST_TO_THE_WIRE";
    loadMainFeed();
}

// --- DATA FUNCTIONS ---

function loadMainFeed() {
    const messagesRef = ref(db, 'messages');
    onValue(messagesRef, (snapshot) => {
        feedContainer.innerHTML = '';
        const data = snapshot.val();
        if (!data) {
            feedContainer.innerHTML = '<p style="color: #444;">[ NO_DATA_ON_THE_WIRE ]</p>';
            return;
        }

        // Reverse to show newest posts first
        Object.entries(data).reverse().forEach(([key, msg]) => {
            const replyCount = msg.replies ? Object.keys(msg.replies).length : 0;
            const postDiv = document.createElement('div');
            postDiv.className = 'post';
            postDiv.innerHTML = `
                <div class="post-header"><span>${msg.username}</span></div>
                <div class="post-body">${msg.text}</div>
                <div style="margin-top:15px;">
                    <a href="?post=${key}" class="thread-link">
                        [ OPEN_THREAD // REPLIES: ${replyCount} ]
                    </a>
                </div>
            `;
            feedContainer.appendChild(postDiv);
        });
    });
}

function loadSingleThread(id) {
    const postRef = ref(db, `messages/${id}`);
    onValue(postRef, (snapshot) => {
        feedContainer.innerHTML = '';
        const msg = snapshot.val();
        if (!msg) {
            feedContainer.innerHTML = '<p style="color: var(--accent);">[ ERROR: THREAD_NOT_FOUND ]</p>';
            return;
        }

        // Create the Main Post View
        const originalPost = document.createElement('div');
        originalPost.className = 'post';
        originalPost.style.border = '1px solid var(--green)';
        originalPost.innerHTML = `
            <div class="post-header"><span style="color:var(--white)">${msg.username} (OP)</span></div>
            <div class="post-body" style="font-size:1.2rem;">${msg.text}</div>
        `;
        feedContainer.appendChild(originalPost);

        // Add a Label for Replies
        const replyLabel = document.createElement('div');
        replyLabel.className = 'label';
        replyLabel.style.marginTop = '30px';
        replyLabel.innerText = '// THREAD_REPLIES';
        feedContainer.appendChild(replyLabel);

        // Load Replies if they exist
        if (msg.replies) {
            Object.values(msg.replies).forEach(r => {
                const rDiv = document.createElement('div');
                rDiv.className = 'post';
                rDiv.style.marginLeft = '20px';
                rDiv.style.borderLeft = '2px solid var(--accent)';
                rDiv.innerHTML = `
                    <div class="post-header"><span>${r.username}</span></div>
                    <div class="post-body">${r.text}</div>
                `;
                feedContainer.appendChild(rDiv);
            });
        } else {
            const noReply = document.createElement('p');
            noReply.style.color = '#444';
            noReply.style.marginLeft = '20px';
            noReply.innerText = '[ NO_REPLIES_FOUND ]';
            feedContainer.appendChild(noReply);
        }
    });
}

// --- SUBMIT HANDLER ---

const form = document.getElementById('anonymous-form');
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById('name-input');
        const msgInput = document.getElementById('message-input');
        const name = nameInput.value || "Anonymous";
        const text = msgInput.value;

        // Path Logic: If in a thread, post to replies. Otherwise, post to main messages.
        const targetPath = threadId ? `messages/${threadId}/replies` : 'messages';
        const targetRef = ref(db, targetPath);
        
        push(targetRef, {
            username: name,
            text: text,
            timestamp: serverTimestamp()
        }).then(() => {
            msgInput.value = '';
            console.log("Transmission sent to: " + targetPath);
        }).catch((err) => {
            console.error("Transmission failed:", err);
        });
    });
}