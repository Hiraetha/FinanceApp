import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { showAlert } from '../stores/alertStore';
import { getApiBaseUrl, setCustomApiUrl, getCustomApiUrl } from '../services/api';
import axios from 'axios';

export const AuthScreen: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, loginDemo, isLoading, error, clearError } = useAuthStore();

  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
  const [inputServerUrl, setInputServerUrl] = useState(getApiBaseUrl());
  const [showServerModal, setShowServerModal] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    getCustomApiUrl().then((saved) => {
      const active = saved || getApiBaseUrl();
      setServerUrl(active);
      setInputServerUrl(active);
    });
  }, []);

  const handleTestConnection = async () => {
    if (!inputServerUrl.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const clean = inputServerUrl.trim().replace(/\/+$/, '');
      const res = await axios.get(`${clean}/categories`, { timeout: 4000 });
      if (res.status >= 200 && res.status < 400) {
        setTestResult({ success: true, message: 'Terhubung! Server merespons dengan baik.' });
      } else {
        setTestResult({ success: false, message: `Status respon: ${res.status}` });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Gagal terhubung. Pastikan laptop & HP di Wi-Fi yang sama.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveServerUrl = async () => {
    if (!inputServerUrl.trim()) return;
    const clean = inputServerUrl.trim().replace(/\/+$/, '');
    await setCustomApiUrl(clean);
    setServerUrl(clean);
    setShowServerModal(false);
    clearError();
    showAlert('Berhasil', `Server API diubah ke:\n${clean}`, undefined, 'success');
  };

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
          <View className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-xl mb-6">
            <View className="flex-row items-center mb-1">
              <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
              <Text className="text-red-400 text-xs ml-2 font-semibold flex-1">{error}</Text>
            </View>
            <Text className="text-[#8e96a8] text-[11px] mb-2.5 ml-7">
              Tidak dapat terhubung ke server ({serverUrl}).
            </Text>
            <TouchableOpacity
              onPress={() => setShowServerModal(true)}
              className="bg-[#252a3b] py-2 px-3 rounded-lg flex-row items-center justify-center self-start ml-7"
            >
              <Ionicons name="settings-outline" size={14} color="#10e57a" />
              <Text className="text-[#10e57a] text-xs font-semibold ml-1.5">
                Ubah Server API
              </Text>
            </TouchableOpacity>
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

        {/* Server Config Footer */}
        <TouchableOpacity
          onPress={() => setShowServerModal(true)}
          className="mt-6 flex-row items-center justify-center gap-1.5 py-2 px-3.5 rounded-full bg-[#171b27] self-center border border-[#252a3b]"
        >
          <Ionicons name="server-outline" size={13} color="#10e57a" />
          <Text className="text-[#8e96a8] text-xs font-medium" numberOfLines={1}>
            Server: {serverUrl}
          </Text>
          <Ionicons name="create-outline" size={13} color="#8e96a8" />
        </TouchableOpacity>

        {/* Server Configuration Modal */}
        <Modal
          visible={showServerModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowServerModal(false)}
        >
          <View className="flex-1 bg-black/80 items-center justify-center p-5">
            <View className="w-full max-w-sm bg-[#171c2a] border border-[#262a3a] rounded-3xl p-5 shadow-2xl">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-[#10e57a]/20 items-center justify-center">
                    <Ionicons name="server" size={16} color="#10e57a" />
                  </View>
                  <Text className="text-white text-base font-bold">Pengaturan Server API</Text>
                </View>
                <TouchableOpacity onPress={() => setShowServerModal(false)}>
                  <Ionicons name="close" size={22} color="#8e96a8" />
                </TouchableOpacity>
              </View>

              <Text className="text-[#8e96a8] text-xs mb-3">
                Masukkan alamat IP laptop atau URL domain backend Anda.
              </Text>

              <View className="bg-[#0f131e] border border-[#252a3b] rounded-xl px-3.5 py-2.5 mb-3">
                <Text className="text-[#8e96a8] text-[10px] uppercase font-bold tracking-wider mb-1">
                  URL Backend
                </Text>
                <TextInput
                  value={inputServerUrl}
                  onChangeText={(t) => {
                    setInputServerUrl(t);
                    setTestResult(null);
                  }}
                  placeholder="http://192.168.1.112:3000"
                  placeholderTextColor="#4b5563"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="text-white text-sm"
                />
              </View>

              {testResult && (
                <View
                  className={`p-2.5 rounded-xl mb-3 flex-row items-center ${
                    testResult.success ? 'bg-[#10e57a]/15 border border-[#10e57a]/30' : 'bg-red-500/15 border border-red-500/30'
                  }`}
                >
                  <Ionicons
                    name={testResult.success ? 'checkmark-circle' : 'alert-circle'}
                    size={16}
                    color={testResult.success ? '#10e57a' : '#ef4444'}
                  />
                  <Text
                    className={`text-xs ml-2 flex-1 font-medium ${
                      testResult.success ? 'text-[#10e57a]' : 'text-red-400'
                    }`}
                  >
                    {testResult.message}
                  </Text>
                </View>
              )}

              <View className="flex-row gap-2 mt-2">
                <TouchableOpacity
                  onPress={handleTestConnection}
                  disabled={isTesting}
                  className="flex-1 bg-[#252a3b] py-3 rounded-xl items-center flex-row justify-center"
                >
                  {isTesting ? (
                    <ActivityIndicator size="small" color="#10e57a" />
                  ) : (
                    <>
                      <Ionicons name="pulse" size={16} color="#10e57a" />
                      <Text className="text-white text-xs font-semibold ml-1.5">Tes Koneksi</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveServerUrl}
                  className="flex-1 bg-[#10e57a] py-3 rounded-xl items-center justify-center"
                >
                  <Text className="text-[#0f131e] text-xs font-bold">Simpan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
