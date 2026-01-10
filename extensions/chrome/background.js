// VibeLab Memory - Background Service Worker
// Handles message passing between content scripts and storage

const VIBELAB_URL = 'http://localhost:3000';

// Storage key for memories
const STORAGE_KEY = 'vibelab_memories';

// Generate unique ID
function generateId() {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Estimate tokens (roughly 4 chars per token)
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

// Generate summary (first 200 chars)
function generateSummary(content, maxLength = 200) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    let summary = '';

    for (const sentence of sentences) {
        if ((summary + sentence).length > maxLength) break;
        summary += sentence.trim() + '. ';
    }

    return summary.trim() || content.slice(0, maxLength) + '...';
}

// Save memory to chrome.storage
async function saveMemory(data) {
    const { title, content, source, sourceUrl } = data;

    const memory = {
        id: generateId(),
        title,
        content,
        summary: generateSummary(content),
        tags: [],
        source,
        sourceUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tokenCount: estimateTokens(content),
        summaryTokenCount: estimateTokens(generateSummary(content)),
        relevanceScore: 100,
        tier: 'hot'
    };

    // Get existing memories
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const memories = result[STORAGE_KEY] || [];

    // Add new memory
    memories.unshift(memory);

    // Save back
    await chrome.storage.local.set({ [STORAGE_KEY]: memories });

    console.log('[VibeLab] Memory saved:', memory.title);

    return memory;
}

// Get all memories
async function getMemories() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || [];
}

// Get memory count
async function getMemoryCount() {
    const memories = await getMemories();
    return memories.length;
}

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[VibeLab] Message received:', message.type);

    if (message.type === 'SAVE_MEMORY') {
        saveMemory(message.data)
            .then(memory => sendResponse({ success: true, memory }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep channel open for async response
    }

    if (message.type === 'GET_MEMORIES') {
        getMemories()
            .then(memories => sendResponse({ success: true, memories }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (message.type === 'GET_COUNT') {
        getMemoryCount()
            .then(count => sendResponse({ success: true, count }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (message.type === 'CONVERSATION_DETECTED') {
        // Show notification or badge
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#a855f7' });
        sendResponse({ success: true });
        return true;
    }
});

// Clear badge when popup is opened
chrome.action.onClicked.addListener(() => {
    chrome.action.setBadgeText({ text: '' });
});

console.log('[VibeLab] Background service worker started');
