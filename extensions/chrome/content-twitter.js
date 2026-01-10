// VibeLab Memory - Twitter/X Content Script
// Captures tweets and threads from twitter.com and x.com

(function () {
    'use strict';

    console.log('[VibeLab] Twitter/X content script loaded');

    // Create floating save button
    function createFloatingButton() {
        if (document.getElementById('vibelab-save-btn')) return;

        const container = document.createElement('div');
        container.id = 'vibelab-container';
        container.innerHTML = `
      <button id="vibelab-save-btn" class="vibelab-btn">
        🧠 Save
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
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      .vibelab-toast.success { background: #22c55e; color: white; }
      .vibelab-toast.error { background: #ef4444; color: white; }
      .vibelab-save-tweet {
        position: absolute;
        bottom: 5px;
        right: 5px;
        background: rgba(168, 85, 247, 0.9);
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
      }
      article:hover .vibelab-save-tweet {
        opacity: 1;
      }
    `;
        document.head.appendChild(style);

        document.getElementById('vibelab-save-btn').addEventListener('click', saveCurrentThread);
    }

    // Extract single tweet
    function extractTweet(tweetElement) {
        const tweet = {
            text: '',
            author: '',
            handle: '',
            time: '',
            images: [],
            likes: '',
            retweets: ''
        };

        // Get tweet text
        const textEl = tweetElement.querySelector('[data-testid="tweetText"]');
        if (textEl) {
            tweet.text = textEl.innerText.trim();
        }

        // Get author info
        const userEl = tweetElement.querySelector('[data-testid="User-Name"]');
        if (userEl) {
            const parts = userEl.innerText.split('\n');
            tweet.author = parts[0] || '';
            tweet.handle = parts[1] || '';
        }

        // Get images
        const images = tweetElement.querySelectorAll('[data-testid="tweetPhoto"] img');
        images.forEach(img => {
            if (img.src && !img.src.includes('emoji')) {
                tweet.images.push(img.src);
            }
        });

        // Get engagement
        const likeEl = tweetElement.querySelector('[data-testid="like"] span');
        const retweetEl = tweetElement.querySelector('[data-testid="retweet"] span');
        tweet.likes = likeEl?.innerText || '0';
        tweet.retweets = retweetEl?.innerText || '0';

        return tweet;
    }

    // Extract thread from page
    function extractThread() {
        const tweets = [];
        const tweetElements = document.querySelectorAll('article[data-testid="tweet"]');

        tweetElements.forEach(el => {
            const tweet = extractTweet(el);
            if (tweet.text) {
                tweets.push(tweet);
            }
        });

        return tweets;
    }

    // Get thread title
    function getThreadTitle(tweets) {
        if (tweets.length === 0) return 'Twitter Thread';

        const firstTweet = tweets[0];
        const titleText = firstTweet.text.slice(0, 50) + (firstTweet.text.length > 50 ? '...' : '');
        return `@${firstTweet.handle}: ${titleText}`;
    }

    // Format thread as markdown
    function formatThread(tweets) {
        return tweets.map((tweet, index) => {
            let content = `### ${index + 1}. ${tweet.author} (${tweet.handle})\n\n`;
            content += tweet.text + '\n\n';

            if (tweet.images.length > 0) {
                content += `📷 ${tweet.images.length} image(s)\n`;
            }

            content += `❤️ ${tweet.likes} · 🔁 ${tweet.retweets}`;

            return content;
        }).join('\n\n---\n\n');
    }

    // Collect all images from thread
    function collectImages(tweets) {
        const images = [];
        tweets.forEach(tweet => {
            tweet.images.forEach(img => images.push(img));
        });
        return images;
    }

    // Save current thread
    async function saveCurrentThread() {
        const btn = document.getElementById('vibelab-save-btn');
        btn.textContent = '⏳ Saving...';

        try {
            const tweets = extractThread();

            if (tweets.length === 0) {
                showNotification('No tweets found on this page', 'error');
                return;
            }

            const title = getThreadTitle(tweets);
            const content = formatThread(tweets);
            const images = collectImages(tweets);

            const response = await chrome.runtime.sendMessage({
                type: 'SAVE_MEMORY',
                data: {
                    title: `Twitter: ${title}`,
                    content,
                    source: 'other',
                    sourceUrl: window.location.href,
                    images: images
                }
            });

            if (response.success) {
                showNotification(`Saved! ${tweets.length} tweet(s)`, 'success');
            } else {
                showNotification('Failed: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('[VibeLab] Error:', error);
            showNotification('Error saving thread', 'error');
        } finally {
            btn.textContent = '🧠 Save';
        }
    }

    // Add save button to individual tweets
    function addTweetButtons() {
        const tweets = document.querySelectorAll('article[data-testid="tweet"]');
        tweets.forEach(tweet => {
            if (tweet.querySelector('.vibelab-save-tweet')) return;

            const btn = document.createElement('button');
            btn.className = 'vibelab-save-tweet';
            btn.textContent = '🧠';
            btn.title = 'Save to VibeLab Memory';
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();

                const tweetData = extractTweet(tweet);
                if (!tweetData.text) return;

                const response = await chrome.runtime.sendMessage({
                    type: 'SAVE_MEMORY',
                    data: {
                        title: `Tweet: @${tweetData.handle}`,
                        content: tweetData.text + (tweetData.images.length > 0 ? `\n\n📷 ${tweetData.images.length} image(s)` : ''),
                        source: 'other',
                        sourceUrl: window.location.href,
                        images: tweetData.images
                    }
                });

                if (response.success) {
                    btn.textContent = '✓';
                    setTimeout(() => btn.textContent = '🧠', 2000);
                }
            });

            tweet.style.position = 'relative';
            tweet.appendChild(btn);
        });
    }

    // Show notification
    function showNotification(message, type) {
        const existing = document.querySelector('.vibelab-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `vibelab-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Listen for messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SAVE_CONVERSATION') {
            saveCurrentThread();
            sendResponse({ success: true });
        }
        if (message.type === 'EXTRACT_PAGE') {
            const tweets = extractThread();
            sendResponse({
                title: getThreadTitle(tweets),
                content: formatThread(tweets)
            });
        }
        return true;
    });

    // Initialize
    setTimeout(() => {
        createFloatingButton();
        addTweetButtons();
    }, 2000);

    // Watch for new tweets
    const observer = new MutationObserver(() => {
        addTweetButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
