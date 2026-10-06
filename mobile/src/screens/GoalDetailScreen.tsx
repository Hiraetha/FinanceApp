import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../stores/financeStore';
import { showAlert } from '../stores/alertStore';
import { formatCurrency } from '../services/api';
import { SavingsGoal } from '../types';

interface GoalDetailScreenProps {
  goal: SavingsGoal;
  onBack: () => void;
}

export const GoalDetailScreen: React.FC<GoalDetailScreenProps> = ({ goal, onBack }) => {
  const { selectedGoal, fetchGoalDetail, addContribution, deleteSavingsGoal } = useFinanceStore();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmountStr, setDepositAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchGoalDetail(goal.id);
  }, [goal.id]);

  const activeGoal = selectedGoal || goal;
  const current = parseFloat(String(activeGoal.currentAmount || 0));
  const target = parseFloat(String(activeGoal.targetAmount || 1));
  const remaining = Math.max(target - current, 0);
  const pct = Math.min(Math.round((current / target) * 100), 100);

  const handleDeleteGoal = () => {
    showAlert(
      'Hapus Target Tabungan',
      `Apakah Anda yakin ingin menghapus target "${activeGoal.name}"? Seluruh riwayat setoran di dalamnya juga akan terhapus permanen.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Target',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteSavingsGoal(activeGoal.id);
            if (success) {
              showAlert('Sukses', 'Target tabungan berhasil dihapus!', undefined, 'success');
              onBack();
            } else {
              showAlert('Error', 'Gagal menghapus target tabungan', undefined, 'error');
            }
          },
        },
      ],
      'warning',
    );
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmountStr.replace(/[^0-9]/g, ''));
    if (!amount || amount <= 0) {
      showAlert('Peringatan', 'Jumlah setoran harus lebih besar dari 0', undefined, 'warning');
      return;
    }

    setIsLoading(true);
    const success = await addContribution(activeGoal.id, amount, note.trim() || undefined);
    setIsLoading(false);

    if (success) {
      setShowDepositModal(false);
      setDepositAmountStr('');
      setNote('');
      showAlert('Sukses', 'Setoran tabungan berhasil ditambahkan!', undefined, 'success');
    } else {
      showAlert('Error', 'Gagal menambahkan setoran tabungan', undefined, 'error');
    }
  };

  return (
    <View className="flex-1 bg-[#0f131e]">
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
        <TouchableOpacity
          onPress={onBack}
          className="w-10 h-10 rounded-full bg-[#171c2a] border border-[#262a3a] items-center justify-center active:opacity-75"
        >
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>

        <View className="flex-row items-center gap-2 flex-1 justify-center px-2">
          <Image
            source={require('../../assets/logo.png')}
            style={{ width: 24, height: 24, borderRadius: 6 }}
            resizeMode="contain"
          />
          <Text className="text-white text-base font-bold" numberOfLines={1}>
            {activeGoal.name}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleDeleteGoal}
          className="w-10 h-10 rounded-full bg-[#171c2a] border border-[#262a3a] items-center justify-center active:opacity-75"
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 150 }}>
        {/* Goal Hero Card (Stitch Screen 7) */}
        <View className="bg-[#171c2a] border border-[#262a3a] rounded-3xl p-5 mb-4 shadow-xl">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-[#10e57a]/20 items-center justify-center">
                <Ionicons name="shield-checkmark" size={16} color="#10e57a" />
              </View>
              <Text className="text-[#8e96a8] text-xs font-semibold uppercase">
                Target Terverifikasi
              </Text>
            </View>
            <View className="px-2.5 py-0.5 rounded-full bg-[#10e57a]/15">
              <Text className="text-[#10e57a] text-[10px] font-bold">ON TRACK</Text>
            </View>
          </View>

          <Text className="text-[#8e96a8] text-[10px] font-bold uppercase tracking-wider mt-1">
            DANA SAAT INI
          </Text>
          <Text className="text-white text-3xl font-extrabold tracking-tight mb-2">
            {formatCurrency(current)}
          </Text>

          <View className="flex-row justify-between text-xs mb-1.5">
            <Text className="text-[#10e57a] text-xs font-bold">{pct}% Selesai</Text>
            <Text className="text-[#8e96a8] text-xs">
              Sisa {formatCurrency(remaining)} lagi
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="w-full h-2 rounded-full bg-[#262a36] overflow-hidden mb-4">
            <View style={{ width: `${pct}%` }} className="h-full rounded-full bg-[#10e57a]" />
          </View>

          {/* 3 Metric Pills */}
          <View className="flex-row justify-between pt-2 border-t border-[#262a3a]">
            <View className="items-center flex-1">
              <Text className="text-[#8e96a8] text-[10px]">Sisa Target</Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {formatCurrency(remaining)}
              </Text>
            </View>
            <View className="items-center flex-1 border-x border-[#262a3a]">
              <Text className="text-[#8e96a8] text-[10px]">Pace Bulanan</Text>
              <Text className="text-[#10e57a] text-xs font-bold mt-0.5">
                Rp 1.5M/bln
              </Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-[#8e96a8] text-[10px]">Estimasi Selesai</Text>
              <Text className="text-[#10e57a] text-xs font-bold mt-0.5">
                ~4 Bulan
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={() => setShowDepositModal(true)}
          className="w-full bg-[#10e57a] py-3.5 rounded-full items-center shadow-lg active:opacity-90 flex-row justify-center mb-5"
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
            Make One-Time Deposit
          </Text>
        </TouchableOpacity>

        {/* Milestone Checkpoints */}
        <View className="bg-[#171c2a] border border-[#262a3a] rounded-2xl p-4 mb-4">
          <Text className="text-white text-xs font-bold uppercase tracking-wider mb-3">
            Milestone Checkpoints
          </Text>

          <View className="flex-row items-center justify-between py-2 border-b border-[#262a3a]">
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkmark-circle" size={18} color="#10e57a" />
              <Text className="text-white text-xs font-medium">1 Bulan Buffer Tercapai</Text>
            </View>
            <Text className="text-[#10e57a] text-[10px] font-bold">UNLOCKED</Text>
          </View>

          <View className="flex-row items-center justify-between py-2 border-b border-[#262a3a]">
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkmark-circle" size={18} color="#10e57a" />
              <Text className="text-white text-xs font-medium">2 Bulan Buffer Tercapai</Text>
            </View>
            <Text className="text-[#10e57a] text-[10px] font-bold">UNLOCKED</Text>
          </View>

          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center gap-2">
              <Ionicons name="hourglass-outline" size={18} color="#f59e0b" />
              <Text className="text-white text-xs font-medium">3 Bulan Target Buffer</Text>
            </View>
            <Text className="text-[#f59e0b] text-[10px] font-bold">{pct}% PROSES</Text>
          </View>
        </View>

        {/* History Contributions */}
        <View className="bg-[#171c2a] border border-[#262a3a] rounded-2xl p-4">
          <Text className="text-white text-xs font-bold uppercase tracking-wider mb-3">
            Riwayat Setoran
          </Text>

          {activeGoal.contributions && activeGoal.contributions.length > 0 ? (
            activeGoal.contributions.map((c) => (
              <View
                key={c.id}
                className="flex-row items-center justify-between py-2.5 border-b border-[#262a3a]"
              >
                <View className="flex-row items-center gap-2.5">
                  <View className="w-8 h-8 rounded-lg bg-[#10e57a]/20 items-center justify-center">
                    <Ionicons name="arrow-up" size={14} color="#10e57a" />
                  </View>
                  <View>
                    <Text className="text-white text-xs font-semibold">
                      {c.note || 'Setoran Tabungan'}
                    </Text>
                    <Text className="text-[#8e96a8] text-[10px]">
                      {new Date(c.contributionDate).toLocaleDateString('id-ID')}
                    </Text>
                  </View>
                </View>
                <Text className="text-[#10e57a] text-xs font-bold">
                  +{formatCurrency(c.amount)}
                </Text>
              </View>
            ))
          ) : (
            <View className="py-4 items-center">
              <Text className="text-[#8e96a8] text-xs">Belum ada riwayat setoran</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal Deposit */}
      <Modal
        visible={showDepositModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowDepositModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 bg-black/80 justify-end"
        >
          <Pressable
            className="flex-1"
            onPress={() => setShowDepositModal(false)}
          />
          <View className="bg-[#171c2a] border-t border-[#262a3a] rounded-t-3xl p-6 shadow-2xl">
            {/* Grab handle */}
            <View className="w-12 h-1.5 bg-[#262a3a] rounded-full self-center mb-4" />

            <View className="flex-row justify-between items-center mb-5">
              <View>
                <Text className="text-[#8e96a8] text-[10px] uppercase font-bold tracking-wider">
                  SETORAN TABUNGAN
                </Text>
                <Text className="text-white text-lg font-bold">Tambah Setoran</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDepositModal(false)}
                className="w-8 h-8 rounded-full bg-[#262a36] border border-[#303546] items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#8e96a8" />
              </TouchableOpacity>
            </View>

            <Text className="text-[#8e96a8] text-xs font-semibold mb-1.5 uppercase">
              Nominal Setoran (IDR)
            </Text>
            <View className="flex-row items-center bg-[#0f131e] border border-[#262a3a] rounded-2xl px-4 py-3 mb-4">
              <Text className="text-[#8e96a8] font-bold mr-1.5">Rp</Text>
              <TextInput
                placeholder="0"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                value={depositAmountStr}
                onChangeText={(text) => {
                  const num = text.replace(/[^0-9]/g, '');
                  setDepositAmountStr(num ? parseInt(num, 10).toLocaleString('id-ID') : '');
                }}
                className="text-white text-sm flex-1 font-bold"
              />
            </View>

            {/* Quick Chips */}
            <View className="flex-row gap-2 mb-4">
              {[500000, 1000000, 2000000].map((quick) => (
                <TouchableOpacity
                  key={quick}
                  onPress={() => setDepositAmountStr(quick.toLocaleString('id-ID'))}
                  className="px-3.5 py-2 rounded-full bg-[#262a36] border border-[#303546] active:opacity-75"
                >
                  <Text className="text-[#dfe2f2] text-xs font-semibold">
                    +Rp {quick / 1000}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-[#8e96a8] text-xs font-semibold mb-1.5 uppercase">
              Catatan (Opsional)
            </Text>
            <View className="bg-[#0f131e] border border-[#262a3a] rounded-2xl px-4 py-3 mb-6">
              <TextInput
                placeholder="Contoh: Sisa THR, Bonus proyek..."
                placeholderTextColor="#6b7280"
                value={note}
                onChangeText={setNote}
                className="text-white text-sm"
              />
            </View>

            <TouchableOpacity
              onPress={handleDeposit}
              disabled={isLoading}
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
              {isLoading ? (
                <ActivityIndicator color="#00210c" />
              ) : (
                <Text className="text-[#00210c] font-bold text-sm tracking-wide">
                  Simpan Setoran
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};
