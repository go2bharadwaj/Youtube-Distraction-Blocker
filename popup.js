console.log("✅ popup.js loaded");

document.getElementById("save").addEventListener("click", () => {
    const topic = document.getElementById("topic").value;
    chrome.storage.local.set({ studyTopic: topic }, () => {
        console.log(`📝 Topic saved: ${topic}`);
        alert(`Study topic set to: ${topic}`);
    });
});

