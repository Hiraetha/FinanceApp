import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const insets = useSafeAreaInsets();

  // Android navigation bar (3-button: Triangle, Circle, Square) is ~48-54px high.
  // We take the max of insets.bottom and 52px on Android, plus 10px spacing,
  // ensuring the floating dock floats cleanly ABOVE the system buttons!
  const safeBottomOffset =
    Math.max(insets.bottom, Platform.OS === 'android' ? 52 : 16) + 10;

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: 'wallet-outline',
      activeIcon: 'wallet',
    },
    {
      id: 'transactions',
      label: 'Transfers',
      icon: 'swap-horizontal-outline',
      activeIcon: 'swap-horizontal',
    },
    {
      id: 'add-transaction',
      label: 'Add',
      icon: 'add',
      isAction: true,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'bar-chart-outline',
      activeIcon: 'bar-chart',
    },
    {
      id: 'savings-goals',
      label: 'Goals',
      icon: 'flag-outline',
      activeIcon: 'flag',
    },
  ];

  return (
    <View
      className="absolute left-4 right-4 z-50 pointer-events-box-none"
      pointerEvents="box-none"
      style={{ bottom: safeBottomOffset }}
    >
      <View
        className="border border-[#262a3a] rounded-full px-2 py-1.5 flex-row items-center justify-around"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.7,
          shadowRadius: 22,
          elevation: 16,
          backgroundColor: 'rgba(23, 28, 42, 0.96)',
        }}
      >
        {tabs.map((tab) => {
          const isActive =
            currentTab === tab.id ||
            (tab.id === 'savings-goals' && currentTab === 'simulator');

          if (tab.isAction) {
            return (
              <View
                key={tab.id}
                className="items-center justify-center -mt-8"
                style={{ width: 58 }}
              >
                <TouchableOpacity
                  onPress={() => onSelectTab(tab.id)}
                  activeOpacity={0.88}
                  className="rounded-full bg-[#10e57a] items-center justify-center border-4 border-[#0f131e]"
                  style={{
                    width: 52,
                    height: 52,
                    shadowColor: '#10e57a',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.55,
                    shadowRadius: 14,
                    elevation: 12,
                  }}
                >
                  <Ionicons name="add" size={28} color="#00210c" />
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onSelectTab(tab.id)}
              activeOpacity={0.7}
              className="flex-1 items-center justify-center py-1 min-w-[50px]"
            >
              <Ionicons
                name={(isActive ? tab.activeIcon : tab.icon) as any}
                size={20}
                color={isActive ? '#10e57a' : '#8e96a8'}
              />
              <Text
                className={`text-[10px] mt-0.5 tracking-tight font-medium ${
                  isActive ? 'text-[#10e57a] font-bold' : 'text-[#8e96a8]'
                }`}
              >
                {tab.label}
              </Text>
              {isActive ? (
                <View
                  className="w-1.5 h-1.5 rounded-full bg-[#10e57a] mt-0.5"
                  style={{
                    shadowColor: '#10e57a',
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                />
              ) : (
                <View className="w-1.5 h-1.5 mt-0.5" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
