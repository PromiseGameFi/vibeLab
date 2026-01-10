// VibeLab Memory - Perplexity Content Script
// Captures conversations from perplexity.ai

(function () {
    'use strict';

    console.log('[VibeLab] Perplexity content script loaded');

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

    // Extract conversation from Perplexity
    function extractConversation() {
        const messages = [];

        // Look for query and answer blocks
        const queries = document.querySelectorAll('[class*="Query"], [class*="question"], .prose-query');
        const answers = document.querySelectorAll('[class*="Answer"], [class*="answer"], .prose');

        // Strategy 1: Paired queries and answers
        if (queries.length > 0) {
            queries.forEach((query, i) => {
                const queryText = query.innerText.trim();
                if (queryText) {
                    messages.push({ role: 'user', content: queryText });
                }

                if (answers[i]) {
                    const answerText = answers[i].innerText.trim();
                    if (answerText) {
                        messages.push({ role: 'assistant', content: answerText });
                    }
                }
            });
            return messages;
        }

        // Strategy 2: Look for alternating blocks
        const turns = document.querySelectorAll('[class*="border-b"], article, section > div');
        turns.forEach((turn, index) => {
            const text = turn.innerText.trim();
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
        const title = document.title.replace(' - Perplexity', '').trim();
        if (title && title.length > 5) return title;

        const messages = extractConversation();
        const firstUser = messages.find(m => m.role === 'user');
        return firstUser ? firstUser.content.slice(0, 50) + '...' : 'Perplexity Search';
    }

    // Format conversation
    function formatConversation(messages) {
        return messages.map(m => {
            const prefix = m.role === 'user' ? '**Query:**' : '**Perplexity:**';
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
                    title: `Perplexity: ${title}`,
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
