// Shown once, right before a Mock Interview starts. Lets the student pick
// the real domain to be quizzed on (AI/ML, Cloud, etc.) instead of relying
// only on keyword-extracted skills, which can come out too generic/thin
// for the AI question generator to know what domain to focus on.
import React, { useState } from 'react';
import { DOMAIN_OPTIONS } from './domains';

const DomainSelector = ({ onSelect, onCancel }) => {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [customDomain, setCustomDomain] = useState('');

  const handlePick = (domain) => {
    if (domain === 'Other') {
      setShowOtherInput(true);
      return;
    }
    onSelect(domain);
  };

  const submitCustomDomain = () => {
    if (customDomain.trim()) onSelect(customDomain.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-2">What should this interview focus on?</h2>
        <p className="text-sm text-gray-500 mb-6">
          Pick the domain closest to what you're preparing for — questions will be generated specifically for it.
        </p>

        {!showOtherInput ? (
          <div className="grid grid-cols-1 gap-2 mb-4">
            {DOMAIN_OPTIONS.map(domain => (
              <button
                key={domain}
                onClick={() => handlePick(domain)}
                className="text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-colors font-medium text-gray-800"
              >
                {domain}
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-4">
            <input
              type="text"
              autoFocus
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') submitCustomDomain(); }}
              placeholder="Type your domain, e.g. Robotics"
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-400 mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={submitCustomDomain}
                disabled={!customDomain.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-medium transition"
              >
                Continue
              </button>
              <button
                onClick={() => setShowOtherInput(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                Back
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onCancel}
          className="text-sm text-gray-400 hover:text-gray-600 mt-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DomainSelector;