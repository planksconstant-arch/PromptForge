# ⚡ Yaprompt - AI Prompt Engineering Studio

> Your Personal AI Brain - A Chrome extension for intelligent prompt optimization with adaptive learning

![Yaprompt Banner](public/icons/icon128.png)

## 🌟 Features

### Core Capabilities

- **🧠 Adaptive RL-Based Optimization**: Two-stage prompt enhancement combining local reinforcement learning with cloud AI refinement
- **📊 Style Learning**: Automatically learns your writing style from text selections across the web
- **✨ LLM Auto-Fill**: Detects and enhances prompts directly in ChatGPT, Claude, and other LLM interfaces
- **🎯 Context-Aware**: Integrates current webpage context into prompt optimization
- **🔐 Privacy-First**: Built-in privacy guards prevent interaction with password fields and sensitive data

### Intelligence Features

- **🧩 Neural Memory System**: Stores and retrieves relevant past interactions
- **🛠️ Skill Engine**: Natural language automation - "click Sign Up" or "type hello in search"
- **🤖 Agent Factory**: Detects repetitive tasks and suggests automation agents
- **📈 Brain Visualization**: Real-time 3D visualization of your AI's learning progress
- **🎙️ Voice Input**: Speak your prompts naturally (coming soon)

### User Experience

- **⌨️ Keyboard Shortcuts**:
  - `Ctrl+Shift+O` / `Cmd+Shift+O` - Open optimizer
  - `Ctrl+Shift+S` / `Cmd+Shift+S` - Scan selected text
- **🎨 Beautiful UI**: Modern gradient design with smooth animations
- **📱 Side Panel Support**: Works as popup or Chrome side panel
- **🔔 Smart Notifications**: Get feedback on learning progress and optimizations
- **⚙️ Easy Configuration**: Simple options page for API key setup

## 🚀 Quick Start

### Installation

1. **Build the extension:**
   ```bash
   npm install
   npm run build:extension
   ```

2. **Load in Chrome:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

