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
    const changeKeyBtn = document.getElementById("change-key-btn");
    const aboutText = document.getElementById("about-text");
    const projectsList = document.getElementById("projects-list");
    const quickPromptsEl = document.getElementById("quick-prompts");

    // ---- State ----
    let apiKey = localStorage.getItem("velma_api_key") || "";
    let conversationHistory = [];
    let isStreaming = false;

    // ---- Initialize ----
    function init() {
        populateSidebar();
        loadProjectsFile();

        if (apiKey) {
            showApp();
        } else {
            showModal();
        }

        bindEvents();
    }

    // ---- Load projects.txt ----
    async function loadProjectsFile() {
        try {
            const response = await fetch("projects.txt");
            if (!response.ok) return;
            const text = await response.text();
            const projects = parseProjectsTxt(text);
            if (projects.length === 0) return;

            // Update PROFILE with loaded projects
            PROFILE.projects = projects;

            // Rebuild the projects section of the system prompt
            const projectLines = projects.map((p) => {
                const details = p.details || p.description || "";
                return `- **${p.name}**: ${details}`;
            });
            const projectsSection =
                "## Projects\n" + projectLines.join("\n");

            // Replace the existing ## Projects section in the system prompt
            PROFILE.systemPrompt = PROFILE.systemPrompt.replace(
                /## Projects[\s\S]*?(?=\n## |$)/,
                projectsSection + "\n"
            );

            // Re-render sidebar with new projects
            populateSidebar();
        } catch (e) {
            // If projects.txt can't be loaded, fall back to profile.js defaults
        }
    }

    function parseProjectsTxt(text) {
        const projects = [];
        let current = null;

        for (const rawLine of text.split("\n")) {
            const line = rawLine.trim();

            // Skip comments and empty lines
            if (line.startsWith("#")) continue;
            if (line === "") {
                if (current) {
                    projects.push(current);
                    current = null;
                }
                continue;
            }

            // Parse key: value pairs
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

        // Don't forget the last project if file doesn't end with blank line
        if (current) projects.push(current);

        return projects;
    }

    // ---- Sidebar Population ----
    function populateSidebar() {
        // About text
        if (PROFILE.aboutText) {
            aboutText.textContent = PROFILE.aboutText;
        }

        // Projects
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

        // Quick prompts
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

        // Avatar
        const avatar = document.querySelector(".avatar");
        if (avatar && PROFILE.avatarLetter) {
            avatar.textContent = PROFILE.avatarLetter;
        }

        // Tagline
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

        // Show welcome message if no history
        if (conversationHistory.length === 0) {
            showWelcomeMessage();
        }
    }

    function showWelcomeMessage() {
        messagesContainer.innerHTML = "";
        const welcome = document.createElement("div");
        welcome.className = "welcome-message";
        welcome.innerHTML = `
            <h2>Welcome!</h2>
            <p>${escapeHtml(PROFILE.welcomeMessage)}</p>
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

        // Auto-resize textarea
        userInput.addEventListener("input", () => {
            userInput.style.height = "auto";
            userInput.style.height =
                Math.min(userInput.scrollHeight, 150) + "px";
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
            showWelcomeMessage();
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

    // ---- Send Message ----
    async function handleSend() {
        const text = userInput.value.trim();
        if (!text || isStreaming) return;

        // Remove welcome message
        const welcome = messagesContainer.querySelector(".welcome-message");
        if (welcome) welcome.remove();

        // Add user message
        appendMessage("user", text);
        conversationHistory.push({ role: "user", content: text });

        // Clear input
        userInput.value = "";
        userInput.style.height = "auto";

        // Call Claude API
        await callClaude();
    }

    // ---- Call Claude API ----
    async function callClaude() {
        isStreaming = true;
        sendBtn.disabled = true;
        typingIndicator.classList.remove("hidden");
        scrollToBottom();

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
                } else if (response.status === 400 && errorData?.error?.message) {
                    errorMsg = errorData.error.message;
                } else if (errorData?.error?.message) {
                    errorMsg = errorData.error.message;
                }

                throw new Error(errorMsg);
            }

            const data = await response.json();
            const assistantMessage =
                data.content?.[0]?.text || "I didn't get a response. Try again?";

            conversationHistory.push({
                role: "assistant",
                content: assistantMessage,
            });
            appendMessage("bot", assistantMessage);
        } catch (err) {
            appendMessage("bot", err.message, true);
            // Remove the failed exchange from history so it doesn't pollute context
            if (
                conversationHistory.length > 0 &&
                conversationHistory[conversationHistory.length - 1].role === "user"
            ) {
                conversationHistory.pop();
            }
        } finally {
            isStreaming = false;
            sendBtn.disabled = false;
            typingIndicator.classList.add("hidden");
            scrollToBottom();
        }
    }

    // ---- Render Messages ----
    function appendMessage(role, text, isError = false) {
        const msg = document.createElement("div");
        msg.className = `message ${role}`;

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent = role === "user" ? "You" : PROFILE.avatarLetter;

        const bubble = document.createElement("div");
        bubble.className = `message-bubble${isError ? " error-bubble" : ""}`;

        if (role === "bot" && !isError) {
            bubble.innerHTML = renderMarkdown(text);
        } else {
            bubble.textContent = text;
        }

        msg.appendChild(avatar);
        msg.appendChild(bubble);
        messagesContainer.appendChild(msg);
        scrollToBottom();
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
        html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");

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
