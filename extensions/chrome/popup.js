// VibeLab Memory - Popup Script

const STORAGE_KEY = 'vibelab_memories';
const VIBELAB_URL = 'http://localhost:3000';

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

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

// Format number with K/M suffix
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Load and display memories
async function loadMemories() {
    try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        const memories = result[STORAGE_KEY] || [];

        // Update stats
        document.getElementById('memory-count').textContent = memories.length;
        const totalTokens = memories.reduce((sum, m) => sum + (m.tokenCount || 0), 0);
        document.getElementById('token-count').textContent = formatNumber(totalTokens);

        // Update list
        const container = document.getElementById('memories-container');

        if (memories.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div>No memories yet</div>
          <div style="font-size: 11px; margin-top: 4px;">
            Visit ChatGPT, Claude, or Gemini to save conversations
          </div>
        </div>
      `;
            return;
        }

        // Show recent 5 memories
        const recentMemories = memories.slice(0, 5);
        container.innerHTML = recentMemories.map(memory => `
      <div class="memory-item" data-id="${memory.id}">
        <div class="memory-title">${memory.title}</div>
        <div class="memory-meta">
          <span class="memory-source">
            ${SOURCE_ICONS[memory.source] || '📝'} ${memory.source}
          </span>
          <span>${memory.tokenCount} tokens</span>
          <span>${timeAgo(memory.createdAt)}</span>
        </div>
      </div>
    `).join('');

        // Add click handlers
        container.querySelectorAll('.memory-item').forEach(item => {
            item.addEventListener('click', () => {
                // Open dashboard with memory selected
                chrome.tabs.create({ url: `${VIBELAB_URL}/memory` });
            });
        });

    } catch (error) {
        console.error('Error loading memories:', error);
        showStatus('Error loading memories', true);
    }
}

// Show status message
function showStatus(message, isError = false) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = 'status' + (isError ? ' error' : '');
    status.style.display = 'block';

    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
}

// Clear all memories
async function clearAllMemories() {
    if (!confirm('Are you sure you want to delete all memories? This cannot be undone.')) {
        return;
    }

    try {
        await chrome.storage.local.remove(STORAGE_KEY);
        showStatus('All memories cleared');
        loadMemories();
    } catch (error) {
        showStatus('Error clearing memories', true);
    }
}

// Open dashboard
function openDashboard() {
    chrome.tabs.create({ url: `${VIBELAB_URL}/memory` });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMemories();

    document.getElementById('open-dashboard').addEventListener('click', openDashboard);
    document.getElementById('clear-all').addEventListener('click', clearAllMemories);

    // Clear badge
    chrome.action.setBadgeText({ text: '' });
});
