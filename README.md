# 🤖 AI-Form: Intelligent JotForm Automation Extension

<div align="center">

![JotForm Logo](public/jotformLogo.svg)

**AI-powered browser extension that automates form filling and interactions with JotForm using intelligent agents**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![WXT](https://img.shields.io/badge/WXT-FF6B35?style=for-the-badge&logo=webextension&logoColor=white)](https://wxt.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

## 🎯 Project Overview

AI-Form is a sophisticated browser extension that revolutionizes how users interact with JotForm by providing intelligent, AI-driven automation capabilities. Built on a modern tech stack with TypeScript and React, this extension bridges the gap between natural language commands and complex form operations through advanced AI reasoning and computer vision.

The project consists of two main components:
- **Frontend Extension** (this repository): Cross-browser extension with React UI and automation engine
- **[Backend AI Agent](https://github.com/kemalilketuna/jotform-rag-agent)**: Python-based RAG agent with LangGraph decision engine

## ✨ Features

### 🧠 **Intelligent Automation**
- **AI-Powered Decision Making**: Advanced reasoning engine that understands form context and user intent
- **Step-by-Step Execution**: Intelligent orchestration of complex form-filling workflows with up to configurable steps
- **Error Recovery**: Self-correcting automation that adapts to unexpected scenarios with retry mechanisms
- **Visual Understanding**: Screenshot analysis for enhanced form comprehension using GPT-4 Vision
- **Session Management**: Persistent automation sessions with state tracking and recovery

### 🎯 **Smart Form Interaction**
- **Natural Language Commands**: Describe what you want to accomplish in plain English
- **Dynamic Element Detection**: Advanced DOM analysis using CSS selectors, XPath, and AI-based recognition
- **Multi-Step Workflows**: Handle complex form sequences with conditional logic and user input prompts
- **Real-Time Feedback**: Visual cursor movement, audio feedback, and progress indicators
- **Action Queue System**: Systematic action execution with proper timing and safety guards

### 🎨 **User Experience**
- **Interactive Chat Interface**: Real-time communication with AI agent through expandable chatbox
- **Visual Feedback**: Animated cursor movements and element highlighting during automation
- **Audio Cues**: Keystroke sounds and interaction feedback for enhanced user experience
- **Progress Tracking**: Step-by-step progress updates and execution status monitoring
- **User Input Handling**: Dynamic prompts for user-specific information and decision points

### 🔧 **Technical Excellence**
- **Modern Tech Stack**: Built with TypeScript, React 19, and WXT framework
- **Cross-Browser Support**: Compatible with Chrome, Firefox, Safari, and Edge (Manifest V3/V2)
- **Modular Architecture**: Clean, maintainable codebase with dependency injection and service factory pattern
- **Comprehensive Error Handling**: Robust error boundaries, graceful degradation, and detailed logging
- **Performance Optimized**: Efficient DOM querying, requestIdleCallback usage, and minimal page impact

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **pnpm** package manager
- Modern browser (Chrome, Firefox, Safari, or Edge)
- Access to JotForm platform

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kemalilketuna/Jotform-Extension.git
   cd Jotform-Extension
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Configure your AI service API keys in .env
   ```

4. **Build the extension**
   ```bash
   pnpm build
   ```

5. **Load in browser**
   - **Chrome/Edge**: Navigate to `chrome://extensions/`, enable Developer mode, click "Load unpacked", select the `dist` folder
   - **Firefox**: Navigate to `about:debugging`, click "This Firefox", click "Load Temporary Add-on", select any file in the `dist` folder

## 🎮 Usage

### Basic Commands

1. **Click the extension icon** in your browser toolbar
2. **Enter natural language commands** like:
   - *"Fill out this contact form with my information"*
   - *"Create a new survey form with 5 questions"*
   - *"Submit this registration form"*
3. **Watch the AI work** as it intelligently navigates and fills forms
4. **Provide feedback** when prompted for user-specific decisions

### Advanced Features

- **Interactive Chat**: Real-time communication with the AI agent through expandable chatbox interface
- **Step-by-Step Mode**: Review each action before execution with detailed progress tracking
- **Visual Feedback**: Animated cursor movements showing exactly where the AI is interacting
- **Audio Cues**: Keystroke sounds and interaction feedback for enhanced user experience
- **Session Persistence**: Resume automation sessions across browser restarts
- **User Input Prompts**: AI requests clarification when needed for personalized form filling
- **Error Recovery**: Automatic retry mechanisms and fallback strategies for failed actions

## 🏗️ Architecture

### Core Components

```
src/
├── entrypoints/          # Browser extension entry points
│   ├── background/       # Service worker with automation coordination
│   ├── content/          # Page injection scripts and DOM interaction
│   └── popup/            # Extension popup UI with React components
├── services/             # Core business logic services
│   ├── AutomationEngine/ # AI automation orchestration and execution
│   ├── APIService/       # Backend communication with RAG agent
│   ├── ActionsService/   # Form interaction actions (click, type, navigate)
│   ├── DOMDetectionService/ # Advanced element detection and analysis
│   ├── VisualCursorService/ # Animated cursor and visual feedback
│   ├── TypingService/    # Human-like typing simulation
│   ├── AudioService/     # Sound effects and feedback
│   └── ComponentService/ # React component lifecycle management
├── components/           # React UI components
│   ├── AiTextFieldComponent/ # Natural language input interface
│   ├── ChatboxComponent/     # Interactive AI communication
│   ├── AutomationController/ # Automation control buttons
│   └── StatusMessage/        # Real-time status updates
├── config/               # Configuration management
├── events/               # Event bus system for inter-component communication
└── utils/                # Shared utilities and helpers
```

### Automation Flow

1. **User Input**: Natural language command entered through popup interface
2. **Session Initialization**: Backend API creates automation session with unique ID
3. **DOM Analysis**: Extension captures page screenshot and analyzes visible elements
4. **AI Decision**: Backend RAG agent processes context and determines next actions
5. **Action Execution**: Extension performs actions (click, type, navigate, wait)
6. **Feedback Loop**: Results sent back to AI for next step planning
7. **Completion**: Session ends when objective is achieved or user stops automation

### Technology Stack

- **🎯 Frontend**: React 19 with TypeScript and Tailwind CSS
- **🔧 Build Tool**: WXT framework for cross-browser extension development
- **🤖 AI Backend**: Integration with [JotForm RAG Agent](https://github.com/kemalilketuna/jotform-rag-agent)
- **📱 UI Framework**: JotForm CSS components and SVG icons
- **🎨 Styling**: Tailwind CSS with custom Inter font integration

## 🔗 Related Projects

This extension works in conjunction with the **[JotForm RAG Agent](https://github.com/kemalilketuna/jotform-rag-agent)** backend service, which provides:

- **🧠 AI Decision Engine**: LangGraph-powered reasoning and planning
- **👁️ Vision Capabilities**: GPT-4 Vision for screenshot analysis  
- **📚 Knowledge Base**: RAG-powered JotForm documentation integration
- **🔄 Self-Correction**: Adaptive error recovery and replanning

## 🛠️ Development

### Development Setup

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format

# Type checking
pnpm compile
```

### Browser-Specific Development

```bash
# Firefox development
pnpm dev:firefox
pnpm build:firefox

# Create distribution packages
pnpm zip
pnpm zip:firefox
```

### Code Quality

- **ESLint** with TypeScript and React rules
- **Prettier** for consistent code formatting
- **Strict TypeScript** configuration
- **Automated testing** setup ready

## 🔒 Security & Privacy

- **Minimal Permissions**: Only requests necessary browser permissions
- **Content Security Policy**: Strict CSP to prevent XSS attacks
- **Local Processing**: Form data processed locally when possible
- **Secure Communication**: Encrypted communication with backend services

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **JotForm Team** for the excellent form platform and design system
- **WXT Framework** for simplifying cross-browser extension development
- **OpenAI** for powering the intelligent automation capabilities

---

<div align="center">

**Built with ❤️ for the JotForm community**

[Report Bug](https://github.com/kemalilketuna/Jotform-Extension/issues) • [Request Feature](https://github.com/kemalilketuna/Jotform-Extension/issues) • [Documentation](https://github.com/kemalilketuna/Jotform-Extension/wiki)

</div>