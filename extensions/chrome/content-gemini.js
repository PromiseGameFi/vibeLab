// VibeLab Memory - Gemini Content Script
// Captures conversations from gemini.google.com

(function () {
    'use strict';

    console.log('[VibeLab] Gemini content script loaded');

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

    // Extract conversation from Gemini
    function extractConversation() {
        const messages = [];

        // Gemini uses specific message containers
        // Look for user prompts and model responses
        const turns = document.querySelectorAll('[class*="conversation-turn"], [class*="message-row"]');

        if (turns.length === 0) {
            // Fallback: Look for query and response pairs
            const queries = document.querySelectorAll('[class*="query-content"], [class*="user-query"]');
            const responses = document.querySelectorAll('[class*="response-content"], [class*="model-response"]');

            queries.forEach((q, i) => {
                const userText = q.innerText.trim();
                if (userText) {
                    messages.push({ role: 'user', content: userText });
                }

                if (responses[i]) {
                    const assistantText = responses[i].innerText.trim();
                    if (assistantText) {
                        messages.push({ role: 'assistant', content: assistantText });
                    }
                }
            });
        } else {
            turns.forEach(turn => {
                const isUser = turn.className.includes('user') || turn.querySelector('[class*="user"]');
                const textEl = turn.querySelector('[class*="content"], .markdown-body, p');
                const text = textEl ? textEl.innerText.trim() : turn.innerText.trim();

                if (text && text.length > 5) {
                    messages.push({
                        role: isUser ? 'user' : 'assistant',
                        content: text
                    });
                }
            });
        }

        return messages;
    }

    // Get conversation title
    function getConversationTitle() {
        const titleEl = document.querySelector('h1, [class*="title"]');
        if (titleEl && titleEl.innerText.trim()) {
            return titleEl.innerText.trim().slice(0, 60);
        }

        const messages = extractConversation();
        const firstUserMsg = messages.find(m => m.role === 'user');
        if (firstUserMsg) {
            return firstUserMsg.content.slice(0, 50) + '...';
        }

        return 'Gemini Conversation';
    }

    // Format conversation
    function formatConversation(messages) {
        return messages.map(m => {
            const prefix = m.role === 'user' ? '**User:**' : '**Gemini:**';
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
                    title: `Gemini: ${title}`,
                    content,
                    source: 'gemini',
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
