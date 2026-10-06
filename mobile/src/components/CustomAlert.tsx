import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlertStore } from '../stores/alertStore';

export const CustomAlert: React.FC = () => {
  const { visible, title, message, type, buttons, hideAlert } = useAlertStore();

  if (!visible) return null;

  const getIconConfig = () => {
    switch (type) {
      case 'warning':
        return {
          name: 'warning' as const,
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.35)',
        };
      case 'error':
        return {
          name: 'alert-circle' as const,
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.35)',
        };
      case 'success':
        return {
          name: 'checkmark-circle' as const,
          color: '#10e57a',
          bg: 'rgba(16, 229, 122, 0.15)',
          border: 'rgba(16, 229, 122, 0.35)',
        };
      default:
        return {
          name: 'information-circle' as const,
          color: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.15)',
          border: 'rgba(59, 130, 246, 0.35)',
        };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={hideAlert}
    >
      <View className="flex-1 bg-black/80 items-center justify-center px-6">
        <Pressable
          className="absolute inset-0 w-full h-full"
          onPress={hideAlert}
        />
        <View
          className="w-full max-w-[340px] bg-[#171c2a] border border-[#262a3a] rounded-3xl p-6 items-center z-10"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.8,
            shadowRadius: 28,
            elevation: 24,
          }}
        >
          {/* Top Status Icon */}
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center mb-3.5"
            style={{
              backgroundColor: iconConfig.bg,
              borderColor: iconConfig.border,
              borderWidth: 1.5,
              shadowColor: iconConfig.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <Ionicons name={iconConfig.name} size={30} color={iconConfig.color} />
          </View>

          {/* Title */}
          <Text className="text-white text-lg font-bold text-center mb-1.5 tracking-tight">
            {title}
          </Text>

          {/* Message */}
          {message ? (
            <Text className="text-[#8e96a8] text-xs text-center leading-5 mb-5 px-1 font-medium">
              {message}
            </Text>
          ) : (
            <View className="mb-4" />
          )}

          {/* Action Buttons */}
          {buttons.length === 1 ? (
            <TouchableOpacity
              onPress={() => {
                hideAlert();
                if (buttons[0].onPress) buttons[0].onPress();
              }}
              activeOpacity={0.88}
              className="w-full bg-[#10e57a] py-3.5 rounded-full items-center"
              style={{
                shadowColor: '#10e57a',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.45,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text className="text-[#00210c] font-bold text-sm tracking-wide">
                {buttons[0].text}
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row gap-2.5 w-full">
              {buttons.map((btn, idx) => {
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';

                let bgClass = 'bg-[#10e57a]';
                let textClass = 'text-[#00210c]';
                let borderClass = 'border-transparent';

                if (isCancel) {
                  bgClass = 'bg-[#262a36]';
                  textClass = 'text-[#dfe2f2]';
                  borderClass = 'border-[#303546]';
                } else if (isDestructive) {
                  bgClass = 'bg-[#ef4444]';
                  textClass = 'text-white';
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      hideAlert();
                      if (btn.onPress) btn.onPress();
                    }}
                    activeOpacity={0.8}
                    className={`flex-1 py-3.5 rounded-full items-center border ${bgClass} ${borderClass}`}
                  >
                    <Text className={`font-bold text-xs ${textClass}`}>{btn.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
