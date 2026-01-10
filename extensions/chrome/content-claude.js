// VibeLab Memory - Claude Content Script
// Captures conversations from claude.ai

(function () {
    'use strict';

    console.log('[VibeLab] Claude content script loaded');

    let lastMessageCount = 0;

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
    `;

        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.05)';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
        });

        btn.addEventListener('click', captureCurrentConversation);

        document.body.appendChild(btn);
    }

    // Extract conversation from Claude
    function extractConversation() {
        const messages = [];

        // Claude uses specific class patterns for messages
        // Look for human and assistant message containers
        const humanMessages = document.querySelectorAll('[class*="human-message"], [data-testid*="human"]');
        const assistantMessages = document.querySelectorAll('[class*="assistant-message"], [data-testid*="assistant"]');

        // Fallback: Look for alternating message blocks
        if (humanMessages.length === 0 && assistantMessages.length === 0) {
            const allMessages = document.querySelectorAll('[class*="message-content"], [class*="prose"]');
            allMessages.forEach((el, index) => {
                const text = el.innerText.trim();
                if (text && text.length > 10) {
                    messages.push({
                        role: index % 2 === 0 ? 'user' : 'assistant',
                        content: text
                    });
                }
            });
        } else {
            // Combine and sort by DOM position
            const allEls = [...humanMessages, ...assistantMessages];
            allEls.sort((a, b) => {
                const pos = a.compareDocumentPosition(b);
                return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
            });

            allEls.forEach(el => {
                const isHuman = el.className.includes('human') || el.getAttribute('data-testid')?.includes('human');
                const text = el.innerText.trim();
                if (text) {
                    messages.push({
                        role: isHuman ? 'user' : 'assistant',
                        content: text
                    });
                }
            });
        }

        return messages;
    }

    // Get conversation title
    function getConversationTitle() {
        // Try sidebar or page title
        const titleEl = document.querySelector('[class*="conversation-title"], h1');
        if (titleEl && titleEl.innerText.trim()) {
            return titleEl.innerText.trim().slice(0, 60);
        }

        // Fallback to first user message
        const messages = extractConversation();
        const firstUserMsg = messages.find(m => m.role === 'user');
        if (firstUserMsg) {
            return firstUserMsg.content.slice(0, 50) + '...';
        }

        return 'Claude Conversation';
    }

    // Format conversation
    function formatConversation(messages) {
        return messages.map(m => {
            const prefix = m.role === 'user' ? '**User:**' : '**Claude:**';
            return `${prefix}\n${m.content}`;
        }).join('\n\n---\n\n');
    }

    // Save conversation
    async function captureCurrentConversation() {
        const btn = document.getElementById('vibelab-save-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Saving...';

        try {
            const messages = extractConversation();

            if (messages.length === 0) {
                showNotification('No conversation found', 'error');
                return;
            }

            const title = getConversationTitle();
            const content = formatConversation(messages);

            const response = await chrome.runtime.sendMessage({
                type: 'SAVE_MEMORY',
                data: {
                    title: `Claude: ${title}`,
                    content,
                    source: 'claude',
                    sourceUrl: window.location.href
                }
            });

            if (response.success) {
                showNotification(`Saved! "${title}" (${messages.length} messages)`, 'success');
            } else {
                showNotification('Failed: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('[VibeLab] Error:', error);
            showNotification('Error saving', 'error');
        } finally {
            btn.innerHTML = originalText;
        }
    }

    // Show notification
    function showNotification(message, type) {
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
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Initialize
    setTimeout(() => createFloatingButton(), 1500);

    // Watch for new messages
    setInterval(() => {
        const messages = extractConversation();
        if (messages.length > lastMessageCount && lastMessageCount > 0) {
            chrome.runtime.sendMessage({ type: 'CONVERSATION_DETECTED' });
        }
        lastMessageCount = messages.length;
    }, 2000);
})();
