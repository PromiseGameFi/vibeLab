// VibeLab Memory - Background Service Worker v2.0
// Handles storage, sync, context menu, and keyboard shortcuts

const VIBELAB_URL = 'http://localhost:3000';
const STORAGE_KEY = 'vibelab_memories';
const SETTINGS_KEY = 'vibelab_settings';

// Default settings
const DEFAULT_SETTINGS = {
    autoSave: false,
    syncEnabled: true,
    showNotifications: true,
};

// Generate unique ID
function generateId() {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Estimate tokens
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

// Generate summary
function generateSummary(content, maxLength = 200) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    let summary = '';
    for (const sentence of sentences) {
        if ((summary + sentence).length > maxLength) break;
        summary += sentence.trim() + '. ';
    }
    return summary.trim() || content.slice(0, maxLength) + '...';
}

// Auto-detect tags from content
function detectTags(content) {
    const tags = [];
    const contentLower = content.toLowerCase();

    if (contentLower.includes('code') || contentLower.includes('function') || contentLower.includes('const ') || contentLower.includes('import ')) {
        tags.push('code');
    }
    if (contentLower.includes('api') || contentLower.includes('endpoint') || contentLower.includes('request')) {
        tags.push('api');
    }
    if (contentLower.includes('bug') || contentLower.includes('error') || contentLower.includes('fix')) {
        tags.push('debug');
    }
    if (contentLower.includes('design') || contentLower.includes('ui') || contentLower.includes('ux')) {
        tags.push('design');
    }
    if (contentLower.includes('idea') || contentLower.includes('maybe') || contentLower.includes('could')) {
        tags.push('ideas');
    }

    return tags;
}

// Save memory locally and sync to VibeLab
async function saveMemory(data) {
    const { title, content, source, sourceUrl } = data;

    const summary = generateSummary(content);
    const tags = detectTags(content);

    const memory = {
        id: generateId(),
        title,
        content,
        summary,
        tags,
        source,
        sourceUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tokenCount: estimateTokens(content),
        summaryTokenCount: estimateTokens(summary),
        relevanceScore: 100,
        tier: 'hot'
    };

    // Get existing memories
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const memories = result[STORAGE_KEY] || [];

    // Add new memory
    memories.unshift(memory);

    // Save locally
    await chrome.storage.local.set({ [STORAGE_KEY]: memories });

    // Sync to VibeLab (if enabled)
    const settings = await getSettings();
    if (settings.syncEnabled) {
        try {
            await fetch(`${VIBELAB_URL}/api/memory/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', memory }),
            });
        } catch (e) {
            console.log('[VibeLab] Sync failed, saved locally only');
        }
    }

    // Show notification
    if (settings.showNotifications) {
        showNotification(`Saved: "${title.slice(0, 30)}..."`);
    }

    console.log('[VibeLab] Memory saved:', memory.title);
    return memory;
}

// Get settings
async function getSettings() {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
}

// Update settings
async function updateSettings(updates) {
    const current = await getSettings();
    const newSettings = { ...current, ...updates };
    await chrome.storage.local.set({ [SETTINGS_KEY]: newSettings });
    return newSettings;
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

// Show notification
function showNotification(message) {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });

    setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
    }, 2000);
}

// Create context menu
chrome.runtime.onInstalled.addListener(() => {
    // Context menu for selected text
    chrome.contextMenus.create({
        id: 'save-selection',
        title: 'Save to VibeLab Memory',
        contexts: ['selection']
    });

    // Context menu for page
    chrome.contextMenus.create({
        id: 'save-page',
        title: 'Save page to VibeLab Memory',
        contexts: ['page']
    });

    console.log('[VibeLab] Context menus created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'save-selection' && info.selectionText) {
        await saveMemory({
            title: `Selection from ${new URL(tab.url).hostname}`,
            content: info.selectionText,
            source: 'other',
            sourceUrl: tab.url,
        });
    }

    if (info.menuItemId === 'save-page') {
        // Send message to content script to extract page
        chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PAGE' }, async (response) => {
            if (response && response.content) {
                await saveMemory({
                    title: response.title || tab.title,
                    content: response.content,
                    source: 'other',
                    sourceUrl: tab.url,
                });
            }
        });
    }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'save-memory') {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            chrome.tabs.sendMessage(tab.id, { type: 'SAVE_CONVERSATION' });
        }
    }

    if (command === 'toggle-auto-save') {
        const settings = await getSettings();
        const newSettings = await updateSettings({ autoSave: !settings.autoSave });

        chrome.action.setBadgeText({ text: newSettings.autoSave ? 'A' : '' });
        chrome.action.setBadgeBackgroundColor({ color: '#a855f7' });
    }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[VibeLab] Message received:', message.type);

    if (message.type === 'SAVE_MEMORY') {
        saveMemory(message.data)
            .then(memory => sendResponse({ success: true, memory }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
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

    if (message.type === 'GET_SETTINGS') {
        getSettings()
            .then(settings => sendResponse({ success: true, settings }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (message.type === 'UPDATE_SETTINGS') {
        updateSettings(message.data)
            .then(settings => sendResponse({ success: true, settings }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (message.type === 'CONVERSATION_DETECTED') {
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#a855f7' });
        sendResponse({ success: true });
        return true;
    }

    if (message.type === 'AUTO_SAVE') {
        getSettings().then(settings => {
            if (settings.autoSave) {
                saveMemory(message.data);
            }
        });
        sendResponse({ success: true });
        return true;
    }
});

// Clear badge when popup is opened
chrome.action.onClicked.addListener(() => {
    chrome.action.setBadgeText({ text: '' });
});

console.log('[VibeLab] Background service worker v2.0 started');
