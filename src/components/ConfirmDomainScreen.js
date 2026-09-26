import React, { useState } from 'react';
import { DOMAIN_OPTIONS } from './domains';

// Shown once, right after the voice interview report. Confirms the domain
// used for the live internship search, so a bad or empty voice transcript
// can never send the search to the wrong field — whatever the student
// confirms here always wins over the AI's guess.
const ConfirmDomainScreen = ({ guessedDomain, onConfirm }) => {
  const [showList, setShowList] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [customDomain, setCustomDomain] = useState('');

  const handlePick = (domain) => {
    if (domain === 'Other') {
      setShowOtherInput(true);
      return;
    }
    onConfirm(domain);
  };

  const submitCustomDomain = () => {
    if (customDomain.trim()) onConfirm(customDomain.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {!showList ? (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Based on what you said, we think you're interested in:
            </h2>
            <p className="text-2xl font-extrabold text-purple-700 my-4">{guessedDomain}</p>
            <p className="text-sm text-gray-500 mb-6">
              This is what we'll search internships for. You can change it if it's not right.
            </p>
            <button
              onClick={() => onConfirm(guessedDomain)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition mb-3"
            >
              Yes, that's right
            </button>
            <button
              onClick={() => setShowList(true)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Choose a different domain
            </button>
          </>
        ) : !showOtherInput ? (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-4 text-left">Pick your domain</h2>
            <div className="grid grid-cols-1 gap-2 text-left">
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
          </>
        ) : (
          <div className="text-left">
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
      </div>
    </div>
  );
};

export default ConfirmDomainScreen;