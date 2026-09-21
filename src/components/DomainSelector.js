// Shown once, right before a Mock Interview starts. Lets the student pick
// the real domain to be quizzed on (AI/ML, Cloud, etc.) instead of relying
// only on keyword-extracted skills, which can come out too generic/thin
// for the AI question generator to know what domain to focus on.
import React from 'react';

const DOMAINS = [
  'AI / Machine Learning',
  'Web Development',
  'Cloud Computing',
  'Cybersecurity',
  'Data Science',
  'App Development',
  'UI/UX Design',
  'Marketing'
];

const DomainSelector = ({ onSelect, onCancel }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-2">What should this interview focus on?</h2>
        <p className="text-sm text-gray-500 mb-6">
          Pick the domain closest to what you're preparing for — questions will be generated specifically for it.
        </p>
        <div className="grid grid-cols-1 gap-2 mb-4">
          {DOMAINS.map(domain => (
            <button
              key={domain}
              onClick={() => onSelect(domain)}
              className="text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-colors font-medium text-gray-800"
            >
              {domain}
            </button>
          ))}
        </div>
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