// VibeLab Memory - Microsoft Copilot Content Script
// Captures conversations from copilot.microsoft.com

(function () {
    'use strict';

    console.log('[VibeLab] Copilot content script loaded');

    let lastMessageCount = 0;

    // Create floating save button
    function createFloatingButton() {
        if (document.getElementById('vibelab-save-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'vibelab-save-btn';
        btn.innerHTML = '🧠 Save';
        btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
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
    `;

        btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.05)');
        btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
        btn.addEventListener('click', captureConversation);

        document.body.appendChild(btn);
    }

    // Extract conversation from Copilot
    function extractConversation() {
        const messages = [];

        // Look for user and assistant messages
        const userMessages = document.querySelectorAll('[data-content="user"], [class*="user-message"], .user-request');
        const assistantMessages = document.querySelectorAll('[data-content="bot"], [class*="bot-message"], .response-content');

        // Strategy 1: Paired messages
        const maxLen = Math.max(userMessages.length, assistantMessages.length);
        for (let i = 0; i < maxLen; i++) {
            if (userMessages[i]) {
                const text = userMessages[i].innerText.trim();
                if (text) messages.push({ role: 'user', content: text });
            }
            if (assistantMessages[i]) {
                const text = assistantMessages[i].innerText.trim();
                if (text) messages.push({ role: 'assistant', content: text });
            }
        }

        if (messages.length > 0) return messages;

        // Strategy 2: Generic message containers
        const allMessages = document.querySelectorAll('[class*="message"], [class*="turn"]');
        allMessages.forEach((el, index) => {
            const text = el.innerText.trim();
            if (text && text.length > 10) {
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
        const messages = extractConversation();
        const firstUser = messages.find(m => m.role === 'user');
        return firstUser ? firstUser.content.slice(0, 50) + '...' : 'Copilot Conversation';
    }

    // Format conversation
    function formatConversation(messages) {
        return messages.map(m => {
            const prefix = m.role === 'user' ? '**User:**' : '**Copilot:**';
            return `${prefix}\n${m.content}`;
        }).join('\n\n---\n\n');
    }

    // Save conversation
    async function captureConversation() {
        const btn = document.getElementById('vibelab-save-btn');
        btn.textContent = '⏳ Saving...';

        try {
            const messages = extractConversation();

            if (messages.length === 0) {
                showNotification('No content found', 'error');
                return;
            }

            const title = getConversationTitle();
            const content = formatConversation(messages);

            const response = await chrome.runtime.sendMessage({
                type: 'SAVE_MEMORY',
                data: {
                    title: `Copilot: ${title}`,
                    content,
                    source: 'other',
                    sourceUrl: window.location.href
                }
            });

            if (response.success) {
                showNotification(`Saved! "${title}"`, 'success');
            } else {
                showNotification('Failed: ' + response.error, 'error');
            }
        } catch (error) {
            showNotification('Error saving', 'error');
        } finally {
            btn.textContent = '🧠 Save';
        }
    }

    // Show notification
    function showNotification(message, type) {
        const toast = document.createElement('div');
        toast.textContent = message;
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
    `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Listen for messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SAVE_CONVERSATION') {
            captureConversation();
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

    // Initialize
    setTimeout(createFloatingButton, 1500);

    // Watch for changes
    setInterval(() => {
        const messages = extractConversation();
        if (messages.length > lastMessageCount && lastMessageCount > 0) {
            chrome.runtime.sendMessage({ type: 'CONVERSATION_DETECTED' });
        }
        lastMessageCount = messages.length;
    }, 3000);
})();
