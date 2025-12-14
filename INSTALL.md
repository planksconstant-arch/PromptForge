# 🚀 Installation Guide - Yaprompt Chrome Extension

Follow these steps to install Yaprompt as a Chrome extension on your browser.

## Prerequisites

- Google Chrome (or Chromium-based browser like Edge, Brave, etc.)
- Node.js and npm installed (for building from source)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Step 1: Build the Extension

1. Open a terminal in the project directory
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build:extension
   ```

   This command will:
   - Compile the React app using Vite
   - Copy all necessary files to the `dist` folder
   - Create a production-ready extension package

4. Verify the build completed successfully. You should see a `dist` folder containing:
   - `index.html`
   - `manifest.json`
   - `background.js`
   - `content.js`
   - `options.html`
   - `options.js`
   - `icons/` folder
   - `assets/` folder (compiled JS and CSS)

## Step 2: Load the Extension in Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **"Load unpacked"**
5. Select the `dist` folder from your project directory
6. The Yaprompt extension should now appear in your extensions list! ✨

## Step 3: Configure Your API Key

1. Click the Yaprompt extension icon in your Chrome toolbar
2. Click **"Open Settings"** button in the warning banner
   - Or right-click the extension icon and select **"Options"**
3. Enter your Gemini API key
4. Click **"Save Settings"**
5. You're all set! The extension is now fully functional

## Step 4: Verify Installation

Test the following features to ensure everything works:

### ✅ Basic Functionality
- Click the extension icon to open the popup/sidepanel
- The brain visualization should animate
- No API key errors should appear (after configuration)

### ✅ Context Detection
- Visit any webpage
- The "ACTIVE CONTEXT" banner should show the page title

### ✅ Style Scanner
- Select any text on a webpage (at least 10 characters)
- A "🧠 Scan Style" button should appear
- Click it to analyze the text style

### ✅ LLM Auto-Fill
- Go to ChatGPT, Claude, or similar LLM interface
- Look for the "✨ Optimize" button near the text input
- Type a prompt and click "✨ Optimize" to enhance it

### ✅ Keyboard Shortcuts
- Press `Ctrl+Shift+O` (`Cmd+Shift+O` on Mac) to open the optimizer
- Press `Ctrl+Shift+S` (`Cmd+Shift+S` on Mac) to scan selected text

## Troubleshooting

### Extension doesn't load
- Make sure you built the extension (`npm run build:extension`)
- Verify the `dist` folder contains all required files
- Check the Chrome extensions page for error messages

### API errors
- Verify your API key is correct in settings
- Check that your API key starts with `AIzaSy`
- Ensure the key has API access enabled in Google AI Studio

### Content script not working
- Refresh the webpage after installing/updating the extension
- Check browser console for errors (F12)
- Ensure the page is not a restricted Chrome page (chrome://, chrome-extension://)

### Images/Icons not showing
- Verify the `icons` folder was copied to `dist/icons`
- Check the manifest.json paths are correct
- Try reloading the extension

## Updating the Extension

When you make changes to the code:

1. Run `npm run build:extension` again
2. Go to `chrome://extensions/`
3. Click the **reload icon** on the Yaprompt extension
4. Test your changes

## Uninstalling

1. Go to `chrome://extensions/`
2. Click **"Remove"** on the Yaprompt extension
3. All local data (API key, style preferences, history) will be deleted

## Next Steps

- Read the [README.md](README.md) for feature documentation
- Customize keyboard shortcuts in `chrome://extensions/shortcuts`
- Explore the Agent Factory and Skill Engine features
- Join our community for support and updates

---

**Need Help?** Check the GitHub issues or create a new one with your problem description.

Enjoy your AI-powered prompt engineering studio! 🎉
