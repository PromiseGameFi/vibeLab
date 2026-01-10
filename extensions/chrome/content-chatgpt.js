// VibeLab Memory - ChatGPT Content Script
// Captures conversations from chat.openai.com and chatgpt.com

(function () {
    'use strict';

    console.log('[VibeLab] ChatGPT content script loaded');

    let lastMessageCount = 0;
    let captureEnabled = true;

    // Create floating save button
    function createFloatingButton() {
        if (document.getElementById('vibelab-save-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'vibelab-save-btn';
        btn.innerHTML = '🧠 Save to Memory';
        btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #a855f7, #6366f1);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 6px 24px rgba(168, 85, 247, 0.5)';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.4)';
        });

        btn.addEventListener('click', () => {
            captureCurrentConversation();
        });

        document.body.appendChild(btn);
    }

    // Extract conversation from the page
    function extractConversation() {
        const messages = [];

        // ChatGPT uses article elements or divs with data-message attributes
        const messageElements = document.querySelectorAll('[data-message-author-role]');

        if (messageElements.length === 0) {
            // Fallback: Look for turn containers
            const turns = document.querySelectorAll('[class*="group"][class*="text-token"]');
            turns.forEach((turn, index) => {
                const text = turn.innerText.trim();
                if (text) {
                    // Odd turns are usually user, even are assistant
                    const role = index % 2 === 0 ? 'user' : 'assistant';
                    messages.push({ role, content: text });
                }
            });
        } else {
            messageElements.forEach(el => {
                const role = el.getAttribute('data-message-author-role');
                const textEl = el.querySelector('.markdown, .prose, [class*="markdown"]');
                const text = textEl ? textEl.innerText.trim() : el.innerText.trim();

                if (text && role) {
                    messages.push({ role, content: text });
                }
            });
        }

        return messages;
    }

    // Get conversation title
    function getConversationTitle() {
        // Try to get from page title
        const title = document.title.replace(' - ChatGPT', '').replace('ChatGPT', '').trim();
        if (title && title.length > 5) return title;

        // Fallback: first user message truncated
        const messages = extractConversation();
        const firstUserMsg = messages.find(m => m.role === 'user');
        if (firstUserMsg) {
            return firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
        }

        return 'ChatGPT Conversation';
    }

    // Format conversation as text
    function formatConversation(messages) {
        return messages.map(m => {
            const prefix = m.role === 'user' ? '**User:**' : '**Assistant:**';
            return `${prefix}\n${m.content}`;
        }).join('\n\n---\n\n');
    }

    // Save current conversation
    async function captureCurrentConversation() {
        const btn = document.getElementById('vibelab-save-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Saving...';
        btn.disabled = true;

        try {
            const messages = extractConversation();

            if (messages.length === 0) {
                showNotification('No conversation found to save', 'error');
                return;
            }

            const title = getConversationTitle();
            const content = formatConversation(messages);

            // Send to background script
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
                showNotification(`Saved! "${title}" (${messages.length} messages)`, 'success');
            } else {
                showNotification('Failed to save: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('[VibeLab] Error saving:', error);
            showNotification('Error saving conversation', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    // Show notification toast
    function showNotification(message, type = 'success') {
        const existing = document.getElementById('vibelab-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'vibelab-toast';
        toast.innerText = message;
        toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 10001;
      background: ${type === 'success' ? '#22c55e' : '#ef4444'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
    `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Add CSS animations
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100px); opacity: 0; }
      }
    `;
        document.head.appendChild(style);
    }

    // Initialize
    function init() {
        addStyles();

        // Wait for page to load
        setTimeout(() => {
            createFloatingButton();
        }, 1000);

        // Re-check for new messages periodically
        setInterval(() => {
            const messages = extractConversation();
            if (messages.length > lastMessageCount && lastMessageCount > 0) {
                // New message detected
                chrome.runtime.sendMessage({ type: 'CONVERSATION_DETECTED' });
            }
            lastMessageCount = messages.length;
        }, 2000);
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
