// VibeLab Memory - ChatGPT Content Script v2.0
// Enhanced extraction with auto-save support

(function () {
    'use strict';

    console.log('[VibeLab] ChatGPT content script v2.0 loaded');

    let lastMessageCount = 0;
    let lastSavedContent = '';
    let autoSaveTimer = null;

    // Create floating save button
    function createFloatingButton() {
        if (document.getElementById('vibelab-save-btn')) return;

        const container = document.createElement('div');
        container.id = 'vibelab-container';
        container.innerHTML = `
      <button id="vibelab-save-btn" class="vibelab-btn">
        🧠 Save
      </button>
      <button id="vibelab-menu-btn" class="vibelab-btn vibelab-menu">
        ⚙️
      </button>
    `;
        container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      gap: 8px;
    `;

        document.body.appendChild(container);

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
      .vibelab-btn {
        background: linear-gradient(135deg, #a855f7, #6366f1);
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 10px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4);
        transition: all 0.2s ease;
      }
      .vibelab-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 24px rgba(168, 85, 247, 0.5);
      }
      .vibelab-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .vibelab-menu {
        padding: 10px 12px;
      }
      .vibelab-toast {
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: 10001;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: vibelab-slide-in 0.3s ease;
      }
      .vibelab-toast.success { background: #22c55e; color: white; }
      .vibelab-toast.error { background: #ef4444; color: white; }
      .vibelab-toast.info { background: #3b82f6; color: white; }
      @keyframes vibelab-slide-in {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
        document.head.appendChild(style);

        // Event listeners
        document.getElementById('vibelab-save-btn').addEventListener('click', () => {
            captureCurrentConversation();
        });

        document.getElementById('vibelab-menu-btn').addEventListener('click', async () => {
            const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
            const autoSave = response.settings?.autoSave || false;
            showNotification(autoSave ? 'Auto-save: ON (Cmd+Shift+A to toggle)' : 'Auto-save: OFF', 'info');
        });
    }

    // Extract conversation - multiple selector strategies
    function extractConversation() {
        const messages = [];

        // Strategy 1: data-message-author-role attribute
        let messageElements = document.querySelectorAll('[data-message-author-role]');

        if (messageElements.length > 0) {
            messageElements.forEach(el => {
                const role = el.getAttribute('data-message-author-role');
                const textEl = el.querySelector('.markdown, .prose, [class*="markdown"]');
                const text = textEl ? textEl.innerText.trim() : el.innerText.trim();

                if (text && role) {
                    messages.push({ role: role === 'user' ? 'user' : 'assistant', content: text });
                }
            });
            return messages;
        }

        // Strategy 2: Look for conversation turns with specific patterns
        const turns = document.querySelectorAll('[class*="group"][class*="text-token"], [data-testid*="conversation-turn"]');
        if (turns.length > 0) {
            turns.forEach((turn, index) => {
                const text = turn.innerText.trim();
                if (text && text.length > 10) {
                    // Check for user indicators
                    const isUser = turn.querySelector('[data-message-author-role="user"]') ||
                        turn.classList.contains('user') ||
                        turn.querySelector('.user-message');
                    messages.push({
                        role: isUser ? 'user' : 'assistant',
                        content: text
                    });
                }
            });
            return messages;
        }

        // Strategy 3: Look for alternating message blocks
        const allMessages = document.querySelectorAll('article, [class*="message"]');
        allMessages.forEach((el, index) => {
            const text = el.innerText.trim();
            if (text && text.length > 20) {
                messages.push({
                    role: index % 2 === 0 ? 'user' : 'assistant',
                    content: text
                });
            }
        });

        return messages;
    }

    // Get conversation title
    function getConversationTitle() {
        // Try page title
        let title = document.title.replace(' - ChatGPT', '').replace('ChatGPT', '').trim();
        if (title && title.length > 5 && title.length < 100) return title;

        // Try sidebar active item
        const sidebarItem = document.querySelector('[class*="active"] [class*="title"], nav a[class*="bg-"]');
        if (sidebarItem) {
            title = sidebarItem.innerText.trim();
            if (title && title.length > 3) return title;
        }

        // Fallback: first user message
        const messages = extractConversation();
        const firstUserMsg = messages.find(m => m.role === 'user');
        if (firstUserMsg) {
            return firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
        }

        return 'ChatGPT Conversation';
    }

    // Format conversation
    function formatConversation(messages) {
        return messages.map(m => {
            const prefix = m.role === 'user' ? '**User:**' : '**Assistant:**';
            return `${prefix}\n${m.content}`;
        }).join('\n\n---\n\n');
    }

    // Save conversation
    async function captureCurrentConversation() {
        const btn = document.getElementById('vibelab-save-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '⏳ Saving...';
        }

        try {
            const messages = extractConversation();

            if (messages.length === 0) {
                showNotification('No conversation found to save', 'error');
                return;
            }

            const title = getConversationTitle();
            const content = formatConversation(messages);

            // Check if content changed since last save
            if (content === lastSavedContent) {
                showNotification('No new content to save', 'info');
                return;
            }

            const response = await chrome.runtime.sendMessage({
                type: 'SAVE_MEMORY',
                data: {
                    title: `ChatGPT: ${title}`,
                    content,
                    source: 'chatgpt',
                    sourceUrl: window.location.href
                }
            });

            if (response.success) {
                lastSavedContent = content;
                showNotification(`Saved! "${title}" (${messages.length} messages)`, 'success');
            } else {
                showNotification('Failed: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('[VibeLab] Error saving:', error);
            showNotification('Error saving conversation', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '🧠 Save';
            }
        }
    }

    // Show notification
    function showNotification(message, type = 'success') {
        const existing = document.querySelector('.vibelab-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `vibelab-toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'vibelab-slide-in 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SAVE_CONVERSATION') {
            captureCurrentConversation();
            sendResponse({ success: true });
        }

        if (message.type === 'EXTRACT_PAGE') {
            const messages = extractConversation();
            sendResponse({
                title: getConversationTitle(),
                content: formatConversation(messages)
            });
        }

        return true;
    });

    // Watch for new messages (for auto-save)
    function watchForNewMessages() {
        const messages = extractConversation();
        const currentCount = messages.length;

        if (currentCount > lastMessageCount && lastMessageCount > 0) {
            // New message detected
            chrome.runtime.sendMessage({ type: 'CONVERSATION_DETECTED' });

            // Notify for auto-save
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                const content = formatConversation(messages);
                if (content !== lastSavedContent) {
                    chrome.runtime.sendMessage({
                        type: 'AUTO_SAVE',
                        data: {
                            title: `ChatGPT: ${getConversationTitle()}`,
                            content,
                            source: 'chatgpt',
                            sourceUrl: window.location.href
                        }
                    });
                }
            }, 5000); // Wait 5s after last message for auto-save
        }

        lastMessageCount = currentCount;
    }

    // Initialize
    function init() {
        // Wait for page to load
        setTimeout(() => {
            createFloatingButton();
        }, 1500);

        // Watch for new messages
        setInterval(watchForNewMessages, 3000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
