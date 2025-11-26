import React, { useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import ProofreadingTopNav from '../ProofreadingTopNav/ProofreadingTopNav';

interface ProofreadingInputProps {
  onNext: (sentences: string[]) => void;
  onViewSaved?: () => void;
  generateSentences?: (opts: {
    grammar: string;
    topic?: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    count?: number;
  }) => Promise<string[]>;
}

const ProofreadingInput: React.FC<ProofreadingInputProps> = ({ onNext, onViewSaved, generateSentences }) => {
  const [text, setText] = useState('');
  const [grammar, setGrammar] = useState('');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

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

  const defaultGenerate = async (opts: {
    grammar: string;
    topic?: string;
    level?: string;
    count?: number;
  }): Promise<string[]> => {
    // Default backend route - implement server side at /api/generate-sentences
    const res = await fetch('/api/generate-sentences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Server error while generating sentences');
    }
    const data = await res.json();
    // Expected response shape: { sentences: string[] }
    return Array.isArray(data.sentences) ? data.sentences : [];
  };

  const handleGenerate = async () => {
    if (!grammar.trim() && !topic.trim()) {
      // prevent generating completely blank prompts
      setGenerationError('Please provide target grammar items or a topic.');
      return;
    }

    setGenerating(true);
    setGenerationError(null);
    try {
      const opts = {
        grammar: grammar.trim(),
        topic: topic.trim() || undefined,
        level,
        count: Math.max(1, Math.min(20, Math.floor(count || 5))),
      };

      const sentences = await (generateSentences ? generateSentences(opts) : defaultGenerate(opts));
      if (sentences.length > 0) {
        setText(prev => (prev ? prev + '\n' + sentences.join('\n') : sentences.join('\n')));
        // focus the textarea and jump to bottom so user can see generated sentences
        setTimeout(() => textAreaRef.current?.focus(), 50);
      } else {
        setGenerationError('No sentences were returned from the generator.');
      }
    } catch (err: any) {
      setGenerationError(err?.message || 'Failed to generate sentences');
    } finally {
      setGenerating(false);
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

          {/* AI Generation UI */}
          <div className="mb-4 p-4 rounded border bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Target grammar items</label>
                <input
                  value={grammar}
                  onChange={(e) => setGrammar(e.target.value)}
                  placeholder="e.g., past simple verbs, subject-verb agreement"
                  className="mt-1 w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Topic (optional)</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., school, sports, food"
                  className="mt-1 w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Level & Count</label>
                <div className="flex gap-2 mt-1">
                  <select value={level} onChange={(e) => setLevel(e.target.value as any)} className="p-2 border rounded">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-20 p-2 border rounded"
                    aria-label="sentence count"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                {generating ? 'Generating…' : 'Generate sentences'}
              </button>
            </div>

            {generationError && (
              <p className="mt-2 text-red-600 text-sm">{generationError}</p>
            )}
          </div>

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
                ref={textAreaRef}
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
