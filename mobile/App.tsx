import "./global.css";
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/stores/authStore';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { AddTransactionScreen } from './src/screens/AddTransactionScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { SimulatorScreen } from './src/screens/SimulatorScreen';
import { SavingsGoalsScreen } from './src/screens/SavingsGoalsScreen';
import { GoalDetailScreen } from './src/screens/GoalDetailScreen';
import { BottomNav } from './src/components/BottomNav';
import { CustomAlert } from './src/components/CustomAlert';
import { SavingsGoal } from './src/types';

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [activeGoal, setActiveGoal] = useState<SavingsGoal | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-[#0f131e]">
        <StatusBar style="light" />

        {/* Screen Views */}
        {isLoading && (
          <View className="flex-1 bg-[#0f131e] items-center justify-center">
            <ActivityIndicator size="large" color="#10e57a" />
          </View>
        )}

        {!isLoading && !isAuthenticated && <AuthScreen />}

        {!isLoading && isAuthenticated && (
          <>
            {currentTab === 'home' && (
              <HomeScreen onNavigate={(screen) => setCurrentTab(screen)} />
            )}

            {currentTab === 'transactions' && <TransactionsScreen />}

            {currentTab === 'add-transaction' && (
              <AddTransactionScreen onBack={() => setCurrentTab('home')} />
            )}

            {currentTab === 'reports' && <ReportsScreen />}

            {currentTab === 'simulator' && <SimulatorScreen />}

            {currentTab === 'savings-goals' && (
              <SavingsGoalsScreen
                onSelectGoal={(goal) => {
                  setActiveGoal(goal);
                  setCurrentTab('goal-detail');
                }}
              />
            )}

            {currentTab === 'goal-detail' && activeGoal && (
              <GoalDetailScreen
                goal={activeGoal}
                onBack={() => {
                  setActiveGoal(null);
                  setCurrentTab('savings-goals');
                }}
              />
            )}

            {/* Bottom Navigation */}
            {currentTab !== 'add-transaction' && currentTab !== 'goal-detail' && (
              <BottomNav
                currentTab={currentTab}
                onSelectTab={(tab) => setCurrentTab(tab)}
              />
            )}
          </>
        )}

        {/* Global Themed Custom Alert */}
        <CustomAlert />
      </View>
    </SafeAreaProvider>
  );
}
