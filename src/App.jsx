import React, { useState } from 'react';
import Loader from './components/Loader';
import ResultBox from './components/ResultBox';
import { supabase } from './lib/supabase';

function App() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    setResult(null);
    
    try {
      // Get Supabase URL from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not configured. Please check your .env file and restart the dev server.');
      }

      // Call Supabase Edge Function using fetch directly for better error handling
      const functionUrl = `${supabaseUrl}/functions/v1/clever-handler`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ description: input })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        if (response.status === 404) {
          throw new Error('Edge function "clever-handler" not found. Please make sure you have deployed the function in Supabase.');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.steps || !data.code) {
        throw new Error('Invalid response format from server. Please check the edge function.');
      }

      setResult({
        steps: data.steps,
        code: data.code
      });
    } catch (error) {
      console.error('Error generating test case:', error);
      alert(`Error: ${error.message || 'Failed to generate test case. Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInput('');
    setResult(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Header */}
      <header className="border-b border-dark-border">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-white to-accent-blue-light bg-clip-text text-transparent">
              Selenium AI Test Case Generator
            </span>
          </h1>
          <p className="text-gray-400 text-center text-lg max-w-2xl mx-auto">
            Generate Java Selenium test cases and implementation steps using Gemini AI.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Input Section */}
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
            <label htmlFor="test-description" className="block text-lg font-medium text-white mb-4">
              Describe your Java test scenario
            </label>
            <textarea
              id="test-description"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Test user login functionality with valid credentials using TestNG framework..."
              className="w-full h-32 bg-dark-bg border border-dark-border rounded-lg p-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent resize-none"
              disabled={isLoading}
            />
            
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                {input.length} characters
              </div>
              <div className="space-x-3">
                {result && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-blue-dark text-white font-medium rounded-lg hover:shadow-lg hover:shadow-accent-blue/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100"
                >
                  {isLoading ? 'Generating Java Test...' : 'Generate Java Test Case'}
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-dark-surface border border-dark-border rounded-lg p-8">
              <Loader />
            </div>
          )}

          {/* Results */}
          {result && !isLoading && (
            <ResultBox steps={result.steps} code={result.code} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center">
          <p className="text-gray-500 text-sm">
            Built by <span className="text-accent-blue-light">Nitin</span> ⚡
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
