# Velma AI

A personal AI chatbot website powered by Claude. Deploy it to GitHub Pages for free and let visitors chat with an AI that represents you — your projects, your interests, your personality.

## How It Works

- **Static site** — plain HTML, CSS, and JavaScript. No frameworks, no build step.
- **Runs on GitHub Pages** (free) or any static file host.
- Visitors provide their own [Anthropic API key](https://console.anthropic.com/) to chat. The key is stored only in their browser's localStorage and sent directly to Anthropic — never to any other server.
- The chatbot's personality, knowledge, and displayed info are all configured in a single file: `profile.js`.

## Quick Start

### 1. Fork or Clone

```bash
git clone https://github.com/Jluethke/Velma-AI.git
cd Velma-AI
```

### 2. Customize Your Profile

Open `profile.js` and edit it to match your info:

- **name** — your display name
- **aboutText** — sidebar description
- **projects** — list of your projects (name, URL, description)
- **quickPrompts** — suggested conversation starters
- **systemPrompt** — the core instructions that tell Claude who you are, what you work on, and how to respond

The system prompt is the most important part. Add details about yourself, your experience, your projects, and anything else you want the chatbot to know.

### 3. Deploy to GitHub Pages

1. Push your changes to the `main` branch
2. Go to your repo **Settings > Pages**
3. Under "Source", select **Deploy from a branch**
4. Choose `main` branch, `/ (root)` folder
5. Click **Save**

Your site will be live at `https://<your-username>.github.io/Velma-AI/` within a few minutes.

### 4. Chat

Visit your site, enter an Anthropic API key, and start chatting.

## File Structure

```
index.html   — Main page structure
style.css    — All styling (dark theme)
profile.js   — Your personal config (name, projects, system prompt)
script.js    — Chat logic and API integration
```

## Customization

### Change the AI's personality

Edit the `systemPrompt` field in `profile.js`. This is a standard Claude system prompt — you can make it as detailed as you want.

### Change the model

Edit the `model` field in `profile.js`. Options include `claude-sonnet-4-20250514`, `claude-haiku-4-20250414`, etc.

### Change the look

Edit `style.css`. The design uses CSS custom properties (variables) at the top of the file, making it straightforward to change colors, fonts, and spacing.

## API Key Security

- The API key is entered by the visitor and stored in their browser's `localStorage`
- It is only sent to `https://api.anthropic.com` — nowhere else
- No server-side code, no analytics, no tracking
- Visitors can clear their key at any time via the "Change API Key" button

## License

MIT
