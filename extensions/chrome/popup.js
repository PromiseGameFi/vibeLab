// VibeLab Memory - Popup Script v2.0

const STORAGE_KEY = 'vibelab_memories';
const SETTINGS_KEY = 'vibelab_settings';
const VIBELAB_URL = 'https://vibe-lab-henna.vercel.app';

// Source icons
const SOURCE_ICONS = {
    chatgpt: '🤖',
    claude: '🧠',
    gemini: '✨',
    cursor: '💻',
    manual: '✏️',
    other: '📝'
};

// Format relative time
function timeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
}

// Format number
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Load and display memories
async function loadMemories(searchQuery = '') {
    try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        let memories = result[STORAGE_KEY] || [];

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            memories = memories.filter(m =>
                m.title.toLowerCase().includes(query) ||
                m.content.toLowerCase().includes(query) ||
                (m.tags && m.tags.some(t => t.toLowerCase().includes(query)))
            );
        }

        // Update stats
        document.getElementById('memory-count').textContent = memories.length;
        const totalTokens = memories.reduce((sum, m) => sum + (m.tokenCount || 0), 0);
        document.getElementById('token-count').textContent = formatNumber(totalTokens);
        const sources = new Set(memories.map(m => m.source));
        document.getElementById('source-count').textContent = sources.size;

        // Update list
        const container = document.getElementById('memories-container');

        if (memories.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${searchQuery ? '🔍' : '📭'}</div>
          <div>${searchQuery ? 'No results found' : 'No memories yet'}</div>
        </div>
      `;
            return;
        }

        // Show recent memories
        const recentMemories = memories.slice(0, 8);
        container.innerHTML = recentMemories.map(memory => `
      <div class="memory-item" data-id="${memory.id}">
        <div class="memory-title">${memory.title}</div>
        <div class="memory-meta">
          <span class="memory-source">
            ${SOURCE_ICONS[memory.source] || '📝'} ${memory.source}
          </span>
          <span>${memory.tokenCount || 0} tokens</span>
          <span>${timeAgo(memory.createdAt)}</span>
        </div>
        ${memory.tags && memory.tags.length > 0 ? `
          <div class="memory-tags">
            ${memory.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

        // Add click handlers
        container.querySelectorAll('.memory-item').forEach(item => {
            item.addEventListener('click', () => {
                chrome.tabs.create({ url: `${VIBELAB_URL}/memory` });
            });
        });

    } catch (error) {
        console.error('Error loading memories:', error);
    }
}

// Load settings
async function loadSettings() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
        const settings = response.settings || {};

        const autoSaveToggle = document.getElementById('auto-save-toggle');
        const syncToggle = document.getElementById('sync-toggle');

        if (settings.autoSave) {
            autoSaveToggle.classList.add('active');
        }
        if (settings.syncEnabled !== false) {
            syncToggle.classList.add('active');
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Toggle setting
async function toggleSetting(settingName) {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    const current = response.settings || {};
    const newValue = !current[settingName];

    await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        data: { [settingName]: newValue }
    });

    return newValue;
}

// Add quick note
async function addQuickNote() {
    const note = prompt('Enter a quick note:');
    if (!note) return;

    const title = prompt('Title for this note:', 'Quick Note');
    if (!title) return;

    await chrome.runtime.sendMessage({
        type: 'SAVE_MEMORY',
        data: {
            title,
            content: note,
            source: 'manual',
        }
    });

    loadMemories();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMemories();
    loadSettings();

    // Search
    const searchInput = document.getElementById('search');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadMemories(e.target.value);
        }, 300);
    });

    // Settings toggles
    document.getElementById('auto-save-toggle').addEventListener('click', async (e) => {
        const newValue = await toggleSetting('autoSave');
        e.target.classList.toggle('active', newValue);
    });

    document.getElementById('sync-toggle').addEventListener('click', async (e) => {
        const newValue = await toggleSetting('syncEnabled');
        e.target.classList.toggle('active', newValue);
    });

    // Actions
    document.getElementById('open-dashboard').addEventListener('click', () => {
        chrome.tabs.create({ url: `${VIBELAB_URL}/memory` });
    });

    document.getElementById('add-note').addEventListener('click', addQuickNote);

    // Clear badge
    chrome.action.setBadgeText({ text: '' });
});
