// ============================================================
// Velma AI — Chat Logic & API Integration
// ============================================================

(function () {
    "use strict";

    // ---- DOM Elements ----
    const apiKeyModal = document.getElementById("api-key-modal");
    const apiKeyInput = document.getElementById("api-key-input");
    const saveKeyBtn = document.getElementById("save-key-btn");
    const app = document.getElementById("app");
    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menu-toggle");
    const messagesContainer = document.getElementById("messages");
    const chatForm = document.getElementById("chat-form");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const typingIndicator = document.getElementById("typing-indicator");
    const clearChatBtn = document.getElementById("clear-chat-btn");
    const exportChatBtn = document.getElementById("export-chat-btn");
    const changeKeyBtn = document.getElementById("change-key-btn");
    const aboutText = document.getElementById("about-text");
    const projectsList = document.getElementById("projects-list");
    const quickPromptsEl = document.getElementById("quick-prompts");
    const themeToggle = document.getElementById("theme-toggle");
    const themeIconMoon = document.getElementById("theme-icon-moon");
    const themeIconSun = document.getElementById("theme-icon-sun");
    const soundToggle = document.getElementById("sound-toggle");
    const scrollBottomBtn = document.getElementById("scroll-bottom-btn");
    const charCounter = document.getElementById("char-counter");
    const shortcutsBtn = document.getElementById("shortcuts-btn");
    const shortcutsOverlay = document.getElementById("shortcuts-overlay");
    const closeShortcutsBtn = document.getElementById("close-shortcuts-btn");

    // ---- State ----
    let apiKey = localStorage.getItem("velma_api_key") || "";
    let conversationHistory = [];
    let isStreaming = false;
    let soundEnabled = localStorage.getItem("velma_sound") !== "false";
    let theme = localStorage.getItem("velma_theme") || "dark";
    let audioCtx = null;

    // ---- Initialize ----
    function init() {
        applyTheme();
        restoreConversation();
        populateSidebar();
        loadProjectsFile();

        if (apiKey) {
            showApp();
        } else {
            showModal();
        }

        bindEvents();
        setupScrollObserver();
        updateCharCounter();
        updateSoundIcon();
    }

    // ============================================================
    // Feature #1: Load projects.txt
    // ============================================================

    async function loadProjectsFile() {
        try {
            const response = await fetch("projects.txt");
            if (!response.ok) return;
            const text = await response.text();
            const projects = parseProjectsTxt(text);
            if (projects.length === 0) return;

            PROFILE.projects = projects;

            const projectLines = projects.map((p) => {
                const details = p.details || p.description || "";
                return `- **${p.name}**: ${details}`;
            });
            const projectsSection = "## Projects\n" + projectLines.join("\n");

            PROFILE.systemPrompt = PROFILE.systemPrompt.replace(
                /## Projects[\s\S]*?(?=\n## |$)/,
                projectsSection + "\n"
            );

            populateSidebar();
        } catch (e) {
            // Fall back to profile.js defaults
        }
    }

    function parseProjectsTxt(text) {
        const projects = [];
        let current = null;

        for (const rawLine of text.split("\n")) {
            const line = rawLine.trim();
            if (line.startsWith("#")) continue;
            if (line === "") {
                if (current) {
                    projects.push(current);
                    current = null;
                }
                continue;
            }
            const match = line.match(/^(name|url|description|details):\s*(.+)$/i);
            if (match) {
                const key = match[1].toLowerCase();
                const value = match[2].trim();
                if (key === "name") {
                    current = { name: value };
                } else if (current) {
                    current[key] = value;
                }
            }
        }
        if (current) projects.push(current);
        return projects;
    }

    // ============================================================
    // Feature #1: Theme Toggle
    // ============================================================

    function applyTheme() {
        if (theme === "light") {
            document.body.classList.add("light-theme");
            themeIconMoon.classList.add("hidden");
            themeIconSun.classList.remove("hidden");
        } else {
            document.body.classList.remove("light-theme");
            themeIconMoon.classList.remove("hidden");
            themeIconSun.classList.add("hidden");
        }
    }

    function toggleTheme() {
        theme = theme === "dark" ? "light" : "dark";
        localStorage.setItem("velma_theme", theme);
        applyTheme();
    }

    // ============================================================
    // Feature #15: Notification Sound
    // ============================================================

    function playSound() {
        if (!soundEnabled) return;
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.15);
        } catch (e) {
            // Audio not supported
        }
    }

    function updateSoundIcon() {
        soundToggle.style.opacity = soundEnabled ? "1" : "0.4";
    }

    // ============================================================
    // Feature #6: Conversation Persistence
    // ============================================================

    function saveConversation() {
        localStorage.setItem("velma_history", JSON.stringify(conversationHistory));
    }

    function restoreConversation() {
        try {
            const saved = localStorage.getItem("velma_history");
            if (saved) {
                conversationHistory = JSON.parse(saved);
            }
        } catch (e) {
            conversationHistory = [];
        }
    }

    function renderSavedMessages() {
        messagesContainer.innerHTML = "";
        for (const msg of conversationHistory) {
            const role = msg.role === "user" ? "user" : "bot";
            appendMessage(role, msg.content, false, false);
        }
        scrollToBottom();
    }

    // ---- Sidebar Population ----
    function populateSidebar() {
        if (PROFILE.aboutText) {
            aboutText.textContent = PROFILE.aboutText;
        }

        projectsList.innerHTML = "";
        for (const project of PROFILE.projects) {
            const li = document.createElement("li");
            if (project.url) {
                const a = document.createElement("a");
                a.href = project.url;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.textContent = project.name;
                li.appendChild(a);
            } else {
                const span = document.createElement("span");
                span.style.color = "var(--accent)";
                span.style.fontSize = "0.85rem";
                span.textContent = project.name;
                li.appendChild(span);
            }
            if (project.description) {
                const desc = document.createElement("span");
                desc.className = "project-desc";
                desc.textContent = project.description;
                li.appendChild(desc);
            }
            projectsList.appendChild(li);
        }

        quickPromptsEl.innerHTML = "";
        for (const prompt of PROFILE.quickPrompts) {
            const btn = document.createElement("button");
            btn.className = "quick-prompt-btn";
            btn.textContent = prompt;
            btn.addEventListener("click", () => {
                userInput.value = prompt;
                handleSend();
            });
            quickPromptsEl.appendChild(btn);
        }

        const avatar = document.querySelector(".avatar");
        if (avatar && PROFILE.avatarLetter) {
            avatar.textContent = PROFILE.avatarLetter;
        }

        const tagline = document.querySelector(".tagline");
        if (tagline && PROFILE.tagline) {
            tagline.textContent = PROFILE.tagline;
        }
    }

    // ---- Modal ----
    function showModal() {
        apiKeyModal.classList.remove("hidden");
        app.classList.add("hidden");
        apiKeyInput.focus();
    }

    function showApp() {
        apiKeyModal.classList.add("hidden");
        app.classList.remove("hidden");

        if (conversationHistory.length > 0) {
            renderSavedMessages();
        } else {
            showWelcomeMessage();
        }
    }

    // ============================================================
    // Feature #14: Enhanced Welcome Screen
    // ============================================================

    function showWelcomeMessage() {
        messagesContainer.innerHTML = "";
        const welcome = document.createElement("div");
        welcome.className = "welcome-message";
        welcome.innerHTML = `
            <div class="welcome-avatar">
                <div class="welcome-avatar-circle">${escapeHtml(PROFILE.avatarLetter)}</div>
            </div>
            <h2>Welcome!</h2>
            <p>${escapeHtml(PROFILE.welcomeMessage)}</p>
            <div class="welcome-tips">
                <div class="welcome-tip">Type a message to start chatting</div>
                <div class="welcome-tip">Try the quick prompts in the sidebar</div>
                <div class="welcome-tip">Type <kbd>/help</kbd> for slash commands</div>
            </div>
        `;
        messagesContainer.appendChild(welcome);
    }

    // ---- Events ----
    function bindEvents() {
        // Save API key
        saveKeyBtn.addEventListener("click", () => {
            const key = apiKeyInput.value.trim();
            if (!key) return;
            apiKey = key;
            localStorage.setItem("velma_api_key", key);
            showApp();
        });

        apiKeyInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") saveKeyBtn.click();
        });

        // Send message
        chatForm.addEventListener("submit", (e) => {
            e.preventDefault();
            handleSend();
        });

        // Auto-resize textarea + char counter
        userInput.addEventListener("input", () => {
            userInput.style.height = "auto";
            userInput.style.height = Math.min(userInput.scrollHeight, 150) + "px";
            updateCharCounter();
        });

        // Enter to send (Shift+Enter for newline)
        userInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });

        // Clear chat
        clearChatBtn.addEventListener("click", () => {
            conversationHistory = [];
            localStorage.removeItem("velma_history");
            showWelcomeMessage();
            closeSidebar();
        });

        // Export chat (Feature #4)
        exportChatBtn.addEventListener("click", () => {
            exportChat();
            closeSidebar();
        });

        // Change API key
        changeKeyBtn.addEventListener("click", () => {
            apiKey = "";
            localStorage.removeItem("velma_api_key");
            apiKeyInput.value = "";
            showModal();
            closeSidebar();
        });

        // Mobile menu toggle
        menuToggle.addEventListener("click", toggleSidebar);

        // Theme toggle (Feature #1)
        themeToggle.addEventListener("click", toggleTheme);

        // Sound toggle (Feature #15)
        soundToggle.addEventListener("click", () => {
            soundEnabled = !soundEnabled;
            localStorage.setItem("velma_sound", soundEnabled);
            updateSoundIcon();
        });

        // Scroll to bottom (Feature #7)
        scrollBottomBtn.addEventListener("click", () => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });

        // Keyboard shortcuts overlay (Feature #8)
        shortcutsBtn.addEventListener("click", () => {
            shortcutsOverlay.classList.remove("hidden");
        });

        closeShortcutsBtn.addEventListener("click", () => {
            shortcutsOverlay.classList.add("hidden");
        });

        shortcutsOverlay.addEventListener("click", (e) => {
            if (e.target === shortcutsOverlay) {
                shortcutsOverlay.classList.add("hidden");
            }
        });

        // ============================================================
        // Feature #8: Keyboard Shortcuts
        // ============================================================
        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "l") {
                e.preventDefault();
                conversationHistory = [];
                localStorage.removeItem("velma_history");
                showWelcomeMessage();
            }
            if (e.ctrlKey && e.key === "e") {
                e.preventDefault();
                exportChat();
            }
            if (e.ctrlKey && e.key === "d") {
                e.preventDefault();
                toggleTheme();
            }
            if (e.key === "Escape") {
                shortcutsOverlay.classList.add("hidden");
                closeSidebar();
            }
        });
    }

    // ============================================================
    // Feature #7: Scroll-to-Bottom Observer
    // ============================================================

    function setupScrollObserver() {
        messagesContainer.addEventListener("scroll", () => {
            const distFromBottom =
                messagesContainer.scrollHeight -
                messagesContainer.scrollTop -
                messagesContainer.clientHeight;
            if (distFromBottom > 200) {
                scrollBottomBtn.classList.remove("hidden");
            } else {
                scrollBottomBtn.classList.add("hidden");
            }
        });
    }

    // ============================================================
    // Feature #11: Character Counter
    // ============================================================

    function updateCharCounter() {
        const len = userInput.value.length;
        if (len > 0) {
            charCounter.textContent = len.toLocaleString();
            charCounter.style.opacity = "1";
        } else {
            charCounter.style.opacity = "0";
        }
    }

    // ---- Sidebar Toggle (Mobile) ----
    function toggleSidebar() {
        const isOpen = sidebar.classList.contains("open");
        if (isOpen) {
            closeSidebar();
        } else {
            sidebar.classList.add("open");
            const overlay = document.createElement("div");
            overlay.className = "sidebar-overlay";
            overlay.addEventListener("click", closeSidebar);
            document.body.appendChild(overlay);
        }
    }

    function closeSidebar() {
        sidebar.classList.remove("open");
        const overlay = document.querySelector(".sidebar-overlay");
        if (overlay) overlay.remove();
    }

    // ============================================================
    // Feature #12: Slash Commands
    // ============================================================

    function handleSlashCommand(text) {
        const cmd = text.toLowerCase().trim();
        if (cmd === "/clear") {
            conversationHistory = [];
            localStorage.removeItem("velma_history");
            showWelcomeMessage();
            return true;
        }
        if (cmd === "/export") {
            exportChat();
            return true;
        }
        if (cmd === "/theme") {
            toggleTheme();
            return true;
        }
        if (cmd === "/help") {
            shortcutsOverlay.classList.remove("hidden");
            return true;
        }
        return false;
    }

    // ============================================================
    // Feature #4: Export Chat as Markdown
    // ============================================================

    function exportChat() {
        if (conversationHistory.length === 0) return;
        let md = `# Velma AI Chat Export\n_Exported ${new Date().toLocaleString()}_\n\n---\n\n`;
        for (const msg of conversationHistory) {
            const role = msg.role === "user" ? "You" : "Velma";
            md += `**${role}:**\n${msg.content}\n\n`;
        }
        const blob = new Blob([md], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `velma-chat-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ---- Send Message ----
    async function handleSend() {
        const text = userInput.value.trim();
        if (!text || isStreaming) return;

        // Handle slash commands (Feature #12)
        if (text.startsWith("/") && handleSlashCommand(text)) {
            userInput.value = "";
            userInput.style.height = "auto";
            updateCharCounter();
            return;
        }

        // Remove welcome message
        const welcome = messagesContainer.querySelector(".welcome-message");
        if (welcome) welcome.remove();

        // Add user message
        appendMessage("user", text);
        conversationHistory.push({ role: "user", content: text });
        saveConversation();

        // Clear input
        userInput.value = "";
        userInput.style.height = "auto";
        updateCharCounter();

        // Call Claude API
        await callClaude();
    }

    // ============================================================
    // Feature #2: Streaming Responses
    // ============================================================

    async function callClaude() {
        isStreaming = true;
        sendBtn.disabled = true;
        typingIndicator.classList.remove("hidden");
        scrollToBottom();

        // Create bot message container for streaming
        const msg = document.createElement("div");
        msg.className = "message bot";

        const avatarEl = document.createElement("div");
        avatarEl.className = "message-avatar";
        avatarEl.textContent = PROFILE.avatarLetter;

        const bubbleWrapper = document.createElement("div");
        bubbleWrapper.className = "bubble-wrapper";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        bubble.innerHTML = '<span class="streaming-cursor"></span>';

        bubbleWrapper.appendChild(bubble);
        msg.appendChild(avatarEl);
        msg.appendChild(bubbleWrapper);

        try {
            const response = await fetch(
                "https://api.anthropic.com/v1/messages",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": apiKey,
                        "anthropic-version": "2023-06-01",
                        "anthropic-dangerous-direct-browser-access": "true",
                    },
                    body: JSON.stringify({
                        model: PROFILE.model,
                        max_tokens: 1024,
                        system: PROFILE.systemPrompt,
                        messages: conversationHistory,
                        stream: true,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                let errorMsg = `API Error (${response.status})`;

                if (response.status === 401) {
                    errorMsg =
                        "Invalid API key. Please check your key and try again.";
                } else if (response.status === 429) {
                    errorMsg =
                        "Rate limited. Please wait a moment and try again.";
                } else if (errorData?.error?.message) {
                    errorMsg = errorData.error.message;
                }

                throw new Error(errorMsg);
            }

            // Hide typing indicator, show streaming bubble
            typingIndicator.classList.add("hidden");
            messagesContainer.appendChild(msg);
            scrollToBottom();

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = "";
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const jsonStr = line.slice(6);
                        try {
                            const data = JSON.parse(jsonStr);
                            if (
                                data.type === "content_block_delta" &&
                                data.delta?.text
                            ) {
                                assistantMessage += data.delta.text;
                                bubble.innerHTML =
                                    renderMarkdown(assistantMessage) +
                                    '<span class="streaming-cursor"></span>';
                                scrollToBottom();
                            }
                        } catch (e) {
                            // Skip malformed JSON chunks
                        }
                    }
                }
            }

            // Finalize the message
            bubble.innerHTML = renderMarkdown(assistantMessage);
            addCodeCopyButtons(bubble);

            // Add timestamp (Feature #5)
            const time = document.createElement("span");
            time.className = "message-time";
            time.textContent = formatTime(new Date());
            bubbleWrapper.appendChild(time);

            // Add message actions (Feature #10)
            addMessageActions(bubbleWrapper, assistantMessage);

            conversationHistory.push({
                role: "assistant",
                content: assistantMessage,
            });
            saveConversation();
            playSound();
        } catch (err) {
            typingIndicator.classList.add("hidden");
            // Remove the streaming bubble if it was added
            if (msg.parentNode) msg.remove();
            appendMessage("bot", err.message, true);
            // Remove the failed exchange from history
            if (
                conversationHistory.length > 0 &&
                conversationHistory[conversationHistory.length - 1].role ===
                    "user"
            ) {
                conversationHistory.pop();
                saveConversation();
            }
        } finally {
            isStreaming = false;
            sendBtn.disabled = false;
            typingIndicator.classList.add("hidden");
            scrollToBottom();
        }
    }

    // ---- Render Messages ----
    function appendMessage(role, text, isError = false, withTimestamp = true) {
        const msg = document.createElement("div");
        msg.className = `message ${role}`;

        const avatarEl = document.createElement("div");
        avatarEl.className = "message-avatar";
        avatarEl.textContent = role === "user" ? "You" : PROFILE.avatarLetter;

        const bubbleWrapper = document.createElement("div");
        bubbleWrapper.className = "bubble-wrapper";

        const bubble = document.createElement("div");
        bubble.className = `message-bubble${isError ? " error-bubble" : ""}`;

        if (role === "bot" && !isError) {
            bubble.innerHTML = renderMarkdown(text);
            addCodeCopyButtons(bubble);
        } else {
            bubble.textContent = text;
        }

        bubbleWrapper.appendChild(bubble);

        // Feature #5: Timestamps
        if (withTimestamp) {
            const time = document.createElement("span");
            time.className = "message-time";
            time.textContent = formatTime(new Date());
            bubbleWrapper.appendChild(time);
        }

        // Feature #10: Message copy action
        if (role === "bot" && !isError) {
            addMessageActions(bubbleWrapper, text);
        }

        msg.appendChild(avatarEl);
        msg.appendChild(bubbleWrapper);
        messagesContainer.appendChild(msg);
        scrollToBottom();
    }

    // ============================================================
    // Feature #5: Timestamp Formatting
    // ============================================================

    function formatTime(date) {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    // ============================================================
    // Feature #10: Message Copy Action
    // ============================================================

    function addMessageActions(wrapper, text) {
        const actions = document.createElement("div");
        actions.className = "message-actions";

        const copyBtn = document.createElement("button");
        copyBtn.className = "msg-action-btn";
        copyBtn.title = "Copy message";
        copyBtn.innerHTML =
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy';

        copyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(text).then(() => {
                copyBtn.innerHTML =
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML =
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy';
                }, 1500);
            });
        });

        actions.appendChild(copyBtn);
        wrapper.appendChild(actions);
    }

    // ============================================================
    // Feature #3: Code Block Copy Button
    // ============================================================

    function addCodeCopyButtons(bubble) {
        const codeBlocks = bubble.querySelectorAll("pre");
        for (const pre of codeBlocks) {
            if (pre.parentElement.classList.contains("code-block-wrapper"))
                continue;
            const wrapper = document.createElement("div");
            wrapper.className = "code-block-wrapper";
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            const btn = document.createElement("button");
            btn.className = "code-copy-btn";
            btn.textContent = "Copy";
            btn.addEventListener("click", () => {
                const code = pre.textContent;
                navigator.clipboard.writeText(code).then(() => {
                    btn.textContent = "Copied!";
                    setTimeout(() => {
                        btn.textContent = "Copy";
                    }, 1500);
                });
            });
            wrapper.appendChild(btn);
        }
    }

    function scrollToBottom() {
        requestAnimationFrame(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
    }

    // ---- Simple Markdown Renderer ----
    function renderMarkdown(text) {
        let html = escapeHtml(text);

        // Code blocks (```...```)
        html = html.replace(
            /```(\w*)\n([\s\S]*?)```/g,
            '<pre><code class="language-$1">$2</code></pre>'
        );

        // Inline code (`...`)
        html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

        // Bold (**...**)
        html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

        // Italic (*...*)
        html = html.replace(
            /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g,
            "<em>$1</em>"
        );

        // Headers
        html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
        html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
        html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

        // Unordered lists
        html = html.replace(/^[-*] (.+)$/gm, "<li>$1</li>");
        html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

        // Links [text](url)
        html = html.replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
        );

        // Line breaks (double newline = paragraph)
        html = html
            .split(/\n\n+/)
            .map((p) => {
                p = p.trim();
                if (
                    !p ||
                    p.startsWith("<h") ||
                    p.startsWith("<ul") ||
                    p.startsWith("<pre")
                )
                    return p;
                return `<p>${p}</p>`;
            })
            .join("");

        // Single newlines within paragraphs
        html = html.replace(
            /(?<!<\/li>|<\/h[123]>|<\/ul>|<\/pre>|<\/p>)\n(?!<)/g,
            "<br>"
        );

        return html;
    }

    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    // ---- Start ----
    init();
})();
