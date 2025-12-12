import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppContextType, SavedContent, MemorizationState, SpellingPracticeList, ProofreadingPractice, ProofreadingAnswer } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [savedContents, setSavedContents] = useState<SavedContent[]>([]);
  const [spellingLists, setSpellingLists] = useState<SpellingPracticeList[]>([]);
  const [proofreadingPractices, setProofreadingPractices] = useState<ProofreadingPractice[]>([]);
  const [currentContent, setCurrentContent] = useState<MemorizationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLimit, setSaveLimit] = useState<number | null>(null);
  const [currentSaveCount, setCurrentSaveCount] = useState<number>(0);

  // 1. Fetch All Data on Load
  const fetchAllData = useCallback(async () => {
    if (!user) {
      setSavedContents([]);
      setSpellingLists([]);
      setProofreadingPractices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // A. Fetch Memorization Content
      const { data: memData, error: memError } = await supabase
        .from('saved_contents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!memError && memData) {
        const formattedMem = memData.map(item => ({
          id: item.id,
          title: item.title,
          originalText: item.original_text,
          selectedWordIndices: item.selected_word_indices,
          createdAt: new Date(item.created_at),
          isPublished: item.is_published,
          publicId: item.public_id
        }));
        setSavedContents(formattedMem);
        setCurrentSaveCount(formattedMem.length);
      }

      // B. Fetch Spelling Lists (ROBUST MODE: CHECKS BOTH TABLES)
      const allSpellingLists: SpellingPracticeList[] = [];

      // 1. Check the NEW table (spelling_practices)
      const { data: newSpellData } = await supabase
        .from('spelling_practices')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (newSpellData) {
        const formattedNew = newSpellData.map(item => ({
          id: item.id,
          title: item.title,
          words: item.words,
          createdAt: new Date(item.created_at)
        }));
        allSpellingLists.push(...formattedNew);
      }

      // 2. Check the OLD table (spelling_practice_lists) just in case
      const { data: oldSpellData } = await supabase
        .from('spelling_practice_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (oldSpellData) {
        const formattedOld = oldSpellData.map(item => ({
          id: item.id,
          title: item.title,
          words: item.words, // Note: old table uses JSONB for words
          createdAt: new Date(item.created_at)
        }));
        // Only add if not duplicate ID
        formattedOld.forEach(item => {
          if (!allSpellingLists.find(existing => existing.id === item.id)) {
            allSpellingLists.push(item);
          }
        });
      }

      setSpellingLists(allSpellingLists);

      // C. Fetch Proofreading Practices
      const { data: proofData, error: proofError } = await supabase
        .from('proofreading_practices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!proofError && proofData) {
        setProofreadingPractices(proofData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Trigger fetch when user changes
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- Actions ---

  const addSavedContent = async (content: Omit<SavedContent, 'id' | 'createdAt'>) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('saved_contents')
        .insert({
          user_id: user.id,
          title: content.title,
          original_text: content.originalText,
          selected_word_indices: content.selectedWordIndices
        });

      if (error) throw error;
      await fetchAllData(); 
      return true;
    } catch (e) {
      console.error('Error adding content:', e);
      return false;
    }
  };

  const deleteSavedContent = async (id: string) => {
    try {
      await supabase.from('saved_contents').delete().eq('id', id);
      setSavedContents(prev => prev.filter(item => item.id !== id));
      setCurrentSaveCount(prev => prev - 1);
    } catch (e) {
      console.error('Error deleting content:', e);
    }
  };

  const publishSavedContent = async (id: string) => {
    return null; 
  };

  const fetchPublicContent = async (publicId: string) => {
    return null;
  };

  const addSpellingList = async (title: string, words: string[]) => {
    if (!user) return false;
    try {
      // Always save to the NEW table
      const { error } = await supabase
        .from('spelling_practices')
        .insert({
          title,
          words,
          created_by: user.id
        });

      if (error) throw error;
      await fetchAllData(); 
      return true;
    } catch (e) {
      console.error('Error adding spelling list:', e);
      return false;
    }
  };

  const deleteSpellingList = async (id: string) => {
    try {
      // Try deleting from both tables to be safe
      await supabase.from('spelling_practices').delete().eq('id', id);
      await supabase.from('spelling_practice_lists').delete().eq('id', id);
      
      setSpellingLists(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error('Error deleting spelling list:', e);
    }
  };

  const addProofreadingPractice = async (title: string, sentences: string[], answers: ProofreadingAnswer[]) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('proofreading_practices')
        .insert({
          user_id: user.id,
          title,
          sentences,
          answers
        });

      if (error) throw error;
      await fetchAllData();
      return true;
    } catch (e) {
      console.error('Error adding proofreading:', e);
      return false;
    }
  };

  const deleteProofreadingPractice = async (id: string) => {
    try {
      await supabase.from('proofreading_practices').delete().eq('id', id);
      setProofreadingPractices(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error('Error deleting proofreading:', e);
    }
  };

  const value: AppContextType = {
    savedContents,
    addSavedContent,
    deleteSavedContent,
    publishSavedContent,
    fetchPublicContent,
    currentContent,
    setCurrentContent,
    loading,
    spellingLists,
    addSpellingList,
    deleteSpellingList,
    saveLimit,
    currentSaveCount,
    proofreadingPractices,
    addProofreadingPractice,
    deleteProofreadingPractice,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};