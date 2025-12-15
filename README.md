# PromptForge AI Studio ⚒️

![Status](https://img.shields.io/badge/Status-Active-success)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)
![License](https://img.shields.io/badge/License-MIT-green)

**PromptForge** is an advanced AI Prompt Engineering Studio designed to bridge the gap between abstract agent design and concrete execution. It features a robust Python-powered backend using FastAPI and Jinja2 templates for a streamlined, unified experience.

## 🚀 Key Features

*   **Multi-Agent Orchestration**: Build, test, and deploy complex agent swarms.
*   **Visual Workflow Builder**: Create n8n-style automation workflows powered by LLMs.
*   **Browser Automation**: Natural language to browser action execution.
*   **Prompt Optimization**: Auto-optimize prompts using genetic algorithms and RL.
*   **Unified Interface**:
    *   **Studio UI**: For deep engineering and prompt refinement.
    *   **Agent Builder**: Conversational interface for creating agents.
    *   **Workflow Studio**: Visual tool for automation flows.

## 🏗️ Architecture

PromptForge uses a pure Python architecture for maximum power and flexibility:

```mermaid
graph TD
    subgraph "Application Layer (Python/FastAPI)"
        A["Unified Server"] --> B["Jinja2 Templates (UI)"]
        A --> C["API Endpoints"]
        C --> D["Agent Engine"]
        C --> E["Local LLM Service"]
        C --> F["Browser Automation"]
    end

    subgraph "External Services"
        E --> H["Gemini API"]
        E --> I["Ollama / Local"]
    end
```

## 🛠️ Technology Stack

*   **Python 3.10+**: Core logic and orchestration.
*   **FastAPI**: High-performance web framework.
*   **Jinja2**: Server-side template rendering for UI.
*   **Google Gemini**: Primary LLM provider (via `gemini-2.0-flash-exp`).
*   **Pydantic**: Data validation and schema definition.
*   **React (Optional)**: Converted frontend components available in `frontend/`.

## 🏁 Getting Started

### Prerequisites
*   Python 3.10 or higher
*   Git

### 1. Clone & Configure
```bash
git clone https://github.com/planksconstant-arch/PromptForge.git
cd PromptForge
```

### 1. Setup & Run
```bash
# Install dependencies
pip install -r yaprompt_python/requirements.txt

# Run the Application Server
python -m yaprompt_python.main
```

### 2. Access the Application
Once the server is running, access the tools at:
*   **📊 Dashboard**: [http://localhost:8000/](http://localhost:8000/)
*   **🪄 Prompt Studio**: [http://localhost:8000/studio](http://localhost:8000/studio)


## 🔧 Configuration

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_api_key_here
```

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a Pull Request.

---
*Built with ❤️ by the PromptForge Team*
