import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import ProofreadingTopNav from '../ProofreadingTopNav/ProofreadingTopNav';

interface ProofreadingInputProps {
  onNext: (sentences: string[]) => void;
  onViewSaved?: () => void;
}

const ProofreadingInput: React.FC<ProofreadingInputProps> = ({ onNext, onViewSaved }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      const sentences = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (sentences.length > 0) {
        onNext(sentences);
      }
    }
  };

  const lineCount = text.split('\n').filter(line => line.trim().length > 0).length;

  return (
    <>
      {onViewSaved && (
        <ProofreadingTopNav
          onCreateNew={() => {}}
          onViewSaved={onViewSaved}
          currentView="create"
        />
      )}
      <div
        className="pt-20 min-h-screen bg-gray-50 pr-8"
        style={{ fontFamily: 'Times New Roman, serif' }}
        data-source-tsx="ProofreadingInput|src/components/ProofreadingInput/ProofreadingInput.tsx"
      >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1
            className="text-3xl font-bold text-gray-800 mb-6 text-center"
            data-source-tsx="ProofreadingInput Title|src/components/ProofreadingInput/ProofreadingInput.tsx"
          >
            Proofreading Exercise
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="sentences-input"
                className="block text-lg font-medium text-gray-700 mb-2"
                data-source-tsx="ProofreadingInput Label|src/components/ProofreadingInput/ProofreadingInput.tsx"
              >
                Enter sentences (one per line):
              </label>
              <textarea
                id="sentences-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-96 p-4 border-2 border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg leading-relaxed"
                placeholder="Enter your sentences here, one per line...&#10;&#10;Example:&#10;She don't like apples.&#10;He go to school everyday.&#10;They was playing football."
                style={{ fontFamily: 'Times New Roman, serif' }}
                data-source-tsx="ProofreadingInput Textarea|src/components/ProofreadingInput/ProofreadingInput.tsx"
              />
              <p className="mt-2 text-sm text-gray-600">
                Sentences: {lineCount}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!text.trim()}
                className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                data-source-tsx="ProofreadingInput Next Button|src/components/ProofreadingInput/ProofreadingInput.tsx"
              >
                <span>Next</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
};

export default ProofreadingInput;
