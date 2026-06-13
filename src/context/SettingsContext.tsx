import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

const DEFAULT_CATEGORIES = ['Food & Dining', 'Transportation', 'Office Supplies', 'Software', 'Travel', 'Other'];

export type ThemeType = 'light' | 'dark' | 'system';

interface SettingsContextType {
  currency: string;
  setCurrency: (c: string) => void;
  budgetLimit: number;
  setBudgetLimit: (b: number) => void;
  categories: string[];
  setCategories: (c: string[]) => void;
  addCategory: (c: string) => void;
  removeCategory: (c: string) => void;
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  isDarkMode: boolean;
  appLockEnabled: boolean;
  setAppLockEnabled: (e: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState('$');
  const [budgetLimit, setBudgetLimitState] = useState(0);
  const [categories, setCategoriesState] = useState<string[]>(DEFAULT_CATEGORIES);
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [appLockEnabled, setAppLockEnabledState] = useState(false);
  
  const [systemColorScheme, setSystemColorScheme] = useState(Appearance.getColorScheme());

  useEffect(() => {
    // Load from AsyncStorage
    const loadSettings = async () => {
      try {
        const c = await AsyncStorage.getItem('currency');
        if (c) setCurrencyState(c);
        
        const b = await AsyncStorage.getItem('budgetLimit');
        if (b) setBudgetLimitState(Number(b));
        
        const cats = await AsyncStorage.getItem('categories');
        if (cats) setCategoriesState(JSON.parse(cats));
        
        const t = await AsyncStorage.getItem('theme');
        if (t) setThemeState(t as ThemeType);
        
        const lock = await AsyncStorage.getItem('appLockEnabled');
        if (lock) setAppLockEnabledState(lock === 'true');
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    };
    
    loadSettings();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const setCurrency = async (c: string) => {
    setCurrencyState(c);
    await AsyncStorage.setItem('currency', c);
  };

  const setBudgetLimit = async (b: number) => {
    setBudgetLimitState(b);
    await AsyncStorage.setItem('budgetLimit', b.toString());
  };

  const setCategories = async (cats: string[]) => {
    setCategoriesState(cats);
    await AsyncStorage.setItem('categories', JSON.stringify(cats));
  };

  const addCategory = async (c: string) => {
    if (!categories.includes(c)) {
      const newCats = [...categories, c];
      await setCategories(newCats);
    }
  };

  const removeCategory = async (c: string) => {
    const newCats = categories.filter(cat => cat !== c);
    await setCategories(newCats);
  };

  const setTheme = async (t: ThemeType) => {
    setThemeState(t);
    await AsyncStorage.setItem('theme', t);
  };

  const setAppLockEnabled = async (enabled: boolean) => {
    setAppLockEnabledState(enabled);
    await AsyncStorage.setItem('appLockEnabled', enabled ? 'true' : 'false');
  };

  const isDarkMode = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  return (
    <SettingsContext.Provider value={{
      currency, setCurrency,
      budgetLimit, setBudgetLimit,
      categories, setCategories, addCategory, removeCategory,
      theme, setTheme, isDarkMode,
      appLockEnabled, setAppLockEnabled
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
