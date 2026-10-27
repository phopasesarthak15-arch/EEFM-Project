import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../types';
import { api } from '../services/api';

interface AppContextType {
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (m: number) => void;
  setSelectedYear: (y: number) => void;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  refreshCount: number;
  triggerRefresh: () => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  budgetAlertsCount: number;
  setBudgetAlertsCount: (cnt: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [budgetAlertsCount, setBudgetAlertsCount] = useState<number>(0);

  const triggerRefresh = () => setRefreshCount(prev => prev + 1);

  const refreshProfile = async () => {
    try {
      const p = await api.getProfile();
      setProfile(p);
      if (!p.is_onboarded) {
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  return (
    <AppContext.Provider
      value={{
        selectedMonth,
        selectedYear,
        setSelectedMonth,
        setSelectedYear,
        profile,
        refreshProfile,
        refreshCount,
        triggerRefresh,
        showOnboarding,
        setShowOnboarding,
        budgetAlertsCount,
        setBudgetAlertsCount
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
