# Selenium Java Test Case Generator

A modern, dark-themed web application for generating Java Selenium test cases using Gemini AI. Built with React, Vite, and Tailwind CSS, designed to work with a Supabase backend.

## Features

- 🎨 **Modern Dark Theme**: Clean black and blue aesthetic inspired by VS Code and Vercel
- ⚡ **Fast & Responsive**: Built with Vite for lightning-fast development and builds
- ☕ **Java Focus**: Generate comprehensive Java Selenium test cases with TestNG framework
- 🤖 **Gemini AI Integration**: Powered by Google's Gemini AI for intelligent test generation
- 📱 **Mobile-Friendly**: Fully responsive design that works on all devices
- ✨ **Smooth Animations**: Beautiful transitions and loading states
- 🔧 **Syntax Highlighting**: Properly formatted Java code output
- 🗄️ **Supabase Ready**: Prepared for backend integration with Supabase

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (for API and database)
- **AI**: Google Gemini AI API
- **Fonts**: Inter (UI), Fira Code (code blocks)

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd selenium-ai-test-generator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. Enter a description of the Java test scenario you want to generate
2. Click "Generate Java Test Case" 
3. Wait for Gemini AI to process your request (simulated with a 2-second delay)
4. Review the generated test steps and Java code with TestNG framework
5. Use the "Reset" button to start over

## Backend Integration

The frontend is prepared for integration with a Supabase backend that will handle:

- **Gemini AI API calls** for test case generation
- **Database storage** for test case history
- **User authentication** (if needed)
- **API rate limiting** and error handling

### API Endpoint Structure

The frontend expects a POST request to `/api/generate-test` with:

```json
{
  "description": "Test user login functionality with valid credentials"
}
```

Expected response:
```json
{
  "steps": ["Step 1", "Step 2", "..."],
  "code": "import org.openqa.selenium...",
  "success": true
}
```

## Project Structure

```
src/
├── components/
│   ├── Loader.jsx          # Loading animation component
│   └── ResultBox.jsx       # Results display component
├── App.jsx                 # Main application component
├── main.jsx               # React entry point
└── index.css              # Global styles and Tailwind imports
```

## Customization

### Colors
The color scheme can be customized in `tailwind.config.js`:

```javascript
colors: {
  'dark-bg': '#0a0a0a',        // Main background
  'dark-surface': '#111111',   // Card backgrounds
  'accent-blue': '#3b82f6',    // Primary accent color
}
```

### Fonts
Code blocks use Fira Code monospace font. You can change this in `src/index.css`:

```css
code, pre {
  font-family: 'Your-Font-Name', monospace;
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
