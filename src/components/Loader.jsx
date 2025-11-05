import React from 'react';

const Loader = () => {
  return (
    <div className="flex items-center justify-center space-x-2 animate-pulse">
      <div className="w-2 h-2 bg-accent-blue rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      <span className="ml-3 text-accent-blue-light font-medium">Generating Java test case...</span>
    </div>
  );
};

export default Loader;
