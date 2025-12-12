import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useAppContext } from './context/AppContext';
import Navigation from './components/Navigation/Navigation';
import TextInput from './components/TextInput/TextInput';
import WordSelection from './components/WordSelection/WordSelection';
import MemorizationView from './components/MemorizationView/MemorizationView';
import SavedContent from './components/SavedContent/SavedContent';
import ProofreadingInput from './components/ProofreadingInput/ProofreadingInput';
import ProofreadingAnswerSetting from './components/ProofreadingAnswerSetting/ProofreadingAnswerSetting';
import ProofreadingPreview from './components/ProofreadingPreview/ProofreadingPreview';
import ProofreadingPracticeComponent from './components/ProofreadingPractice/ProofreadingPractice';
import SpellingInput from './components/SpellingInput/SpellingInput';
import SpellingPreview from './components/SpellingPreview/SpellingPreview';
import SpellingPractice from './components/SpellingPractice/SpellingPractice';
import SavedPractices from './components/SavedPractices/SavedPractices';
import SavedProofreadingPractices from './components/SavedProofreadingPractices/SavedProofreadingPractices';
import ProofreadingAssignment from './components/ProofreadingAssignment/ProofreadingAssignment';
import AssignedProofreadingPractices from './components/AssignedProofreadingPractices/AssignedProofreadingPractices';
import AssignedMemorizations from './components/AssignedMemorizations/AssignedMemorizations';
import AssignmentManagement from './components/AssignmentManagement/AssignmentManagement';
import { Login } from './components/Auth/Login';
import AdminPanel from './components/AdminPanel/AdminPanel';
import { ContentDatabase } from './components/ContentDatabase/ContentDatabase';
import SourceInspector from './components/SourceInspector/SourceInspector';
import StudentProgress from './components/StudentProgress/StudentProgress';
import UnifiedAssignments from './components/UnifiedAssignments/UnifiedAssignments';
import UserAnalytics from './components/UserAnalytics/UserAnalytics';

import { Word, MemorizationState, ProofreadingPractice, ProofreadingAnswer, AssignedProofreadingPracticeContent, AssignedMemorizationContent } from './types';

