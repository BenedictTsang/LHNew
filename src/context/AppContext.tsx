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

      // B. Fetch Spelling Lists (CHECKS BOTH OLD AND NEW TABLES)
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

      // 2. Check the OLD table (spelling_practice_lists) - JUST IN CASE
      const { data: oldSpellData } = await supabase
        .from('spelling_practice_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (oldSpellData) {
        const formattedOld = oldSpellData.map(item => ({
          id: item.id,
          title: item.title,
          words: item.words, 
          createdAt: new Date(item.created_at)
        }));
        // Add only if not already present (avoid duplicates)
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
          title: