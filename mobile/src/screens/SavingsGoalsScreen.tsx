import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../stores/financeStore';
import { showAlert } from '../stores/alertStore';
import { formatCurrency, api } from '../services/api';
import { SavingsGoal } from '../types';

interface SavingsGoalsScreenProps {
  onSelectGoal: (goal: SavingsGoal) => void;
}

export const SavingsGoalsScreen: React.FC<SavingsGoalsScreenProps> = ({ onSelectGoal }) => {
  const { savingsGoals, fetchSavingsGoals, deleteSavingsGoal, isLoading } = useFinanceStore();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [initialAmountStr, setInitialAmountStr] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetchSavingsGoals();
  }, []);

  const handleDeleteGoal = (goalId: string, goalName: string) => {
    showAlert(
      'Hapus Target Tabungan',
      `Apakah Anda yakin ingin menghapus target "${goalName}"? Seluruh riwayat setoran di dalamnya juga akan terhapus.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Target',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteSavingsGoal(goalId);
            if (success) {
              showAlert('Sukses', 'Target tabungan berhasil dihapus!', undefined, 'success');
            } else {
              showAlert('Error', 'Gagal menghapus target tabungan, silakan coba lagi.', undefined, 'error');
            }
          },
        },
      ],
      'warning',
    );
  };

  const handleCreate = async () => {
    const targetAmount = parseFloat(targetAmountStr.replace(/[^0-9]/g, ''));
    const initialAmount = parseFloat(initialAmountStr.replace(/[^0-9]/g, '') || '0');
    if (!name.trim()) {
      showAlert('Peringatan', 'Masukkan nama target impian Anda', undefined, 'warning');
      return;
    }
    if (!targetAmount || targetAmount <= 0) {
      showAlert('Peringatan', 'Target nominal harus lebih besar dari 0', undefined, 'warning');
      return;
    }

    try {
      await api.post('/savings-goals', {
        name: name.trim(),
        targetAmount,
        initialAmount,
      });
      setShowModal(false);
      setName('');
      setTargetAmountStr('');
      setInitialAmountStr('');
      fetchSavingsGoals();
      showAlert('Sukses', 'Target tabungan berhasil dibuat!', undefined, 'success');
    } catch {
      showAlert('Error', 'Gagal membuat target tabungan, silakan coba lagi.', undefined, 'error');
    }
  };

  const totalSaved = savingsGoals.reduce(
    (sum, g) => sum + parseFloat(String(g.currentAmount || 0)),
    0
  );
  const totalTarget = savingsGoals.reduce(
    (sum, g) => sum + parseFloat(String(g.targetAmount || 0)),
    0
  );
  const progressPercent = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 54;

  return (
    <View className="flex-1 bg-[#0f131e]">
      <ScrollView
        className="flex-1 px-5 pt-12"
        contentContainerStyle={{ paddingBottom: 150 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchSavingsGoals}
            tintColor="#10e57a"
          />
        }
      >
        {/* Top Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2.5">
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 30, height: 30, borderRadius: 8 }}
              resizeMode="contain"
            />
            <Text className="text-white text-lg font-bold tracking-tight">My Finance</Text>
          </View>
          <View className="w-9 h-9 rounded-full bg-[#171c2a] border border-[#262a3a] items-center justify-center">
            <Ionicons name="notifications-outline" size={18} color="#dfe2f2" />
          </View>
        </View>

        {/* Title & New Goal Action */}
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-white text-2xl font-bold tracking-tight">Target Tabungan</Text>
            <Text className="text-[#8e96a8] text-xs mt-0.5">
              Alokasi & otomatisasi sasaran kekayaan
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            className="flex-row items-center bg-[#171c2a] border border-[#262a3a] px-3.5 py-2 rounded-full active:opacity-85"
          >
            <Ionicons name="add" size={16} color="#10e57a" />
            <Text className="text-[#10e57a] font-bold text-xs ml-1">New Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Total Aggregated Capital Card (Stitch Screen 6) */}
        <View className="bg-[#171c2a] border border-[#262a3a] rounded-3xl p-5 mb-4 shadow-xl relative overflow-hidden">
          {/* Decorative Circles & Concentric Rings */}
          <View
            pointerEvents="none"
            className="absolute -top-14 -right-14 w-48 h-48 rounded-full bg-[#10e57a]/[0.08]"
          />
          <View
            pointerEvents="none"
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full border border-[#10e57a]/15"
          />
          <View
            pointerEvents="none"
            className="absolute -top-8 -right-8 w-36 h-36 rounded-full border border-[#10e57a]/20"
          />
          <View
            pointerEvents="none"
            className="absolute -bottom-16 -left-14 w-44 h-44 rounded-full bg-[#3b82f6]/[0.06]"
          />
          <View
            pointerEvents="none"
            className="absolute -bottom-10 -left-8 w-32 h-32 rounded-full border border-white/[0.05]"
          />
          <View
            pointerEvents="none"
            className="absolute top-7 right-28 w-2 h-2 rounded-full bg-[#10e57a]/40"
          />
          <View
            pointerEvents="none"
            className="absolute bottom-20 left-1/3 w-1.5 h-1.5 rounded-full bg-[#10e57a]/30"
          />

          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-[#8e96a8] text-[10px] font-bold uppercase tracking-wider">
              TOTAL AGGREGATED CAPITAL
            </Text>
            <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-[#10e57a]/15">
              <Ionicons name="trending-up" size={12} color="#10e57a" />
              <Text className="text-[#10e57a] text-[10px] font-bold">+Rp 2.5M/bln</Text>
            </View>
          </View>

          <Text className="text-white text-3xl font-extrabold tracking-tight mb-1.5">
            {formatCurrency(totalSaved)}
          </Text>

          <View className="flex-row justify-between items-center mb-2.5">
            <Text className="text-[#8e96a8] text-xs">
              Target: <Text className="text-white font-medium">{formatCurrency(totalTarget)}</Text>
            </Text>
            <Text className="text-[#10e57a] text-xs font-bold">{progressPercent}%</Text>
          </View>

          {/* Progress Bar */}
          <View className="w-full h-2 rounded-full bg-[#262a36] overflow-hidden mb-4">
            <View
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
              className="h-full rounded-full bg-[#10e57a]"
            />
          </View>

          {/* 3 Metric Pills */}
          <View className="flex-row justify-between pt-2 border-t border-[#262a3a]">
            <View className="items-center flex-1">
              <Text className="text-[#8e96a8] text-[10px]">Aktif</Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {savingsGoals.length} Target
              </Text>
            </View>
            <View className="items-center flex-1 border-x border-[#262a3a]">
              <Text className="text-[#8e96a8] text-[10px]">On Track</Text>
              <Text className="text-[#10e57a] text-xs font-bold mt-0.5">
                • {savingsGoals.length}
              </Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-[#8e96a8] text-[10px]">Perlu Boost</Text>
              <Text className="text-[#ff5c5c] text-xs font-bold mt-0.5">• 0</Text>
            </View>
          </View>
        </View>

        {/* Filter Pills */}
        <View className="flex-row gap-2 mb-4">
          {['All Goals', 'Priority', 'Short-term'].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              className={`px-3.5 py-1.5 rounded-full border ${
                activeFilter === f
                  ? 'bg-[#262a36] border-[#10e57a]'
                  : 'bg-[#171c2a] border-[#262a3a]'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeFilter === f ? 'text-white' : 'text-[#8e96a8]'
                }`}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Goals List (Stitch Screen 6) */}
        {savingsGoals.map((goal) => {
          const current = parseFloat(String(goal.currentAmount || 0));
          const target = parseFloat(String(goal.targetAmount || 1));
          const pct = Math.min(Math.round((current / target) * 100), 100);

          return (
            <TouchableOpacity
              key={goal.id}
              onPress={() => onSelectGoal(goal)}
              activeOpacity={0.8}
              className="bg-[#171c2a] border border-[#262a3a] rounded-2xl p-4 mb-3"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                  <View className="w-9 h-9 rounded-xl bg-[#10e57a]/20 items-center justify-center">
                    <Ionicons name="shield-checkmark-outline" size={18} color="#10e57a" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-sm font-bold truncate">{goal.name}</Text>
                    <Text className="text-[#8e96a8] text-[10px]">Target Dana Terkumpul</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="px-2 py-0.5 rounded-full bg-[#10e57a]/15">
                    <Text className="text-[#10e57a] text-[10px] font-bold">ON TRACK</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteGoal(goal.id, goal.name)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="w-6 h-6 rounded-full bg-[#262a36] border border-[#303546] items-center justify-center ml-1"
                  >
                    <Ionicons name="trash-outline" size={12} color="#ff5c5c" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row justify-between items-baseline mb-1.5">
                <Text className="text-white text-sm font-bold">
                  {formatCurrency(current)}{' '}
                  <Text className="text-[#8e96a8] font-normal text-xs">
                    / {formatCurrency(target)}
                  </Text>
                </Text>
                <Text className="text-[#10e57a] text-xs font-bold">{pct}%</Text>
              </View>

              {/* Progress Bar */}
              <View className="w-full h-1.5 rounded-full bg-[#262a36] overflow-hidden mb-2.5">
                <View style={{ width: `${pct}%` }} className="h-full rounded-full bg-[#10e57a]" />
              </View>

              <View className="flex-row justify-between items-center text-xs">
                <Text className="text-[#8e96a8] text-[10px]">
                  Sisa: {formatCurrency(Math.max(target - current, 0))}
                </Text>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="sparkles" size={12} color="#10e57a" />
                  <Text className="text-[#10e57a] text-[10px] font-semibold">Boost Goal</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {savingsGoals.length === 0 && (
          <View className="py-8 items-center bg-[#171c2a] border border-[#262a3a] rounded-2xl mb-4 px-4">
            <View className="w-12 h-12 rounded-full bg-[#262a36] items-center justify-center mb-2.5">
              <Ionicons name="flag-outline" size={24} color="#8e96a8" />
            </View>
            <Text className="text-white text-sm font-bold mb-1">Belum Ada Target Tabungan</Text>
            <Text className="text-[#8e96a8] text-xs text-center leading-4">
              Tentukan impian finansial Anda dan mulai kumpulkan dana sedikit demi sedikit!
            </Text>
          </View>
        )}

        {/* Create Target Button CTA */}
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          className="w-full bg-[#10e57a] py-3.5 rounded-full items-center shadow-lg active:opacity-90 flex-row justify-center mt-2"
          style={{
            shadowColor: '#10e57a',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 6,
          }}
        >
          <Ionicons name="add-circle" size={20} color="#00210c" />
          <Text className="text-[#00210c] font-bold text-sm ml-2">
            Create New Savings Target
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Add Goal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 bg-black/80 justify-end"
        >
          <Pressable
            className="flex-1"
            onPress={() => setShowModal(false)}
          />
          <View className="bg-[#171c2a] border-t border-[#262a3a] rounded-t-3xl p-6 shadow-2xl">
            {/* Grab handle */}
            <View className="w-12 h-1.5 bg-[#262a3a] rounded-full self-center mb-4" />

            <View className="flex-row justify-between items-center mb-5">
              <View>
                <Text className="text-[#8e96a8] text-[10px] uppercase font-bold tracking-wider">
                  TARGET BARU
                </Text>
                <Text className="text-white text-lg font-bold">Target Tabungan</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-[#262a36] border border-[#303546] items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#8e96a8" />
              </TouchableOpacity>
            </View>

            <Text className="text-[#8e96a8] text-xs font-semibold mb-1.5 uppercase">
              Nama Impian
            </Text>
            <View className="bg-[#0f131e] border border-[#262a3a] rounded-2xl px-4 py-3 mb-4">
              <TextInput
                placeholder="Contoh: Dana Darurat, DP Rumah, Gadget"
                placeholderTextColor="#6b7280"
                value={name}
                onChangeText={setName}
                className="text-white text-sm"
              />
            </View>

            <Text className="text-[#8e96a8] text-xs font-semibold mb-1.5 uppercase">
              Target Nominal (IDR)
            </Text>
            <View className="flex-row items-center bg-[#0f131e] border border-[#262a3a] rounded-2xl px-4 py-3 mb-4">
              <Text className="text-[#8e96a8] font-bold mr-1.5">Rp</Text>
              <TextInput
                placeholder="0"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                value={targetAmountStr}
                onChangeText={(text) => {
                  const num = text.replace(/[^0-9]/g, '');
                  setTargetAmountStr(num ? parseInt(num, 10).toLocaleString('id-ID') : '');
                }}
                className="text-white text-sm flex-1 font-bold"
              />
            </View>

            <Text className="text-[#8e96a8] text-xs font-semibold mb-1.5 uppercase">
              Setoran Awal (Opsional)
            </Text>
            <View className="flex-row items-center bg-[#0f131e] border border-[#262a3a] rounded-2xl px-4 py-3 mb-6">
              <Text className="text-[#8e96a8] font-bold mr-1.5">Rp</Text>
              <TextInput
                placeholder="0"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                value={initialAmountStr}
                onChangeText={(text) => {
                  const num = text.replace(/[^0-9]/g, '');
                  setInitialAmountStr(num ? parseInt(num, 10).toLocaleString('id-ID') : '');
                }}
                className="text-white text-sm flex-1 font-bold"
              />
            </View>

            <TouchableOpacity
              onPress={handleCreate}
              activeOpacity={0.88}
              className="w-full bg-[#10e57a] py-3.5 rounded-full items-center mb-2"
              style={{
                shadowColor: '#10e57a',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.45,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text className="text-[#00210c] font-bold text-sm tracking-wide">
                Buat Target Sekarang
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};
