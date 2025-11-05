import React from 'react';

const ResultBox = ({ steps, code }) => {
  return (
    <div className="animate-slide-up space-y-6">
      {/* Steps Section */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="w-2 h-2 bg-accent-blue rounded-full mr-3"></span>
          Test Steps
        </h3>
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-accent-blue text-white text-sm font-medium rounded-full flex items-center justify-center">
                {index + 1}
              </span>
              <span className="text-gray-300 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Code Section */}
      <div className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden">
        <div className="bg-dark-border px-4 py-2 border-b border-dark-border">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-400 text-sm ml-3">LoginTest.java</span>
          </div>
        </div>
        <pre className="p-6 overflow-x-auto">
          <code className="text-gray-300 font-mono text-sm leading-relaxed">
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default ResultBox;