3. **Configure API Key:**
   - Click the extension icon
   - Click "Open Settings"
   - Enter your [Gemini API key](https://aistudio.google.com/app/apikey)
   - Save!

📖 For detailed instructions, see [INSTALL.md](INSTALL.md)

## 💡 How It Works

### Two-Stage Optimization Pipeline

1. **Stage 1: Local RL Agent**
   - Applies learned templates based on target LLM
   - Incorporates your personal writing style
   - Adds context from current webpage
   - Uses neural memory for relevant past examples
   - Ultra-fast, runs entirely locally

2. **Stage 2: Cloud AI Refinement**
   - Powered by Gemini 2.5 Flash
   - Semantic enhancement and fact-checking
   - Adds domain-specific examples
   - Provides detailed critique with scores
   - Returns production-ready prompts

### Style Learning System

The extension learns from text you select across the web:

- **Formality**: Casual ↔ Professional
- **Verbosity**: Concise ↔ Detailed
- **Complexity**: Simple ↔ Technical

Uses adaptive learning rate with Flesch-Kincaid readability analysis.

## 🎯 Usage Examples

### Basic Prompt Optimization

1. Click the extension icon
2. Enter your prompt: `"write code to sort array"`
3. Select target model (e.g., Claude)
4. Choose goal (e.g., "Code Generation")
5. Click "Optimize"
6. Get enhanced prompt with explanation!

### Style Learning

1. Navigate to any article or document
2. Select a paragraph that matches your desired style
3. Right-click → "Scan Text for Style Analysis"
4. The AI learns and adapts to your preferences

### LLM Auto-Fill

1. Go to ChatGPT or Claude
2. Start typing a prompt
3. Click the "✨ Optimize" button that appears
4. Your prompt gets enhanced automatically!

### Natural Language Automation

Type commands like:
- `"click Sign Up button"`
- `"type my email in search box"`
- `"scroll to bottom"`

The Skill Engine interprets and executes them safely.

## 📁 Project Structure

```
yaprompt/
├── public/
│   ├── manifest.json      # Extension configuration
│   ├── background.js       # Service worker
│   ├── content.js         # Page interaction script
│   ├── options.html/js    # Settings page
│   └── icons/             # Extension icons
├── components/            # React UI components
│   ├── BrainVisualizer.tsx
│   ├── ConfigPanel.tsx
│   ├── OutputPanel.tsx
│   ├── Scanner.tsx
│   └── AgentSuggestions.tsx
├── services/              # Core logic
│   ├── geminiService.ts   # API integration
│   ├── MemoryService.ts   # Neural memory
│   ├── SkillEngine.ts     # Automation engine
│   └── HistoryService.ts  # Action logging
├── lib/
│   └── PromptOptimizer.ts # RL agent
├── App.tsx                # Main application
├── index.tsx              # Entry point
└── vite.config.ts         # Build configuration
```

## 🔧 Development

### Prerequisites

- Node.js 16+ and npm
- Chrome/Chromium browser
- Gemini API key

### Development Workflow

1. **Start dev server:**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:3000` for quick UI testing

2. **Build for extension:**
   ```bash
   npm run build:extension
   ```

3. **Reload extension after changes:**
   - Go to `chrome://extensions/`
   - Click reload icon on Yaprompt

### Available Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Build with file copying
- `npm run build:extension` - Same as build
- `npm run preview` - Preview production build
- `npm run copy-files` - Copy public files to dist

## ��� API Configuration

### Getting Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIzaSy...`)
5. Paste into extension settings

### Privacy & Security

- ✅ API key stored locally (Chrome storage)
- ✅ Never transmitted except to Google AI API
- ✅ All data processing happens client-side
- ✅ No tracking or analytics
- ✅ Password field protection enabled
- ✅ Open source - audit the code yourself!

## 🛡️ Privacy Guards

The extension includes multiple safety layers:

- **Password Protection**: Never interacts with password input fields
- **Local Storage**: All personal data stays on your device
- **Secure Communication**: API calls use HTTPS only
- **Content Script Isolation**: Minimal page access
- **Permission Scoping**: Only requests necessary permissions

## 🎨 Customization

### Keyboard Shortcuts

Customize in `chrome://extensions/shortcuts`:
- Optimize Prompt
- Scan Selection

### Target Models

Supported LLMs:
- GPT-4 / ChatGPT
- Claude (Anthropic)
- Gemini
- Llama
- Mistral

### Optimization Goals

- Chain-of-Thought Reasoning
- Code Generation  
- Creative Writing
- Data Analysis
- Summarization
- Translation

## 🐛 Troubleshooting

### Common Issues

**Extension won't load:**
- Ensure you built with `npm run build:extension`
- Check for errors on `chrome://extensions/`

**API errors:**
- Verify API key is correct
- Check API quota in Google AI Studio
- Ensure stable internet connection

**Features not working:**
- Reload the webpage
- Disable conflicting extensions
- Check browser console (F12) for errors

See [INSTALL.md](INSTALL.md) for more troubleshooting tips.

## 🗺️ Roadmap

- [ ] Voice input support
- [ ] Multi-language support
- [ ] Export/import style profiles
- [ ] Collaborative prompt sharing
- [ ] Advanced agent scheduling
- [ ] Offline mode with local models
- [ ] Browser-wide sentiment analysis
- [ ] Custom skill creation UI

## 📄 License

This project is open source. See LICENSE file for details.

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📧 Support

- GitHub Issues: Report bugs and request features
- Discussions: Ask questions and share ideas
- Email: [Your contact]

## 🙏 Acknowledgments

- Built with React, Vite, and Framer Motion
- Powered by Google's Gemini API
- Icons and UI inspired by modern design trends
- Special thanks to the open-source community

---

**Made with ❤️ for the AI community**

⭐ Star this repo if you find it useful!
