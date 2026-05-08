import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBpLuL8fVwowVXscZ7ZSjk9l4Cx0nEqU4Y",
    authDomain: "awithoyouth.firebaseapp.com",
    databaseURL: "https://awithoyouth-default-rtdb.firebaseio.com/",
    projectId: "awithoyouth",
    storageBucket: "awithoyouth.firebasestorage.app",
    messagingSenderId: "895546768017",
    appId: "1:895546768017:web:75f429127fb7784f9f1d30",
    measurementId: "G-XY20K8L5VP"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Check if we are viewing a specific post
const urlParams = new URLSearchParams(window.location.search);
const threadId = urlParams.get('post');

const feedContainer = document.getElementById('thread-feed');
const mainContent = document.getElementById('main-content');
const threadHeader = document.getElementById('thread-header');
const feedLabel = document.getElementById('feed-label');

if (threadId) {
    // MODE: THREAD VIEW
    mainContent.style.display = 'none';
    threadHeader.style.display = 'block';
    feedLabel.innerText = `// THREAD_ID: ${threadId.substring(0, 8)}`;
    loadSingleThread(threadId);
} else {
    // MODE: MAIN FEED
    mainContent.style.display = 'block';
    threadHeader.style.display = 'none';
    feedLabel.innerText = "// THE_WIRE_FEED";
    loadMainFeed();
}

// Function to load all main posts
function loadMainFeed() {
    const messagesRef = ref(db, 'messages');
    onValue(messagesRef, (snapshot) => {
        feedContainer.innerHTML = '';
        const data = snapshot.val();
        if (!data) {
            feedContainer.innerHTML = '<p style="color: #444;">[ NO LOGS FOUND ]</p>';
            return;
        }

        Object.entries(data).reverse().forEach(([key, msg]) => {
            const replyCount = msg.replies ? Object.keys(msg.replies).length : 0;
            const postDiv = document.createElement('div');
            postDiv.className = 'post';
            postDiv.innerHTML = `
                <div class="post-header"><span style="color:var(--white)">${msg.username}</span></div>
                <div class="post-body">${msg.text}</div>
                <div style="margin-top:15px;">
                    <a href="?post=${key}" style="color:var(--accent); text-decoration:none; font-size:0.8rem; font-weight:bold;">
                        [ VIEW THREAD / REPLIES (${replyCount}) ]
                    </a>
                </div>
            `;
            feedContainer.appendChild(postDiv);
        });
    });
}

// Function to load one specific post and its replies
function loadSingleThread(id) {
    const postRef = ref(db, `messages/${id}`);
    onValue(postRef, (snapshot) => {
        feedContainer.innerHTML = '';
        const msg = snapshot.val();
        if (!msg) {
            feedContainer.innerHTML = '<p style="color: var(--accent);">[ ERROR: THREAD_NOT_FOUND ]</p>';
            return;
        }

        // Original Post
        const originalPost = document.createElement('div');
        originalPost.className = 'post';
        originalPost.style.border = '1px solid var(--green)';
        originalPost.innerHTML = `
            <div class="post-header"><span style="color:var(--white)">${msg.username}</span></div>
            <div class="post-body" style="font-size:1.1rem;">${msg.text}</div>
        `;
        feedContainer.appendChild(originalPost);

        // Label for replies
        const replyLabel = document.createElement('div');
        replyLabel.className = 'label';
        replyLabel.style.marginTop = '30px';
        replyLabel.innerText = '// THREAD_REPLIES';
        feedContainer.appendChild(replyLabel);

        // Replies
        if (msg.replies) {
            Object.values(msg.replies).forEach(r => {
                const rDiv = document.createElement('div');
                rDiv.className = 'post';
                rDiv.style.marginLeft = '20px';
                rDiv.style.borderLeft = '2px solid var(--accent)';
                rDiv.innerHTML = `
                    <div class="post-header"><span style="color:var(--white)">${r.username}</span></div>
                    <div class="post-body">${r.text}</div>
                `;
                feedContainer.appendChild(rDiv);
            });
        } else {
            feedContainer.innerHTML += '<p style="color: #444; margin-left:20px;">[ NO REPLIES YET ]</p>';
        }
    });
}

// Handling form submissions (Only allowed in Thread View)
const formElement = document.getElementById('anonymous-form');
if (formElement) {
    formElement.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('name-input');
        const msgInput = document.getElementById('message-input');
        
        if (threadId) {
            const replyRef = ref(db, `messages/${threadId}/replies`);
            push(replyRef, {
                username: nameInput.value || "Anonymous",
                text: msgInput.value,
                timestamp: serverTimestamp()
            });

            msgInput.value = '';
            document.getElementById('status-msg').style.display = 'block';
            setTimeout(() => { document.getElementById('status-msg').style.display = 'none'; }, 2000);
        }
    });
}