console.log("✅ content.js injected");

// === SETTINGS ===
const YOUTUBE_API_KEY = "AIzaSyCwt9kU-Kj55IHqFQo8CCX-imjBpfLB2RI"; // 🔁 Replace with yours
const RELEVANCE_API_URL = "https://ml-blocker-api-1077647477.us-central1.run.app/check-relevance";


// === 1. Get YouTube video ID ===
function getVideoId() {
    const url = new URL(window.location.href);
    const v = url.searchParams.get("v");
    console.log("🎥 Video ID:", v);
    return v;
}

// === 2. Get stored study topic ===
function getStudyTopic() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["studyTopic"], (result) => {
            const topic = result.studyTopic || "";
            console.log("📚 Retrieved topic:", topic);
            resolve(topic);
        });
    });
}

// === 3. Fetch video metadata using YT Data API ===
async function getVideoDetails(videoId) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    console.log("🔍 Fetching video details:", apiUrl);

    try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        console.log("📦 YouTube API response:", data);

        const snippet = data.items?.[0]?.snippet;
        const title = snippet?.title || "";
        const description = snippet?.description || "";

        console.log("🎬 Video title:", title);
        console.log("📝 Video description:", description);

        return { title, description };
    } catch (err) {
        console.error("❌ Failed to fetch video data:", err);
        return { title: "", description: "" };
    }
}

// === 4. Call ML relevance API ===
async function checkRelevance(topic, title, description) {
    const body = JSON.stringify({ topic, title, description });
    console.log("🧠 Sending to relevance API:", body);

    try {
        const res = await fetch(RELEVANCE_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("❌ Relevance API Error:", res.status, errText);
            return true; // fail open
        }

        const data = await res.json();
        console.log("📊 Relevance response:", data);
        return data.relevant;
    } catch (err) {
        console.error("🚨 API fetch failed:", err);
        return true; // fail open
    }
}


// === 5. Block video ===
function blockVideo() {
    console.log("🚫 Blocking video — pausing playback & showing warning");

    // Wait for video to load (YouTube might delay rendering)
    const pauseInterval = setInterval(() => {
        const video = document.querySelector("video");
        if (video) {
            video.pause();
            console.log("⏸️ Video paused");
            clearInterval(pauseInterval);
        }
    }, 300); // check every 300ms

    // Create warning UI
    const container = document.createElement("div");
    container.id = "yt-study-blocker-overlay"; // 👈 so we can remove it later

    container.innerHTML = `
    <div style="
      background: #111;
      color: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      font-size: 20px;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      max-width: 800px;
      margin: auto;
    ">
      <h2>🚫 This video isn't related to your study topic.</h2>
      <p>You're focused on <strong>${studyTopic}</strong>.</p>
      <button id="override" style="
        margin-top: 16px;
        padding: 10px 20px;
        font-size: 16px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
      ">Let me watch anyway</button>
    </div>
  `;

    container.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    height: 500px;
    margin-top: 20px;
  `;

    // Insert below the video title area
    const refNode = document.querySelector("#title");
    if (refNode && refNode.parentNode) {
        refNode.parentNode.insertBefore(container, refNode.nextSibling);
    }

    // 🔓 Restore video playback on button click
    container.querySelector("#override").addEventListener("click", () => {
        const video = document.querySelector("video");
        if (video) {
            video.play();
            console.log("🟢 Override clicked — resuming video");
        }
        container.remove();
    });
}



// === 6. Main async init ===
async function runBlocker() {
    console.log("🔁 Running blocker logic...");

    // ✅ Clean up any old UI from a previous video
    removeBlockUI();

    const videoId = getVideoId();
    if (!videoId) return console.warn("⚠️ No video ID found.");

    const topic = await getStudyTopic();
    window.studyTopic = topic;
    if (!topic) return console.warn("⚠️ No topic set in extension popup.");

    const { title, description } = await getVideoDetails(videoId);
    if (!title || !description) {
        return console.warn("⚠️ Missing title or description from API.");
    }

    const relevant = await checkRelevance(topic, title, description);
    if (!relevant) blockVideo();
}


// ✅ Run once on initial page load
(async () => {
    await runBlocker();
    lastVideoId = getVideoId(); // 👈 Sets initial baseline for URL change detection
})();

// == 7 Observer for URL change
let lastVideoId = null;

const observer = new MutationObserver(() => {
    const currentVideoId = getVideoId();
    if (currentVideoId && currentVideoId !== lastVideoId) {
        console.log("🔁 Detected video change:", currentVideoId);
        lastVideoId = currentVideoId;
        runBlocker(); // re-run main logic
    }
});

function removeBlockUI() {
    const container = document.querySelector("#yt-study-blocker-overlay");
    if (container) {
        console.log("🧹 Cleaning up old block overlay");
        container.remove();
    }
}


observer.observe(document.body, { childList: true, subtree: true });