// Wrapper component to handle the main app logic
function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { 
    currentContent, 
    setCurrentContent, 
    spellingLists, 
    addSpellingList, 
    proofreadingPractices,
    deleteProofreadingPractice 
  } = useAppContext();

  // State
  const [currentPage, setCurrentPage] = useState<'new' | 'saved' | 'admin' | 'database' | 'proofreading' | 'spelling' | 'progress' | 'assignments' | 'assignmentManagement' | 'proofreadingAssignments'>('new');
  
  // Memorization State
  const [memorizationStep, setMemorizationStep] = useState<'input' | 'selection' | 'view'>('input');
  const [textInput, setTextInput] = useState('');
  const [words, setWords] = useState<Word[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  
  // Spelling State
  const [spellingStep, setSpellingStep] = useState<'input' | 'preview' | 'practice' | 'list'>('list');
  const [currentSpellingPractice, setCurrentSpellingPractice] = useState<{title: string, words: string[]}>({ title: '', words: [] });
  const [selectedSpellingPractice, setSelectedSpellingPractice] = useState<any>(null);

  // Proofreading State
  const [proofreadingStep, setProofreadingStep] = useState<'input' | 'answers' | 'preview' | 'practice' | 'list'>('list');
  const [proofreadingSentences, setProofreadingSentences] = useState<string[]>([]);
  const [proofreadingAnswers, setProofreadingAnswers] = useState<ProofreadingAnswer[]>([]);
  const [selectedProofreadingPractice, setSelectedProofreadingPractice] = useState<ProofreadingPractice | null>(null);
  const [assignedProofreadingPractice, setAssignedProofreadingPractice] = useState<AssignedProofreadingPracticeContent | null>(null);
  
  // Assignment State
  const [selectedAssignment, setSelectedAssignment] = useState<AssignedMemorizationContent | null>(null);

  // Handle loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-600">Loading Application...</div>
      </div>
    );
  }

  // Handle unauthenticated state
  if (!user) {
    return <Login />;
  }

  // Navigation Handlers
  const handlePageChange = (page: typeof currentPage) => {
    setCurrentPage(page);
    // Reset steps when changing main sections
    if (page === 'new') {
      setMemorizationStep('input');
      setCurrentContent(null);
    }
    if (page === 'spelling') setSpellingStep('list');
    if (page === 'proofreading') setProofreadingStep('list');
    
    setSelectedAssignment(null);
    setAssignedProofreadingPractice(null);
  };

  // --- MEMORIZATION HANDLERS ---
  const handleTextInput = (text: string) => {
    setTextInput(text);
    setMemorizationStep('selection');
  };

  const handleWordSelection = (selectedWords: Word[], indices: number[]) => {
    setWords(selectedWords);
    setSelectedIndices(indices);
    setMemorizationStep('view');
  };

  const handleLoadContent = (content: MemorizationState) => {
    setTextInput(content.originalText);
    setWords(content.words);
    setSelectedIndices(content.selectedWordIndices);
    setCurrentContent(content);
    setCurrentPage('new');
    setMemorizationStep('view');
  };

  // --- SPELLING HANDLERS ---
  const handleSpellingInput = (title: string, words: string[]) => {
    setCurrentSpellingPractice({ title, words });
    setSpellingStep('preview');
  };

  const handleSpellingSave = async () => {
    const success = await addSpellingList(currentSpellingPractice.title, currentSpellingPractice.words);
    if (success) {
      setSpellingStep('list');
    }
  };

  // FIX: New handler to start practice from preview immediately
  const handleSpellingStartFromPreview = () => {
    // Set the selected practice to the current temporary data
    setSelectedSpellingPractice({
      id: undefined, // ID is undefined for unsaved practice
      title: currentSpellingPractice.title,
      words: currentSpellingPractice.words
    });
    setSpellingStep('practice');
  };

  // --- PROOFREADING HANDLERS ---
  const handleProofreadingInput = (sentences: string[]) => {
    setProofreadingSentences(sentences);
    setProofreadingStep('answers');
  };

  const handleProofreadingAnswers = (answers: ProofreadingAnswer[]) => {
    setProofreadingAnswers(answers);
    setProofreadingStep('preview');
  };

  const handleProofreadingSave = async () => {
    setProofreadingStep('list');
  };

  // Render logic based on state
  const renderCurrentView = () => {
    // 1. ADMIN & DATABASE
    if (currentPage === 'admin') return <AdminPanel />;
    if (currentPage === 'database') return <ContentDatabase />;
    
    // 2. ASSIGNMENT MANAGEMENT (Admin View)
    if (currentPage === 'assignmentManagement') return <AssignmentManagement />;

    // 3. PROGRESS & ANALYTICS
    if (currentPage === 'progress') return <StudentProgress />;

    // 4. UNIFIED ASSIGNMENTS (MY LEARNING)
    if (currentPage === 'assignments') {
      if (selectedAssignment) {
         return (
          <MemorizationView
            words={[]} 
            selectedIndices={selectedAssignment.selected_word_indices}
            originalText={selectedAssignment.original_text}
            onBack={() => {
              setSelectedAssignment(null);
              setCurrentPage('assignments');
            }}
            onSave={() => {}}
            onViewSaved={() => setCurrentPage('saved')}
            assignmentId={selectedAssignment.id}
          />
        );
      }
      return <UnifiedAssignments 
          onLoadMemorization={(c) => {
             const content: any = {
                originalText: c.original_text,
                selectedWordIndices: c.selected_word_indices,
                words: []
             };
             setSelectedAssignment(c as any);
          }}
          onLoadSpelling={(p) => {
            setSelectedSpellingPractice(p);
            setCurrentPage('spelling');
            setSpellingStep('practice');
          }}
          onLoadProofreading={(p) => {
             setAssignedProofreadingPractice(p);
             setCurrentPage('proofreadingAssignments');
          }}
        />;
    }

    // 5. SAVED MEMORIZATION PRACTICES
    if (currentPage === 'saved') {
      if (currentContent) {
        return (
          <MemorizationView
            words={words}
            selectedIndices={selectedIndices}
            originalText={textInput}
            onBack={() => {
              setCurrentContent(null);
            }}
            onSave={() => {}}
            onViewSaved={() => setCurrentPage('saved')}
          />
        );
      }
      return <SavedContent onLoadContent={handleLoadContent} onCreateNew={() => setCurrentPage('new')} />;
    }

    // 6. NEW MEMORIZATION (CREATE)
    if (currentPage === 'new') {
      if (memorizationStep === 'view') {
        return (
          <MemorizationView
            words={words}
            selectedIndices={selectedIndices}
            originalText={textInput}
            onBack={() => {
              if (currentContent) {
                setCurrentContent(null);
                setCurrentPage('saved');
              } else {
                setMemorizationStep('selection');
              }
            }}
            onSave={() => {}}
            onViewSaved={() => setCurrentPage('saved')}
          />
        );
      }
      if (memorizationStep === 'selection') {
        return (
          <WordSelection
            text={textInput}
            onNext={handleWordSelection}
            onBack={() => setMemorizationStep('input')}
          />
        );
      }
      return <TextInput onNext={handleTextInput} />;
    }

    // 7. PROOFREADING FLOW
    if (currentPage === 'proofreading') {
      if (proofreadingStep === 'list') {
        return (
          <SavedProofreadingPractices
            practices={proofreadingPractices}
            onCreateNew={() => setProofreadingStep('input')}
            onSelectPractice={(practice) => {
              setSelectedProofreadingPractice(practice);
              setProofreadingStep('practice');
            }}
            onAssignPractice={(practice) => {}}
            onDeletePractice={deleteProofreadingPractice}
          />
        );
      }
      if (proofreadingStep === 'input') return <ProofreadingInput onNext={handleProofreadingInput} />;
      if (proofreadingStep === 'answers') {
        return (
          <ProofreadingAnswerSetting
            sentences={proofreadingSentences}
            onNext={handleProofreadingAnswers}
            onBack={() => setProofreadingStep('input')}
          />
        );
      }
      if (proofreadingStep === 'preview') {
        return (
          <ProofreadingPreview
            sentences={proofreadingSentences}
            answers={proofreadingAnswers}
            onNext={handleProofreadingSave}
            onBack={() => setProofreadingStep('answers')}
          />
        );
      }
      if (proofreadingStep === 'practice' && selectedProofreadingPractice) {
        return (
          <ProofreadingPracticeComponent
            sentences={selectedProofreadingPractice.sentences}
            answers={selectedProofreadingPractice.answers}
            onBack={() => setProofreadingStep('list')}
            practiceId={selectedProofreadingPractice.id}
          />
        );
      }
    }

    // 8. PROOFREADING ASSIGNMENTS
    if (currentPage === 'proofreadingAssignments') {
      if (assignedProofreadingPractice) {
        return (
          <ProofreadingPracticeComponent
            sentences={assignedProofreadingPractice.sentences}
            answers={assignedProofreadingPractice.answers}
            onBack={() => setAssignedProofreadingPractice(null)}
            assignmentId={assignedProofreadingPractice.id}
          />
        );
      }
      return <AssignedProofreadingPractices onLoadContent={setAssignedProofreadingPractice} />;
    }

    // 9. SPELLING FLOW (Fixed)
    if (currentPage === 'spelling') {
      if (spellingStep === 'list') {
        return (
          <SavedPractices
            onCreateNew={() => setSpellingStep('input')}
            onSelectPractice={(practice) => {
              setSelectedSpellingPractice(practice);
              setSpellingStep('practice');
            }}
          />
        );
      }
      if (spellingStep === 'input') {
        return (
          <SpellingInput 
             onNext={(title, words) => {
               setCurrentSpellingPractice({ title, words });
               setSpellingStep('preview');
             }} 
             onBack={() => setSpellingStep('list')}
          />
        );
      }
      if (spellingStep === 'preview') {
        return (
          <SpellingPreview
            title={currentSpellingPractice.title}
            words={currentSpellingPractice.words}
            onNext={handleSpellingStartFromPreview} // <--- CORRECTED HERE
            onSave={handleSpellingSave} // <--- Added explicitly
            onBack={() => setSpellingStep('input')}
          />
        );
      }
      if (spellingStep === 'practice' && selectedSpellingPractice) {
        return (
          <SpellingPractice
            title={selectedSpellingPractice.title}
            words={selectedSpellingPractice.words}
            onBack={() => setSpellingStep('list')}
            practiceId={selectedSpellingPractice.id}
          />
        );
      }
    }

    return <div>Page under construction: {currentPage}</div>;
  };

  return (
    <>
      <Navigation
        currentPage={currentPage}
        onPageChange={handlePageChange}
        userRole={user?.role || null}
      />
      <div className="ml-64">
        {renderCurrentView()}
      </div>
      <SourceInspector />
    </>
  );
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;