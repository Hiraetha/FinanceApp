import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../stores/financeStore';
import { showAlert } from '../stores/alertStore';

interface AddTransactionScreenProps {
  onBack: () => void;
}

export const AddTransactionScreen: React.FC<AddTransactionScreenProps> = ({ onBack }) => {
  const { categories, fetchCategories, createTransaction } = useFinanceStore();
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState<number>(0);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.some((c) => c.id === categoryId)) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [type, categories]);

  const addQuickAmount = (val: number) => {
    setAmount((prev) => prev + val);
  };

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      showAlert('Peringatan', 'Nominal transaksi harus lebih dari 0', undefined, 'warning');
      return;
    }
    if (!categoryId) {
      showAlert('Peringatan', 'Pilih kategori transaksi terlebih dahulu', undefined, 'warning');
      return;
    }
    if (!description.trim()) {
      showAlert('Peringatan', 'Masukkan catatan deskripsi transaksi', undefined, 'warning');
      return;
    }

    setIsLoading(true);
    const success = await createTransaction({
      type,
      amount,
      categoryId,
      description: description.trim(),
      transactionDate: new Date().toISOString(),
    });
    setIsLoading(false);

    if (success) {
      onBack();
    } else {
      showAlert('Error', 'Gagal mencatat transaksi, silakan coba lagi.', undefined, 'error');
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

        <View className="flex-row items-center gap-2">
          <Image
            source={require('../../assets/logo.png')}
            style={{ width: 24, height: 24, borderRadius: 6 }}
            resizeMode="contain"
          />
          <Text className="text-white text-lg font-bold">Catat Transaksi</Text>
        </View>

        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Type Toggle Switcher (Stitch Screen 3) */}
        <View className="flex-row bg-[#171c2a] border border-[#262a3a] p-1 rounded-2xl mb-5">
          <TouchableOpacity
            onPress={() => setType('EXPENSE')}
            className={`flex-1 py-3 rounded-xl items-center ${
              type === 'EXPENSE' ? 'bg-[#ff5c5c]/20 border border-[#ff5c5c]/40' : ''
            }`}
          >
            <View className="flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-[#ff5c5c]" />
              <Text
                className={`text-xs font-bold uppercase tracking-wider ${
                  type === 'EXPENSE' ? 'text-[#ff5c5c]' : 'text-[#8e96a8]'
                }`}
              >
                Pengeluaran
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setType('INCOME')}
            className={`flex-1 py-3 rounded-xl items-center ${
              type === 'INCOME' ? 'bg-[#10e57a]/20 border border-[#10e57a]/40' : ''
            }`}
          >
            <View className="flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-[#10e57a]" />
              <Text
                className={`text-xs font-bold uppercase tracking-wider ${
                  type === 'INCOME' ? 'text-[#10e57a]' : 'text-[#8e96a8]'
                }`}
              >
                Pemasukan
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Enter Amount Card */}
        <View className="bg-[#171c2a] border border-[#262a3a] rounded-3xl p-5 mb-5 items-center">
          <Text className="text-[#8e96a8] text-[11px] font-bold uppercase tracking-wider mb-2">
            MASUKKAN NOMINAL
          </Text>

          <View className="flex-row items-baseline justify-center mb-4">
            <Text className="text-[#8e96a8] text-xl font-bold mr-1.5">Rp</Text>
            <TextInput
              placeholder="0"
              placeholderTextColor="#4b5563"
              keyboardType="numeric"
              value={amount ? amount.toLocaleString('id-ID') : ''}
              onChangeText={(text) => {
                const numericOnly = text.replace(/[^0-9]/g, '');
                setAmount(numericOnly ? parseInt(numericOnly, 10) : 0);
              }}
              className={`text-3xl font-extrabold min-w-[140px] text-center ${
                type === 'EXPENSE' ? 'text-white' : 'text-[#10e57a]'
              }`}
            />
          </View>

          {/* Quick Amount Increment Pills */}
          <View className="flex-row gap-2">
            {[10000, 50000, 100000, 500000].map((quick) => (
              <TouchableOpacity
                key={quick}
                onPress={() => addQuickAmount(quick)}
                className="px-3 py-1.5 rounded-full bg-[#262a36] border border-[#303546] active:opacity-75"
              >
                <Text className="text-[#dfe2f2] text-xs font-semibold">
                  +{quick >= 1000 ? `${quick / 1000}k` : quick}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category Picker Chips */}
        <Text className="text-white text-xs font-bold uppercase tracking-wider mb-2.5">
          Kategori
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-5"
          contentContainerStyle={{ flexDirection: 'row' }}
        >
          {filteredCategories.map((c) => {
            const isSelected = categoryId === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setCategoryId(c.id)}
                className={`mr-2.5 px-3.5 py-2.5 rounded-2xl flex-row items-center border ${
                  isSelected
                    ? 'bg-[#10e57a]/20 border-[#10e57a]'
                    : 'bg-[#171c2a] border-[#262a3a]'
                }`}
              >
                <View
                  className="w-7 h-7 rounded-lg items-center justify-center mr-2"
                  style={{ backgroundColor: `${c.color || '#10e57a'}25` }}
                >
                  <Ionicons name="pricetag-outline" size={14} color={c.color || '#10e57a'} />
                </View>
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-white' : 'text-[#8e96a8]'
                  }`}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Description Field */}
        <Text className="text-white text-xs font-bold uppercase tracking-wider mb-2">
          Catatan / Deskripsi
        </Text>
        <View className="bg-[#171c2a] border border-[#262a3a] rounded-2xl p-4 mb-6">
          <TextInput
            placeholder="Contoh: Makan Siang, Tiket Kereta, Gaji Bulanan..."
            placeholderTextColor="#6b7280"
            value={description}
            onChangeText={setDescription}
            className="text-white text-sm"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          className="w-full bg-[#10e57a] py-4 rounded-full items-center shadow-lg active:opacity-90 flex-row justify-center"
          style={{
            shadowColor: '#10e57a',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.45,
            shadowRadius: 14,
            elevation: 8,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#00210c" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#00210c" />
              <Text className="text-[#00210c] font-bold text-base ml-2">
                Simpan Transaksi
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
