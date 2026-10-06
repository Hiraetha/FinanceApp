import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { showAlert } from '../stores/alertStore';

export const AuthScreen: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, loginDemo, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async () => {
    if (isRegister) {
      if (!name.trim()) {
        showAlert('Perhatian', 'Silakan masukkan nama lengkap Anda', undefined, 'warning');
        return;
      }
      if (!email.trim() || !password) {
        showAlert('Perhatian', 'Silakan masukkan email dan kata sandi', undefined, 'warning');
        return;
      }
      await register(name.trim(), email.trim(), password);
    } else {
      if (!email.trim() || !password) {
        showAlert('Perhatian', 'Silakan masukkan email dan kata sandi untuk masuk', undefined, 'warning');
        return;
      }
      await login(email.trim(), password);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#0f131e]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        className="px-6 py-12"
      >
        {/* Brand Header */}
        <View className="items-center mb-8">
          <View
            className="w-20 h-20 rounded-3xl items-center justify-center mb-4 overflow-hidden border border-[#10e57a]/30"
            style={{
              shadowColor: '#10e57a',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.45,
              shadowRadius: 18,
              elevation: 10,
            }}
          >
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-white text-3xl font-extrabold tracking-tight">My Finance</Text>
          <Text className="text-[#8e96a8] text-sm mt-1.5 text-center">
            Fintech AI: Kelola arus kas, anggaran & sasaran finansialmu
          </Text>
        </View>

        {/* Error message */}
        {error ? (
          <View className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-xl mb-6 flex-row items-center">
            <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
            <Text className="text-red-400 text-xs ml-2 flex-1">{error}</Text>
          </View>
        ) : null}

        {/* Form Card */}
        <View className="bg-[#171b27] border border-[#252a3b] p-6 rounded-2xl shadow-xl">
          {/* Tabs */}
          <View className="flex-row bg-[#0f131e] p-1 rounded-xl mb-6">
            <TouchableOpacity
              onPress={() => {
                clearError();
                setIsRegister(false);
              }}
              className={`flex-1 py-2.5 rounded-lg items-center ${!isRegister ? 'bg-[#171b27]' : ''}`}
            >
              <Text className={`text-sm font-semibold ${!isRegister ? 'text-white' : 'text-[#8e96a8]'}`}>
                Masuk
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                clearError();
                setIsRegister(true);
              }}
              className={`flex-1 py-2.5 rounded-lg items-center ${isRegister ? 'bg-[#171b27]' : ''}`}
            >
              <Text className={`text-sm font-semibold ${isRegister ? 'text-white' : 'text-[#8e96a8]'}`}>
                Daftar Baru
              </Text>
            </TouchableOpacity>
          </View>

          {isRegister && (
            <View className="mb-4">
              <Text className="text-xs text-[#8e96a8] font-medium mb-1.5 uppercase tracking-wider">
                Nama Lengkap
              </Text>
              <View className="flex-row items-center bg-[#0f131e] border border-[#252a3b] rounded-xl px-3.5 py-3">
                <Ionicons name="person-outline" size={18} color="#8e96a8" />
                <TextInput
                  placeholder="Ibnu Abi"
                  placeholderTextColor="#4b5563"
                  value={name}
                  onChangeText={setName}
                  className="flex-1 ml-2.5 text-white text-sm"
                />
              </View>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-xs text-[#8e96a8] font-medium mb-1.5 uppercase tracking-wider">
              Email
            </Text>
            <View className="flex-row items-center bg-[#0f131e] border border-[#252a3b] rounded-xl px-3.5 py-3">
              <Ionicons name="mail-outline" size={18} color="#8e96a8" />
              <TextInput
                placeholder="demo@myfinance.app"
                placeholderTextColor="#4b5563"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                className="flex-1 ml-2.5 text-white text-sm"
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-xs text-[#8e96a8] font-medium mb-1.5 uppercase tracking-wider">
              Kata Sandi
            </Text>
            <View className="flex-row items-center bg-[#0f131e] border border-[#252a3b] rounded-xl px-3.5 py-3">
              <Ionicons name="lock-closed-outline" size={18} color="#8e96a8" />
              <TextInput
                placeholder="Minimal 6 karakter"
                placeholderTextColor="#4b5563"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                className="flex-1 ml-2.5 text-white text-sm"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className="w-full bg-[#10e57a] py-3.5 rounded-xl items-center shadow-lg active:opacity-90"
          >
            {isLoading ? (
              <ActivityIndicator color="#0f131e" />
            ) : (
              <Text className="text-[#0f131e] font-bold text-base">
                {isRegister ? 'Buat Akun' : 'Masuk Sekarang'}
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row items-center my-5">
            <View className="flex-1 h-[1px] bg-[#252a3b]" />
            <Text className="mx-3 text-xs text-[#8e96a8]">ATAU</Text>
            <View className="flex-1 h-[1px] bg-[#252a3b]" />
          </View>

          {/* Quick Demo Button */}
          <TouchableOpacity
            onPress={loginDemo}
            disabled={isLoading}
            className="w-full bg-[#1e2333] border border-[#10e57a]/40 py-3.5 rounded-xl flex-row items-center justify-center active:opacity-90"
          >
            <Ionicons name="flash" size={18} color="#10e57a" />
            <Text className="text-[#10e57a] font-semibold text-sm ml-2">
              Masuk dengan Akun Demo (1-Klik)
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
