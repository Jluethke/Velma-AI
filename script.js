// ============================================================
// Velma AI — Complete Chat Logic & API Integration (45 Features)
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
    const settingsOverlay = document.getElementById("settings-overlay");
    const closeSettingsBtn = document.getElementById("close-settings-btn");
    const settingsBtn = document.getElementById("settings-btn");
    const accentColorInput = document.getElementById("accent-color-input");
    const fontDecrease = document.getElementById("font-decrease");
    const fontIncrease = document.getElementById("font-increase");
    const fontSizeLabel = document.getElementById("font-size-label");
    const maxTokensSlider = document.getElementById("max-tokens-slider");
    const maxTokensLabel = document.getElementById("max-tokens-label");
    const particlesToggle = document.getElementById("particles-toggle");
    const autoscrollToggle = document.getElementById("autoscroll-toggle");
    const soundToggleSetting = document.getElementById("sound-toggle-setting");
    const syspromptOverlay = document.getElementById("sysprompt-overlay");
    const closeSyspromptBtn = document.getElementById("close-sysprompt-btn");
    const syspromptBtn = document.getElementById("sysprompt-btn");
    const syspromptText = document.getElementById("sysprompt-text");
    const pinnedOverlay = document.getElementById("pinned-overlay");
    const closePinnedBtn = document.getElementById("close-pinned-btn");
    const pinnedBtn = document.getElementById("pinned-btn");
    const pinnedList = document.getElementById("pinned-list");
    const newChatBtn = document.getElementById("new-chat-btn");
    const conversationsList = document.getElementById("conversations-list");
    const contactsSection = document.getElementById("contacts-section");
    const contactsList = document.getElementById("contacts-list");
    const quickRepliesSection = document.getElementById("quick-replies-section");
    const quickReplies = document.getElementById("quick-replies");
    const statMessages = document.getElementById("stat-messages");
    const statTokens = document.getElementById("stat-tokens");
    const statDuration = document.getElementById("stat-duration");
    const sidebarResizeHandle = document.getElementById("sidebar-resize-handle");
    const particleCanvas = document.getElementById("particle-canvas");
    const scrollProgress = document.getElementById("scroll-progress");
    const conversationTitle = document.getElementById("conversation-title");
    const searchToggleBtn = document.getElementById("search-toggle-btn");
    const searchBar = document.getElementById("search-bar");
    const chatSearchInput = document.getElementById("chat-search-input");
    const searchResultCount = document.getElementById("search-result-count");
    const searchCloseBtn = document.getElementById("search-close-btn");
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    const followupEl = document.getElementById("followup-prompts");
    const imagePreview = document.getElementById("image-preview");
    const imagePreviewImg = document.getElementById("image-preview-img");
    const imageRemoveBtn = document.getElementById("image-remove-btn");
    const attachBtn = document.getElementById("attach-btn");
    const fileInput = document.getElementById("file-input");
    const micBtn = document.getElementById("mic-btn");

    // ---- State ----
    var apiKey = localStorage.getItem("velma_api_key") || "";
    var conversationHistory = [];
    var isStreaming = false;
    var soundEnabled = localStorage.getItem("velma_sound") !== "false";
    var theme = localStorage.getItem("velma_theme") || "dark";
    var audioCtx = null;
    var maxTokens = parseInt(localStorage.getItem("velma_max_tokens"), 10) || 1024;
    var autoScroll = localStorage.getItem("velma_autoscroll") !== "false";
    var particlesEnabled = localStorage.getItem("velma_particles") !== "false";
    var fontSize = localStorage.getItem("velma_fontsize") || "medium";
    var accentColor = localStorage.getItem("velma_accent") || "#7c5cfc";
    var pinnedIndices = [];
    try { pinnedIndices = JSON.parse(localStorage.getItem("velma_pinned")) || []; } catch (e) { pinnedIndices = []; }
    var conversations = [];
    try { conversations = JSON.parse(localStorage.getItem("velma_conversations")) || []; } catch (e) { conversations = []; }
    var activeConvId = localStorage.getItem("velma_active_conv") || null;
    var totalTokens = 0;
    var sessionStart = Date.now();
    var pendingImage = null;
    var isRecording = false;
    var recognition = null;
    var particleSystem = null;
    var hasHadFirstConversation = !!localStorage.getItem("velma_first_conv");
    var isFullscreen = false;

    // ---- Initialize ----
    function init() {
        applyTheme();
        applyAccentColor();
        applyFontSize();
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
        updateSettingsUI();
        initParticles();
        initVoiceInput();
        updateStats();
        registerServiceWorker();
    }

    // ============================================================
    // Load projects.txt
    // ============================================================

    async function loadProjectsFile() {
        try {
            var response = await fetch("projects.txt");
            if (!response.ok) return;
            var text = await response.text();
            var projects = parseProjectsTxt(text);
            if (projects.length === 0) return;

            PROFILE.projects = projects;

            var projectLines = projects.map(function (p) {
                var details = p.details || p.description || "";
                return "- **" + p.name + "**: " + details;
            });
            var projectsSection = "## Projects\n" + projectLines.join("\n");

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
        var projects = [];
        var current = null;

        var lines = text.split("\n");
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.startsWith("#")) continue;
            if (line === "") {
                if (current) {
                    projects.push(current);
                    current = null;
                }
                continue;
            }
            var match = line.match(/^(name|url|description|details):\s*(.+)$/i);
            if (match) {
                var key = match[1].toLowerCase();
                var value = match[2].trim();
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
    // Theme Toggle
    // ============================================================

    function applyTheme() {
        if (theme === "light") {
            document.body.classList.add("light-theme");
            if (themeIconMoon) themeIconMoon.classList.add("hidden");
            if (themeIconSun) themeIconSun.classList.remove("hidden");
        } else {
            document.body.classList.remove("light-theme");
            if (themeIconMoon) themeIconMoon.classList.remove("hidden");
            if (themeIconSun) themeIconSun.classList.add("hidden");
        }
    }

    function toggleTheme() {
        theme = theme === "dark" ? "light" : "dark";
        localStorage.setItem("velma_theme", theme);
        applyTheme();
    }

    // ============================================================
    // Accent Color
    // ============================================================

    function applyAccentColor() {
        document.documentElement.style.setProperty("--accent", accentColor);
        // Calculate hover variant (slightly lighter)
        var r = parseInt(accentColor.slice(1, 3), 16);
        var g = parseInt(accentColor.slice(3, 5), 16);
        var b = parseInt(accentColor.slice(5, 7), 16);
        var hoverR = Math.min(255, r + 30);
        var hoverG = Math.min(255, g + 30);
        var hoverB = Math.min(255, b + 30);
        var hoverColor = "rgb(" + hoverR + "," + hoverG + "," + hoverB + ")";
        document.documentElement.style.setProperty("--accent-hover", hoverColor);
        // Glow variant (with alpha)
        var glowColor = "rgba(" + r + "," + g + "," + b + ",0.3)";
        document.documentElement.style.setProperty("--accent-glow", glowColor);
    }

    // ============================================================
    // Font Size
    // ============================================================

    function applyFontSize() {
        document.body.classList.remove("font-small", "font-medium", "font-large");
        document.body.classList.add("font-" + fontSize);
    }

    // ============================================================
    // Notification Sound
    // ============================================================

    function playSound() {
        if (!soundEnabled) return;
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            var osc = audioCtx.createOscillator();
            var gain = audioCtx.createGain();
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
        if (soundToggle) soundToggle.style.opacity = soundEnabled ? "1" : "0.4";
    }

    // ============================================================
    // Conversation Manager
    // ============================================================

    function getConversations() {
        try {
            return JSON.parse(localStorage.getItem("velma_conversations")) || [];
        } catch (e) {
            return [];
        }
    }

    function saveConversations(convs) {
        localStorage.setItem("velma_conversations", JSON.stringify(convs));
        conversations = convs;
    }

    function getActiveConv() {
        for (var i = 0; i < conversations.length; i++) {
            if (conversations[i].id === activeConvId) return conversations[i];
        }
        return null;
    }

    function createConversation() {
        var conv = {
            id: "conv_" + Date.now(),
            title: "New Chat",
            messages: []
        };
        conversations.push(conv);
        activeConvId = conv.id;
        localStorage.setItem("velma_active_conv", activeConvId);
        saveConversations(conversations);
        return conv;
    }

    function switchConversation(id) {
        // Save current conversation first
        saveConversation();

        activeConvId = id;
        localStorage.setItem("velma_active_conv", id);

        var conv = getActiveConv();
        if (conv) {
            conversationHistory = conv.messages.slice();
            pinnedIndices = [];
            try {
                pinnedIndices = JSON.parse(localStorage.getItem("velma_pinned_" + id)) || [];
            } catch (e) {
                pinnedIndices = [];
            }
        } else {
            conversationHistory = [];
            pinnedIndices = [];
        }

        messagesContainer.innerHTML = "";
        if (conversationHistory.length > 0) {
            renderSavedMessages();
        } else {
            showWelcomeMessage();
        }

        updateConversationTitleDisplay();
        renderConversationsList();
        updateStats();
        scrollToBottom();
    }

    function deleteConversation(id) {
        conversations = conversations.filter(function (c) { return c.id !== id; });
        saveConversations(conversations);
        localStorage.removeItem("velma_pinned_" + id);

        if (activeConvId === id) {
            if (conversations.length > 0) {
                switchConversation(conversations[0].id);
            } else {
                var conv = createConversation();
                conversationHistory = [];
                pinnedIndices = [];
                messagesContainer.innerHTML = "";
                showWelcomeMessage();
                renderConversationsList();
            }
        } else {
            renderConversationsList();
        }
    }

    function updateConversationTitle() {
        var conv = getActiveConv();
        if (!conv) return;
        for (var i = 0; i < conversationHistory.length; i++) {
            if (conversationHistory[i].role === "user") {
                var content = conversationHistory[i].content;
                var text = typeof content === "string" ? content : "";
                if (Array.isArray(content)) {
                    for (var j = 0; j < content.length; j++) {
                        if (content[j].type === "text") { text = content[j].text; break; }
                    }
                }
                if (text.length > 30) {
                    conv.title = text.substring(0, 30) + "...";
                } else {
                    conv.title = text || "New Chat";
                }
                saveConversations(conversations);
                updateConversationTitleDisplay();
                return;
            }
        }
    }

    function updateConversationTitleDisplay() {
        var conv = getActiveConv();
        if (conversationTitle && conv) {
            conversationTitle.textContent = conv.title || "Chat with Velma AI";
        } else if (conversationTitle) {
            conversationTitle.textContent = "Chat with Velma AI";
        }
    }

    function renderConversationsList() {
        if (!conversationsList) return;
        conversationsList.innerHTML = "";

        for (var i = 0; i < conversations.length; i++) {
            var conv = conversations[i];
            var item = document.createElement("div");
            item.className = "conv-item" + (conv.id === activeConvId ? " active" : "");
            item.setAttribute("data-id", conv.id);

            var titleSpan = document.createElement("span");
            titleSpan.className = "conv-title";
            titleSpan.textContent = conv.title || "New Chat";
            item.appendChild(titleSpan);

            var delBtn = document.createElement("button");
            delBtn.className = "conv-delete-btn";
            delBtn.innerHTML = "&times;";
            delBtn.title = "Delete conversation";
            delBtn.setAttribute("data-id", conv.id);
            item.appendChild(delBtn);

            conversationsList.appendChild(item);
        }

        // Attach event listeners via delegation
        conversationsList.onclick = function (e) {
            var target = e.target;
            if (target.classList.contains("conv-delete-btn")) {
                e.stopPropagation();
                var delId = target.getAttribute("data-id");
                deleteConversation(delId);
                return;
            }
            var convItem = target.closest(".conv-item");
            if (convItem) {
                var clickId = convItem.getAttribute("data-id");
                if (clickId !== activeConvId) {
                    switchConversation(clickId);
                }
                closeSidebar();
            }
        };
    }

    // ============================================================
    // Conversation Persistence
    // ============================================================

    function saveConversation() {
        var conv = getActiveConv();
        if (conv) {
            conv.messages = conversationHistory.slice();
            saveConversations(conversations);
        }
        // Also save pinned indices per conversation
        if (activeConvId) {
            localStorage.setItem("velma_pinned_" + activeConvId, JSON.stringify(pinnedIndices));
        }
    }

    function restoreConversation() {
        conversations = getConversations();

        if (activeConvId) {
            var conv = getActiveConv();
            if (conv) {
                conversationHistory = conv.messages.slice();
                try {
                    pinnedIndices = JSON.parse(localStorage.getItem("velma_pinned_" + activeConvId)) || [];
                } catch (e) {
                    pinnedIndices = [];
                }
                return;
            }
        }

        // If no active conv found, check for legacy history
        var legacyHistory = null;
        try {
            legacyHistory = JSON.parse(localStorage.getItem("velma_history"));
        } catch (e) { /* ignore */ }

        if (conversations.length === 0) {
            var newConv = createConversation();
            if (legacyHistory && legacyHistory.length > 0) {
                conversationHistory = legacyHistory;
                newConv.messages = legacyHistory.slice();
                saveConversations(conversations);
                localStorage.removeItem("velma_history");
            } else {
                conversationHistory = [];
            }
        } else {
            // Switch to first conversation
            activeConvId = conversations[0].id;
            localStorage.setItem("velma_active_conv", activeConvId);
            conversationHistory = conversations[0].messages.slice();
            try {
                pinnedIndices = JSON.parse(localStorage.getItem("velma_pinned_" + activeConvId)) || [];
            } catch (e) {
                pinnedIndices = [];
            }
        }
    }

    function renderSavedMessages() {
        messagesContainer.innerHTML = "";
        for (var i = 0; i < conversationHistory.length; i++) {
            var msg = conversationHistory[i];
            var role = msg.role === "user" ? "user" : "bot";
            var content = msg.content;
            var text = typeof content === "string" ? content : "";
            if (Array.isArray(content)) {
                for (var j = 0; j < content.length; j++) {
                    if (content[j].type === "text") { text = content[j].text; break; }
                }
            }
            appendMessage(role, text, false, true, i);
        }
        scrollToBottom();
    }

    // ---- Sidebar Population ----
    function populateSidebar() {
        if (PROFILE.aboutText && aboutText) {
            aboutText.textContent = PROFILE.aboutText;
        }

        if (projectsList) {
            projectsList.innerHTML = "";
            for (var i = 0; i < PROFILE.projects.length; i++) {
                var project = PROFILE.projects[i];
                var li = document.createElement("li");
                if (project.url) {
                    var a = document.createElement("a");
                    a.href = project.url;
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    a.textContent = project.name;
                    li.appendChild(a);
                } else {
                    var span = document.createElement("span");
                    span.style.color = "var(--accent)";
                    span.style.fontSize = "0.85rem";
                    span.textContent = project.name;
                    li.appendChild(span);
                }
                if (project.description) {
                    var desc = document.createElement("span");
                    desc.className = "project-desc";
                    desc.textContent = project.description;
                    li.appendChild(desc);
                }
                projectsList.appendChild(li);
            }
        }

        if (quickPromptsEl) {
            quickPromptsEl.innerHTML = "";
            for (var q = 0; q < PROFILE.quickPrompts.length; q++) {
                var prompt = PROFILE.quickPrompts[q];
                var btn = document.createElement("button");
                btn.className = "quick-prompt-btn";
                btn.textContent = prompt;
                (function (p) {
                    btn.addEventListener("click", function () {
                        userInput.value = p;
                        handleSend();
                        closeSidebar();
                    });
                })(prompt);
                quickPromptsEl.appendChild(btn);
            }
        }

        var avatar = document.querySelector(".avatar");
        if (avatar && PROFILE.avatarLetter) {
            avatar.textContent = PROFILE.avatarLetter;
        }

        var tagline = document.querySelector(".tagline");
        if (tagline && PROFILE.tagline) {
            tagline.textContent = PROFILE.tagline;
        }

        // Render contacts if available
        if (PROFILE.contacts && PROFILE.contacts.length > 0 && contactsSection && contactsList) {
            contactsSection.style.display = "";
            contactsList.innerHTML = "";
            for (var c = 0; c < PROFILE.contacts.length; c++) {
                var contact = PROFILE.contacts[c];
                var link = document.createElement("a");
                link.href = contact.url || "#";
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.className = "contact-link";
                link.textContent = contact.label || contact.name || contact.url;
                contactsList.appendChild(link);
            }
        }

        // Render quick replies if available
        if (PROFILE.quickReplies && PROFILE.quickReplies.length > 0 && quickRepliesSection && quickReplies) {
            quickRepliesSection.style.display = "";
            quickReplies.innerHTML = "";
            for (var r = 0; r < PROFILE.quickReplies.length; r++) {
                var reply = PROFILE.quickReplies[r];
                var replyBtn = document.createElement("button");
                replyBtn.className = "quick-prompt-btn";
                replyBtn.textContent = reply;
                (function (rText) {
                    replyBtn.addEventListener("click", function () {
                        userInput.value = rText;
                        handleSend();
                        closeSidebar();
                    });
                })(reply);
                quickReplies.appendChild(replyBtn);
            }
        }

        renderConversationsList();
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

        updateConversationTitleDisplay();
    }

    // ============================================================
    // Enhanced Welcome Screen
    // ============================================================

    function showWelcomeMessage() {
        messagesContainer.innerHTML = "";
        var welcome = document.createElement("div");
        welcome.className = "welcome-message";
        welcome.innerHTML =
            '<div class="welcome-avatar">' +
                '<div class="welcome-avatar-circle">' + escapeHtml(PROFILE.avatarLetter) + '</div>' +
            '</div>' +
            '<h2>Welcome!</h2>' +
            '<p>' + escapeHtml(PROFILE.welcomeMessage) + '</p>' +
            '<div class="welcome-tips">' +
                '<div class="welcome-tip">Type a message to start chatting</div>' +
                '<div class="welcome-tip">Try the quick prompts in the sidebar</div>' +
                '<div class="welcome-tip">Type <kbd>/help</kbd> for slash commands</div>' +
            '</div>';
        messagesContainer.appendChild(welcome);
    }

    // ---- Events ----
    function bindEvents() {
        // Save API key
        saveKeyBtn.addEventListener("click", function () {
            var key = apiKeyInput.value.trim();
            if (!key) return;
            apiKey = key;
            localStorage.setItem("velma_api_key", key);
            showApp();
        });

        apiKeyInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") saveKeyBtn.click();
        });

        // Send message
        chatForm.addEventListener("submit", function (e) {
            e.preventDefault();
            handleSend();
        });

        // Auto-resize textarea + char counter
        userInput.addEventListener("input", function () {
            userInput.style.height = "auto";
            userInput.style.height = Math.min(userInput.scrollHeight, 150) + "px";
            updateCharCounter();
        });

        // Enter to send (Shift+Enter for newline)
        userInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });

        // Clear chat
        clearChatBtn.addEventListener("click", function () {
            conversationHistory = [];
            pinnedIndices = [];
            saveConversation();
            showWelcomeMessage();
            updateConversationTitleDisplay();
            closeSidebar();
            updateStats();
        });

        // Export chat
        exportChatBtn.addEventListener("click", function () {
            exportChat();
            closeSidebar();
        });

        // Change API key
        changeKeyBtn.addEventListener("click", function () {
            apiKey = "";
            localStorage.removeItem("velma_api_key");
            apiKeyInput.value = "";
            showModal();
            closeSidebar();
        });

        // Mobile menu toggle
        menuToggle.addEventListener("click", toggleSidebar);

        // Theme toggle
        themeToggle.addEventListener("click", toggleTheme);

        // Sound toggle (header)
        soundToggle.addEventListener("click", function () {
            soundEnabled = !soundEnabled;
            localStorage.setItem("velma_sound", soundEnabled);
            updateSoundIcon();
            updateSettingsUI();
        });

        // Scroll to bottom
        scrollBottomBtn.addEventListener("click", function () {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });

        // Keyboard shortcuts overlay
        shortcutsBtn.addEventListener("click", function () {
            shortcutsOverlay.classList.remove("hidden");
        });

        closeShortcutsBtn.addEventListener("click", function () {
            shortcutsOverlay.classList.add("hidden");
        });

        shortcutsOverlay.addEventListener("click", function (e) {
            if (e.target === shortcutsOverlay) {
                shortcutsOverlay.classList.add("hidden");
            }
        });

        // Settings overlay
        settingsBtn.addEventListener("click", function () {
            updateSettingsUI();
            settingsOverlay.classList.remove("hidden");
        });

        closeSettingsBtn.addEventListener("click", function () {
            settingsOverlay.classList.add("hidden");
        });

        settingsOverlay.addEventListener("click", function (e) {
            if (e.target === settingsOverlay) {
                settingsOverlay.classList.add("hidden");
            }
        });

        // Accent color
        accentColorInput.addEventListener("input", function () {
            accentColor = accentColorInput.value;
            localStorage.setItem("velma_accent", accentColor);
            applyAccentColor();
        });

        // Font size controls
        fontDecrease.addEventListener("click", function () {
            if (fontSize === "large") fontSize = "medium";
            else if (fontSize === "medium") fontSize = "small";
            localStorage.setItem("velma_fontsize", fontSize);
            applyFontSize();
            updateSettingsUI();
        });

        fontIncrease.addEventListener("click", function () {
            if (fontSize === "small") fontSize = "medium";
            else if (fontSize === "medium") fontSize = "large";
            localStorage.setItem("velma_fontsize", fontSize);
            applyFontSize();
            updateSettingsUI();
        });

        // Max tokens slider
        maxTokensSlider.addEventListener("input", function () {
            maxTokens = parseInt(maxTokensSlider.value, 10);
            localStorage.setItem("velma_max_tokens", maxTokens);
            maxTokensLabel.textContent = maxTokens;
        });

        // Particles toggle
        particlesToggle.addEventListener("click", function () {
            particlesEnabled = !particlesEnabled;
            localStorage.setItem("velma_particles", particlesEnabled);
            if (particlesEnabled) {
                particlesToggle.textContent = "On";
                particlesToggle.classList.add("active");
                initParticles();
            } else {
                particlesToggle.textContent = "Off";
                particlesToggle.classList.remove("active");
                destroyParticles();
            }
        });

        // Auto-scroll toggle
        autoscrollToggle.addEventListener("click", function () {
            autoScroll = !autoScroll;
            localStorage.setItem("velma_autoscroll", autoScroll);
            if (autoScroll) {
                autoscrollToggle.textContent = "On";
                autoscrollToggle.classList.add("active");
            } else {
                autoscrollToggle.textContent = "Off";
                autoscrollToggle.classList.remove("active");
            }
        });

        // Sound toggle (settings)
        soundToggleSetting.addEventListener("click", function () {
            soundEnabled = !soundEnabled;
            localStorage.setItem("velma_sound", soundEnabled);
            updateSoundIcon();
            if (soundEnabled) {
                soundToggleSetting.textContent = "On";
                soundToggleSetting.classList.add("active");
            } else {
                soundToggleSetting.textContent = "Off";
                soundToggleSetting.classList.remove("active");
            }
        });

        // System prompt viewer
        syspromptBtn.addEventListener("click", function () {
            syspromptText.textContent = PROFILE.systemPrompt;
            syspromptOverlay.classList.remove("hidden");
        });

        closeSyspromptBtn.addEventListener("click", function () {
            syspromptOverlay.classList.add("hidden");
        });

        syspromptOverlay.addEventListener("click", function (e) {
            if (e.target === syspromptOverlay) {
                syspromptOverlay.classList.add("hidden");
            }
        });

        // Pinned messages
        pinnedBtn.addEventListener("click", function () {
            renderPinnedMessages();
            pinnedOverlay.classList.remove("hidden");
        });

        closePinnedBtn.addEventListener("click", function () {
            pinnedOverlay.classList.add("hidden");
        });

        pinnedOverlay.addEventListener("click", function (e) {
            if (e.target === pinnedOverlay) {
                pinnedOverlay.classList.add("hidden");
            }
        });

        // New chat
        newChatBtn.addEventListener("click", function () {
            saveConversation();
            var conv = createConversation();
            conversationHistory = [];
            pinnedIndices = [];
            messagesContainer.innerHTML = "";
            showWelcomeMessage();
            renderConversationsList();
            updateConversationTitleDisplay();
            updateStats();
            closeSidebar();
        });

        // Search
        searchToggleBtn.addEventListener("click", function () {
            if (searchBar.classList.contains("hidden")) {
                searchBar.classList.remove("hidden");
                chatSearchInput.focus();
            } else {
                closeSearch();
            }
        });

        chatSearchInput.addEventListener("input", function () {
            performSearch();
        });

        searchCloseBtn.addEventListener("click", function () {
            closeSearch();
        });

        // Fullscreen
        fullscreenBtn.addEventListener("click", function () {
            toggleFullscreen();
        });

        // Attach image
        attachBtn.addEventListener("click", function () {
            fileInput.click();
        });

        fileInput.addEventListener("change", function () {
            if (fileInput.files && fileInput.files[0]) {
                readImageFile(fileInput.files[0]);
                fileInput.value = "";
            }
        });

        // Image remove
        imageRemoveBtn.addEventListener("click", function () {
            pendingImage = null;
            imagePreview.classList.add("hidden");
            imagePreviewImg.src = "";
        });

        // Mic button
        if (micBtn) {
            micBtn.addEventListener("click", function () {
                toggleVoiceRecording();
            });
        }

        // ============================================================
        // Keyboard Shortcuts
        // ============================================================
        document.addEventListener("keydown", function (e) {
            if (e.ctrlKey && e.key === "l") {
                e.preventDefault();
                conversationHistory = [];
                pinnedIndices = [];
                saveConversation();
                showWelcomeMessage();
                updateStats();
            }
            if (e.ctrlKey && e.key === "e") {
                e.preventDefault();
                exportChat();
            }
            if (e.ctrlKey && e.key === "d") {
                e.preventDefault();
                toggleTheme();
            }
            if (e.ctrlKey && e.key === "f") {
                e.preventDefault();
                if (searchBar.classList.contains("hidden")) {
                    searchBar.classList.remove("hidden");
                    chatSearchInput.focus();
                } else {
                    closeSearch();
                }
            }
            if (e.ctrlKey && e.key === "\\") {
                e.preventDefault();
                toggleFullscreen();
            }
            if (e.key === "Escape") {
                shortcutsOverlay.classList.add("hidden");
                settingsOverlay.classList.add("hidden");
                syspromptOverlay.classList.add("hidden");
                pinnedOverlay.classList.add("hidden");
                closeSearch();
                closeSidebar();
            }
        });

        // Sidebar resize
        var isResizing = false;
        if (sidebarResizeHandle) {
            sidebarResizeHandle.addEventListener("mousedown", function (e) {
                isResizing = true;
                e.preventDefault();
            });

            document.addEventListener("mousemove", function (e) {
                if (!isResizing) return;
                var newWidth = e.clientX;
                if (newWidth < 200) newWidth = 200;
                if (newWidth > 500) newWidth = 500;
                document.documentElement.style.setProperty("--sidebar-width", newWidth + "px");
            });

            document.addEventListener("mouseup", function () {
                isResizing = false;
            });
        }

        // Paste image from clipboard
        userInput.addEventListener("paste", function (e) {
            var items = e.clipboardData && e.clipboardData.items;
            if (!items) return;
            for (var i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    e.preventDefault();
                    var file = items[i].getAsFile();
                    if (file) readImageFile(file);
                    return;
                }
            }
        });

        // Drag and drop images
        messagesContainer.addEventListener("dragover", function (e) {
            e.preventDefault();
        });

        messagesContainer.addEventListener("drop", function (e) {
            e.preventDefault();
            var files = e.dataTransfer && e.dataTransfer.files;
            if (!files || files.length === 0) return;
            for (var i = 0; i < files.length; i++) {
                if (files[i].type.indexOf("image") !== -1) {
                    readImageFile(files[i]);
                    return;
                }
            }
        });
    }

    // ============================================================
    // Scroll Observer & Progress
    // ============================================================

    function setupScrollObserver() {
        messagesContainer.addEventListener("scroll", function () {
            var distFromBottom =
                messagesContainer.scrollHeight -
                messagesContainer.scrollTop -
                messagesContainer.clientHeight;

            if (distFromBottom > 200) {
                scrollBottomBtn.classList.remove("hidden");
            } else {
                scrollBottomBtn.classList.add("hidden");
            }

            // Scroll progress bar
            if (scrollProgress) {
                var scrollHeight = messagesContainer.scrollHeight - messagesContainer.clientHeight;
                var percent = scrollHeight > 0 ? (messagesContainer.scrollTop / scrollHeight) * 100 : 0;
                scrollProgress.style.width = percent + "%";
            }
        });
    }

    // ============================================================
    // Character Counter
    // ============================================================

    function updateCharCounter() {
        var len = userInput.value.length;
        if (len > 0) {
            charCounter.textContent = len.toLocaleString();
            charCounter.style.opacity = "1";
        } else {
            charCounter.textContent = "";
            charCounter.style.opacity = "0";
        }
    }

    // ---- Sidebar Toggle ----
    function toggleSidebar() {
        var isOpen = sidebar.classList.contains("open");
        if (isOpen) {
            closeSidebar();
        } else {
            sidebar.classList.add("open");
            var overlay = document.createElement("div");
            overlay.className = "sidebar-overlay";
            overlay.addEventListener("click", closeSidebar);
            document.body.appendChild(overlay);
        }
    }

    function closeSidebar() {
        sidebar.classList.remove("open");
        var overlay = document.querySelector(".sidebar-overlay");
        if (overlay) overlay.remove();
    }

    // ============================================================
    // Slash Commands
    // ============================================================

    function handleSlashCommand(text) {
        var cmd = text.toLowerCase().trim();
        if (cmd === "/clear") {
            conversationHistory = [];
            pinnedIndices = [];
            saveConversation();
            showWelcomeMessage();
            updateStats();
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
        if (cmd === "/stats") {
            var elapsed = Date.now() - sessionStart;
            var mins = Math.floor(elapsed / 60000);
            var hrs = Math.floor(mins / 60);
            var remMins = mins % 60;
            var timeStr = hrs > 0 ? hrs + "h " + remMins + "m" : mins + "m";
            var statsText =
                "**Session Statistics**\n" +
                "- Messages: " + conversationHistory.length + "\n" +
                "- Tokens used: " + totalTokens + "\n" +
                "- Session duration: " + timeStr;
            appendMessage("bot", statsText, false, true, -1);
            return true;
        }
        if (cmd === "/prompt") {
            syspromptText.textContent = PROFILE.systemPrompt;
            syspromptOverlay.classList.remove("hidden");
            return true;
        }
        return false;
    }

    // ============================================================
    // Export Chat as Markdown
    // ============================================================

    function exportChat() {
        if (conversationHistory.length === 0) return;
        var md = "# Velma AI Chat Export\n_Exported " + new Date().toLocaleString() + "_\n\n---\n\n";
        for (var i = 0; i < conversationHistory.length; i++) {
            var msg = conversationHistory[i];
            var role = msg.role === "user" ? "You" : "Velma";
            var content = msg.content;
            var text = typeof content === "string" ? content : "";
            if (Array.isArray(content)) {
                for (var j = 0; j < content.length; j++) {
                    if (content[j].type === "text") { text = content[j].text; break; }
                }
            }
            md += "**" + role + ":**\n" + text + "\n\n";
        }
        var blob = new Blob([md], { type: "text/markdown" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "velma-chat-" + Date.now() + ".md";
        a.click();
        URL.revokeObjectURL(url);
    }

    // ---- Send Message ----
    async function handleSend() {
        var text = userInput.value.trim();
        if (!text && !pendingImage) return;
        if (isStreaming) return;

        // Handle slash commands
        if (text.startsWith("/") && handleSlashCommand(text)) {
            userInput.value = "";
            userInput.style.height = "auto";
            updateCharCounter();
            return;
        }

        // Remove welcome message
        var welcome = messagesContainer.querySelector(".welcome-message");
        if (welcome) welcome.remove();

        // Show confetti on first ever conversation
        if (!hasHadFirstConversation) {
            hasHadFirstConversation = true;
            localStorage.setItem("velma_first_conv", "true");
            showConfetti();
        }

        // Build message content
        var messageContent;
        if (pendingImage) {
            messageContent = [
                {
                    type: "image",
                    source: {
                        type: "base64",
                        media_type: pendingImage.mediaType,
                        data: pendingImage.base64
                    }
                },
                {
                    type: "text",
                    text: text || "What is in this image?"
                }
            ];
            pendingImage = null;
            imagePreview.classList.add("hidden");
            imagePreviewImg.src = "";
        } else {
            messageContent = text;
        }

        // Show user message in UI (text only)
        var displayText = text || "[Image attached]";
        var msgIndex = conversationHistory.length;
        appendMessage("user", displayText, false, true, msgIndex);

        // Push to conversation history
        conversationHistory.push({ role: "user", content: messageContent });

        // Auto-generate conversation title from first user message
        if (conversationHistory.length === 1) {
            updateConversationTitle();
        }

        // Save state
        saveConversation();
        renderConversationsList();

        // Clear input
        userInput.value = "";
        userInput.style.height = "auto";
        updateCharCounter();

        // Call Claude API
        await callClaude();
    }

    // ============================================================
    // Streaming Responses
    // ============================================================

    async function callClaude() {
        isStreaming = true;
        sendBtn.disabled = true;
        typingIndicator.classList.remove("hidden");
        scrollToBottom();

        // Hide follow-ups
        if (followupEl) followupEl.classList.add("hidden");

        // Create bot message container for streaming
        var msg = document.createElement("div");
        msg.className = "message bot";

        var avatarEl = document.createElement("div");
        avatarEl.className = "message-avatar";
        avatarEl.textContent = PROFILE.avatarLetter;

        var bubbleWrapper = document.createElement("div");
        bubbleWrapper.className = "bubble-wrapper";

        var bubble = document.createElement("div");
        bubble.className = "message-bubble";
        bubble.innerHTML = '<span class="streaming-cursor"></span>';

        bubbleWrapper.appendChild(bubble);
        msg.appendChild(avatarEl);
        msg.appendChild(bubbleWrapper);

        var inputTokens = 0;
        var outputTokens = 0;

        try {
            var response = await fetch(
                "https://api.anthropic.com/v1/messages",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": apiKey,
                        "anthropic-version": "2023-06-01",
                        "anthropic-dangerous-direct-browser-access": "true"
                    },
                    body: JSON.stringify({
                        model: PROFILE.model,
                        max_tokens: maxTokens,
                        system: PROFILE.systemPrompt,
                        messages: conversationHistory,
                        stream: true
                    })
                }
            );

            if (!response.ok) {
                var errorData = await response.json().catch(function () { return null; });
                var errorMsg = "API Error (" + response.status + ")";

                if (response.status === 401) {
                    errorMsg = "Invalid API key. Please check your key and try again.";
                } else if (response.status === 429) {
                    errorMsg = "Rate limited. Please wait a moment and try again.";
                } else if (errorData && errorData.error && errorData.error.message) {
                    errorMsg = errorData.error.message;
                }

                throw new Error(errorMsg);
            }

            // Hide typing indicator, show streaming bubble
            typingIndicator.classList.add("hidden");
            messagesContainer.appendChild(msg);
            scrollToBottom();

            var reader = response.body.getReader();
            var decoder = new TextDecoder();
            var assistantMessage = "";
            var buffer = "";

            while (true) {
                var result = await reader.read();
                if (result.done) break;

                buffer += decoder.decode(result.value, { stream: true });
                var lines = buffer.split("\n");
                buffer = lines.pop();

                for (var li = 0; li < lines.length; li++) {
                    var line = lines[li];
                    if (line.startsWith("data: ")) {
                        var jsonStr = line.slice(6);
                        try {
                            var data = JSON.parse(jsonStr);
                            if (data.type === "content_block_delta" && data.delta && data.delta.text) {
                                assistantMessage += data.delta.text;
                                bubble.innerHTML =
                                    renderMarkdown(assistantMessage) +
                                    '<span class="streaming-cursor"></span>';
                                scrollToBottom();
                            }
                            // Capture token counts
                            if (data.type === "message_start" && data.message && data.message.usage) {
                                inputTokens = data.message.usage.input_tokens || 0;
                            }
                            if (data.type === "message_delta" && data.usage) {
                                outputTokens = data.usage.output_tokens || 0;
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
            highlightCode(bubble);

            // Add timestamp
            var time = document.createElement("span");
            time.className = "message-time";
            time.textContent = formatTime(new Date());
            bubbleWrapper.appendChild(time);

            // Add message actions
            var assistantIndex = conversationHistory.length;
            addMessageActions(bubbleWrapper, assistantMessage, assistantIndex, "bot");

            // Add token count display
            var tokenCount = inputTokens + outputTokens;
            totalTokens += tokenCount;
            if (tokenCount > 0) {
                var tokenDisplay = document.createElement("span");
                tokenDisplay.className = "token-count";
                tokenDisplay.textContent = tokenCount + " tokens";
                bubbleWrapper.appendChild(tokenDisplay);
            }

            // Show follow-up prompts
            showFollowups(assistantMessage);

            // Push to history and save
            conversationHistory.push({
                role: "assistant",
                content: assistantMessage
            });
            saveConversation();
            playSound();
            updateStats();
        } catch (err) {
            typingIndicator.classList.add("hidden");
            // Remove the streaming bubble if it was added
            if (msg.parentNode) msg.remove();
            appendMessage("bot", err.message, true, true, -1);
            // Remove the failed user message from history
            if (
                conversationHistory.length > 0 &&
                conversationHistory[conversationHistory.length - 1].role === "user"
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
    function appendMessage(role, text, isError, withExtras, msgIndex) {
        if (typeof isError === "undefined") isError = false;
        if (typeof withExtras === "undefined") withExtras = true;
        if (typeof msgIndex === "undefined") msgIndex = -1;

        var msg = document.createElement("div");
        msg.className = "message " + role;
        if (msgIndex >= 0) msg.setAttribute("data-msg-index", msgIndex);

        var avatarEl = document.createElement("div");
        avatarEl.className = "message-avatar";
        avatarEl.textContent = role === "user" ? "You" : PROFILE.avatarLetter;

        var bubbleWrapper = document.createElement("div");
        bubbleWrapper.className = "bubble-wrapper";

        var bubble = document.createElement("div");
        bubble.className = "message-bubble" + (isError ? " error-bubble" : "");

        if (role === "bot" && !isError) {
            bubble.innerHTML = renderMarkdown(text);
            addCodeCopyButtons(bubble);
            highlightCode(bubble);
        } else {
            bubble.textContent = text;
        }

        bubbleWrapper.appendChild(bubble);

        // Timestamp
        if (withExtras) {
            var time = document.createElement("span");
            time.className = "message-time";
            time.textContent = formatTime(new Date());
            bubbleWrapper.appendChild(time);
        }

        // Message actions
        if (withExtras && !isError) {
            addMessageActions(bubbleWrapper, text, msgIndex, role);
        }

        msg.appendChild(avatarEl);
        msg.appendChild(bubbleWrapper);
        messagesContainer.appendChild(msg);
        scrollToBottom();
    }

    // ============================================================
    // Message Actions
    // ============================================================

    function addMessageActions(wrapper, text, msgIndex, role) {
        var actions = document.createElement("div");
        actions.className = "message-actions";

        if (role === "bot") {
            // Copy button
            var copyBtn = document.createElement("button");
            copyBtn.className = "msg-action-btn";
            copyBtn.title = "Copy message";
            copyBtn.innerHTML =
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy';

            copyBtn.addEventListener("click", function () {
                navigator.clipboard.writeText(text).then(function () {
                    copyBtn.innerHTML =
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
                    setTimeout(function () {
                        copyBtn.innerHTML =
                            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy';
                    }, 1500);
                });
            });
            actions.appendChild(copyBtn);

            // Regenerate button
            var regenBtn = document.createElement("button");
            regenBtn.className = "msg-action-btn";
            regenBtn.title = "Regenerate response";
            regenBtn.innerHTML =
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg> Regen';

            regenBtn.addEventListener("click", function () {
                if (isStreaming) return;
                // Pop last assistant message from history
                if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === "assistant") {
                    conversationHistory.pop();
                    saveConversation();
                }
                // Remove the bot message from DOM
                var msgEl = wrapper.closest(".message");
                if (msgEl) msgEl.remove();
                // Call Claude again
                callClaude();
            });
            actions.appendChild(regenBtn);

            // TTS button
            var ttsBtn = document.createElement("button");
            ttsBtn.className = "msg-action-btn";
            ttsBtn.title = "Read aloud";
            ttsBtn.innerHTML =
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> TTS';

            var isSpeaking = false;
            ttsBtn.addEventListener("click", function () {
                if (isSpeaking) {
                    window.speechSynthesis.cancel();
                    isSpeaking = false;
                    ttsBtn.innerHTML =
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> TTS';
                } else {
                    var utterance = new SpeechSynthesisUtterance(text);
                    utterance.onend = function () {
                        isSpeaking = false;
                        ttsBtn.innerHTML =
                            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> TTS';
                    };
                    window.speechSynthesis.speak(utterance);
                    isSpeaking = true;
                    ttsBtn.innerHTML =
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Stop';
                }
            });
            actions.appendChild(ttsBtn);
        }

        if (role === "user") {
            // Edit button
            var editBtn = document.createElement("button");
            editBtn.className = "msg-action-btn";
            editBtn.title = "Edit message";
            editBtn.innerHTML =
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Edit';

            (function (idx) {
                editBtn.addEventListener("click", function () {
                    if (isStreaming) return;
                    // Put text back in input
                    userInput.value = text;
                    userInput.style.height = "auto";
                    userInput.style.height = Math.min(userInput.scrollHeight, 150) + "px";
                    updateCharCounter();

                    // Remove this message and all subsequent from history and DOM
                    if (idx >= 0 && idx < conversationHistory.length) {
                        conversationHistory.splice(idx);
                        saveConversation();
                    }

                    // Remove DOM elements from this message onward
                    var allMessages = messagesContainer.querySelectorAll(".message");
                    var startRemoving = false;
                    var msgEl = wrapper.closest(".message");
                    for (var m = 0; m < allMessages.length; m++) {
                        if (allMessages[m] === msgEl) startRemoving = true;
                        if (startRemoving) allMessages[m].remove();
                    }

                    userInput.focus();
                    updateStats();
                });
            })(msgIndex);
            actions.appendChild(editBtn);
        }

        // Pin button (both roles)
        var pinBtn = document.createElement("button");
        pinBtn.className = "msg-action-btn";
        var isPinned = pinnedIndices.indexOf(msgIndex) !== -1;
        pinBtn.title = isPinned ? "Unpin message" : "Pin message";
        pinBtn.innerHTML = isPinned
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Unpin'
            : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Pin';

        (function (idx) {
            pinBtn.addEventListener("click", function () {
                var pinIndex = pinnedIndices.indexOf(idx);
                if (pinIndex !== -1) {
                    pinnedIndices.splice(pinIndex, 1);
                    pinBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Pin';
                    pinBtn.title = "Pin message";
                } else {
                    pinnedIndices.push(idx);
                    pinBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Unpin';
                    pinBtn.title = "Unpin message";
                }
                if (activeConvId) {
                    localStorage.setItem("velma_pinned_" + activeConvId, JSON.stringify(pinnedIndices));
                }
            });
        })(msgIndex);
        actions.appendChild(pinBtn);

        // Delete button (both roles)
        var delBtn = document.createElement("button");
        delBtn.className = "msg-action-btn";
        delBtn.title = "Delete message";
        delBtn.innerHTML =
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Del';

        (function (idx) {
            delBtn.addEventListener("click", function () {
                if (isStreaming) return;
                // Remove from DOM
                var msgEl = wrapper.closest(".message");
                if (msgEl) msgEl.remove();

                // Remove from history
                if (idx >= 0 && idx < conversationHistory.length) {
                    conversationHistory.splice(idx, 1);
                    // Update pinned indices
                    pinnedIndices = pinnedIndices.filter(function (pi) { return pi !== idx; }).map(function (pi) {
                        return pi > idx ? pi - 1 : pi;
                    });
                    saveConversation();
                }
                updateStats();
            });
        })(msgIndex);
        actions.appendChild(delBtn);

        // Emoji reactions (bot messages)
        if (role === "bot") {
            var emojis = ["\uD83D\uDC4D", "\uD83D\uDC4E", "\u2764\uFE0F", "\uD83D\uDE02", "\uD83E\uDD14"];
            var reactionsRow = document.createElement("div");
            reactionsRow.className = "emoji-reactions";

            for (var ei = 0; ei < emojis.length; ei++) {
                var emojiBtn = document.createElement("button");
                emojiBtn.className = "emoji-btn";
                emojiBtn.textContent = emojis[ei];
                emojiBtn.addEventListener("click", function (evt) {
                    evt.target.classList.toggle("active");
                });
                reactionsRow.appendChild(emojiBtn);
            }
            actions.appendChild(reactionsRow);
        }

        wrapper.appendChild(actions);
    }

    // ============================================================
    // Timestamp Formatting
    // ============================================================

    function formatTime(date) {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    // ============================================================
    // Code Block Copy Button
    // ============================================================

    function addCodeCopyButtons(bubble) {
        var codeBlocks = bubble.querySelectorAll("pre");
        for (var i = 0; i < codeBlocks.length; i++) {
            var pre = codeBlocks[i];
            if (pre.parentElement && pre.parentElement.classList.contains("code-block-wrapper")) continue;
            var wrapper = document.createElement("div");
            wrapper.className = "code-block-wrapper";
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            var btn = document.createElement("button");
            btn.className = "code-copy-btn";
            btn.textContent = "Copy";
            (function (preEl, btnEl) {
                btnEl.addEventListener("click", function () {
                    var code = preEl.textContent;
                    navigator.clipboard.writeText(code).then(function () {
                        btnEl.textContent = "Copied!";
                        setTimeout(function () {
                            btnEl.textContent = "Copy";
                        }, 1500);
                    });
                });
            })(pre, btn);
            wrapper.appendChild(btn);
        }
    }

    // ============================================================
    // Syntax Highlighting
    // ============================================================

    function highlightCode(bubble) {
        if (window.Prism) {
            Prism.highlightAllUnder(bubble);
        }
    }

    // ============================================================
    // Follow-up Prompts
    // ============================================================

    function showFollowups(text) {
        if (!followupEl) return;
        followupEl.innerHTML = "";
        followupEl.classList.add("hidden");

        var lowerText = text.toLowerCase();
        var suggestions = [];

        if (lowerText.indexOf("project") !== -1) {
            suggestions.push("Tell me more about this project");
            suggestions.push("What tech stack did you use?");
        } else if (lowerText.indexOf("experience") !== -1 || lowerText.indexOf("work") !== -1) {
            suggestions.push("What challenges did you face?");
            suggestions.push("What did you learn?");
        } else if (lowerText.indexOf("contact") !== -1 || lowerText.indexOf("reach") !== -1) {
            suggestions.push("What's the best way to reach you?");
            suggestions.push("Are you open to collaboration?");
        } else {
            suggestions.push("Tell me more");
            suggestions.push("Can you give an example?");
        }

        for (var i = 0; i < suggestions.length; i++) {
            var btn = document.createElement("button");
            btn.className = "followup-btn";
            btn.textContent = suggestions[i];
            (function (s) {
                btn.addEventListener("click", function () {
                    userInput.value = s;
                    handleSend();
                });
            })(suggestions[i]);
            followupEl.appendChild(btn);
        }

        followupEl.classList.remove("hidden");
    }

    // ============================================================
    // Voice Input
    // ============================================================

    function initVoiceInput() {
        var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = function (event) {
            var transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            handleSend();
        };

        recognition.onend = function () {
            isRecording = false;
            if (micBtn) micBtn.classList.remove("recording");
        };

        recognition.onerror = function () {
            isRecording = false;
            if (micBtn) micBtn.classList.remove("recording");
        };

        // Show mic button
        if (micBtn) micBtn.classList.remove("hidden");
    }

    function toggleVoiceRecording() {
        if (!recognition) return;

        if (isRecording) {
            recognition.stop();
            isRecording = false;
            if (micBtn) micBtn.classList.remove("recording");
        } else {
            recognition.start();
            isRecording = true;
            if (micBtn) micBtn.classList.add("recording");
        }
    }

    // ============================================================
    // Image Handling
    // ============================================================

    function readImageFile(file) {
        if (!file || file.type.indexOf("image") === -1) return;

        var reader = new FileReader();
        reader.onload = function (e) {
            var dataUrl = e.target.result;
            // Extract base64 and media type
            var parts = dataUrl.split(",");
            var meta = parts[0]; // e.g., data:image/png;base64
            var base64 = parts[1];
            var mediaTypeMatch = meta.match(/data:(image\/[^;]+);/);
            var mediaType = mediaTypeMatch ? mediaTypeMatch[1] : "image/png";

            pendingImage = {
                base64: base64,
                mediaType: mediaType
            };

            // Show preview
            imagePreviewImg.src = dataUrl;
            imagePreview.classList.remove("hidden");
        };
        reader.readAsDataURL(file);
    }

    // ============================================================
    // Search
    // ============================================================

    function performSearch() {
        var query = chatSearchInput.value.trim().toLowerCase();
        var bubbles = messagesContainer.querySelectorAll(".message-bubble");
        var count = 0;

        for (var i = 0; i < bubbles.length; i++) {
            var bubble = bubbles[i];
            // Restore original text first (remove existing highlights)
            var existingMarks = bubble.querySelectorAll("mark.search-highlight");
            for (var m = 0; m < existingMarks.length; m++) {
                var parent = existingMarks[m].parentNode;
                parent.replaceChild(document.createTextNode(existingMarks[m].textContent), existingMarks[m]);
                parent.normalize();
            }

            if (!query) continue;

            // Search and highlight in text nodes
            var matches = highlightTextInElement(bubble, query);
            count += matches;
        }

        if (query) {
            searchResultCount.textContent = count + " found";
        } else {
            searchResultCount.textContent = "";
        }
    }

    function highlightTextInElement(element, query) {
        var matches = 0;
        var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        var textNodes = [];

        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }

        for (var i = 0; i < textNodes.length; i++) {
            var node = textNodes[i];
            var text = node.textContent.toLowerCase();
            var idx = text.indexOf(query);
            if (idx === -1) continue;

            var original = node.textContent;
            var fragment = document.createDocumentFragment();
            var lastIndex = 0;

            while (idx !== -1) {
                matches++;
                // Text before match
                if (idx > lastIndex) {
                    fragment.appendChild(document.createTextNode(original.substring(lastIndex, idx)));
                }
                // Highlighted match
                var mark = document.createElement("mark");
                mark.className = "search-highlight";
                mark.textContent = original.substring(idx, idx + query.length);
                fragment.appendChild(mark);
                lastIndex = idx + query.length;

                // Find next occurrence
                idx = text.indexOf(query, lastIndex);
            }

            // Remaining text
            if (lastIndex < original.length) {
                fragment.appendChild(document.createTextNode(original.substring(lastIndex)));
            }

            node.parentNode.replaceChild(fragment, node);
        }

        return matches;
    }

    function closeSearch() {
        searchBar.classList.add("hidden");
        chatSearchInput.value = "";
        searchResultCount.textContent = "";
        // Clear all highlights
        var marks = messagesContainer.querySelectorAll("mark.search-highlight");
        for (var i = 0; i < marks.length; i++) {
            var parent = marks[i].parentNode;
            parent.replaceChild(document.createTextNode(marks[i].textContent), marks[i]);
            parent.normalize();
        }
    }

    // ============================================================
    // Particle System
    // ============================================================

    function initParticles() {
        if (!particlesEnabled || !particleCanvas) return;
        destroyParticles();

        var ctx = particleCanvas.getContext("2d");
        var particles = [];
        var animFrameId = null;

        function resize() {
            particleCanvas.width = particleCanvas.offsetWidth;
            particleCanvas.height = particleCanvas.offsetHeight;
        }

        resize();
        window.addEventListener("resize", resize);

        // Create particles
        for (var i = 0; i < 45; i++) {
            particles.push({
                x: Math.random() * particleCanvas.width,
                y: Math.random() * particleCanvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.3 + 0.1
            });
        }

        function animate() {
            ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around edges
                if (p.x < 0) p.x = particleCanvas.width;
                if (p.x > particleCanvas.width) p.x = 0;
                if (p.y < 0) p.y = particleCanvas.height;
                if (p.y > particleCanvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(124, 92, 252, " + p.opacity + ")";
                ctx.fill();
            }

            animFrameId = requestAnimationFrame(animate);
        }

        animate();

        particleSystem = {
            destroy: function () {
                if (animFrameId) cancelAnimationFrame(animFrameId);
                window.removeEventListener("resize", resize);
                ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
                animFrameId = null;
            }
        };
    }

    function destroyParticles() {
        if (particleSystem) {
            particleSystem.destroy();
            particleSystem = null;
        }
    }

    // ============================================================
    // Confetti
    // ============================================================

    function showConfetti() {
        var canvas = document.createElement("canvas");
        canvas.style.position = "fixed";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = "9999";
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);

        var ctx = canvas.getContext("2d");
        var colors = ["#7c5cfc", "#a78bfa", "#c4b5fd", "#48c774", "#fbbf24", "#f87171"];
        var pieces = [];

        for (var i = 0; i < 100; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * -1,
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * 3 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                width: Math.random() * 10 + 5,
                height: Math.random() * 6 + 3,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                gravity: 0.1
            });
        }

        var startTime = Date.now();

        function animateConfetti() {
            var elapsed = Date.now() - startTime;
            if (elapsed > 3000) {
                canvas.remove();
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (var i = 0; i < pieces.length; i++) {
                var p = pieces[i];
                p.x += p.vx;
                p.vy += p.gravity;
                p.y += p.vy;
                p.rotation += p.rotationSpeed;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, 1 - elapsed / 3000);
                ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
                ctx.restore();
            }

            requestAnimationFrame(animateConfetti);
        }

        requestAnimationFrame(animateConfetti);
    }

    // ============================================================
    // Statistics
    // ============================================================

    function updateStats() {
        if (statMessages) statMessages.textContent = conversationHistory.length;
        if (statTokens) statTokens.textContent = totalTokens;

        if (statDuration) {
            var elapsed = Date.now() - sessionStart;
            var totalMins = Math.floor(elapsed / 60000);
            var hrs = Math.floor(totalMins / 60);
            var mins = totalMins % 60;
            if (hrs > 0) {
                statDuration.textContent = hrs + "h " + mins + "m";
            } else {
                statDuration.textContent = totalMins + "m";
            }
        }
    }

    // ============================================================
    // Pinned Messages
    // ============================================================

    function renderPinnedMessages() {
        if (!pinnedList) return;
        pinnedList.innerHTML = "";

        if (pinnedIndices.length === 0) {
            pinnedList.innerHTML = '<p class="text-muted">No pinned messages yet.</p>';
            return;
        }

        for (var i = 0; i < pinnedIndices.length; i++) {
            var idx = pinnedIndices[i];
            if (idx < 0 || idx >= conversationHistory.length) continue;

            var msg = conversationHistory[idx];
            var content = msg.content;
            var text = typeof content === "string" ? content : "";
            if (Array.isArray(content)) {
                for (var j = 0; j < content.length; j++) {
                    if (content[j].type === "text") { text = content[j].text; break; }
                }
            }

            var item = document.createElement("div");
            item.className = "pinned-item";

            var roleLabel = document.createElement("span");
            roleLabel.className = "pinned-role";
            roleLabel.textContent = msg.role === "user" ? "You" : "Velma";
            item.appendChild(roleLabel);

            var textEl = document.createElement("p");
            textEl.className = "pinned-text";
            textEl.textContent = text.length > 200 ? text.substring(0, 200) + "..." : text;
            item.appendChild(textEl);

            pinnedList.appendChild(item);
        }
    }

    // ============================================================
    // Fullscreen
    // ============================================================

    function toggleFullscreen() {
        isFullscreen = !isFullscreen;
        if (isFullscreen) {
            app.classList.add("fullscreen");
        } else {
            app.classList.remove("fullscreen");
        }
    }

    // ============================================================
    // Settings UI
    // ============================================================

    function updateSettingsUI() {
        // Accent color
        if (accentColorInput) accentColorInput.value = accentColor;

        // Font size label
        if (fontSizeLabel) {
            fontSizeLabel.textContent = fontSize.charAt(0).toUpperCase() + fontSize.slice(1);
        }

        // Max tokens
        if (maxTokensSlider) maxTokensSlider.value = maxTokens;
        if (maxTokensLabel) maxTokensLabel.textContent = maxTokens;

        // Particles toggle
        if (particlesToggle) {
            particlesToggle.textContent = particlesEnabled ? "On" : "Off";
            if (particlesEnabled) {
                particlesToggle.classList.add("active");
            } else {
                particlesToggle.classList.remove("active");
            }
        }

        // Auto-scroll toggle
        if (autoscrollToggle) {
            autoscrollToggle.textContent = autoScroll ? "On" : "Off";
            if (autoScroll) {
                autoscrollToggle.classList.add("active");
            } else {
                autoscrollToggle.classList.remove("active");
            }
        }

        // Sound toggle (settings)
        if (soundToggleSetting) {
            soundToggleSetting.textContent = soundEnabled ? "On" : "Off";
            if (soundEnabled) {
                soundToggleSetting.classList.add("active");
            } else {
                soundToggleSetting.classList.remove("active");
            }
        }
    }

    // ============================================================
    // Service Worker Registration (PWA)
    // ============================================================

    function registerServiceWorker() {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("sw.js").catch(function () {
                // Service worker registration failed silently
            });
        }
    }

    // ============================================================
    // Scroll to Bottom (respects autoScroll setting)
    // ============================================================

    function scrollToBottom() {
        if (!autoScroll) return;
        requestAnimationFrame(function () {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
    }

    // ============================================================
    // Simple Markdown Renderer
    // ============================================================

    function renderMarkdown(text) {
        var html = escapeHtml(text);

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
            .map(function (p) {
                p = p.trim();
                if (
                    !p ||
                    p.startsWith("<h") ||
                    p.startsWith("<ul") ||
                    p.startsWith("<pre")
                )
                    return p;
                return "<p>" + p + "</p>";
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
        var div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    // ---- Start ----
    init();
})();
