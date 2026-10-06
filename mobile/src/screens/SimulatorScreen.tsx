import React, { useState } from 'react';
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
import { formatCurrency } from '../services/api';
import { PurchasePrediction } from '../types';

export const SimulatorScreen: React.FC = () => {
  const { analyzePurchase } = useFinanceStore();
  const [productName, setProductName] = useState('Sony WH-1000XM5');
  const [priceStr, setPriceStr] = useState('2450000');
  const [result, setResult] = useState<PurchasePrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    const price = parseFloat(priceStr.replace(/[^0-9]/g, ''));
    if (!productName.trim()) {
      showAlert('Peringatan', 'Masukkan nama barang yang ingin dibeli', undefined, 'warning');
      return;
    }
    if (!price || price <= 0) {
      showAlert('Peringatan', 'Masukkan estimasi harga barang', undefined, 'warning');
      return;
    }

    setIsLoading(true);
    const pred = await analyzePurchase(productName.trim(), price);
    setIsLoading(false);
    if (pred) {
      setResult(pred);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SAFE':
        return '#10e57a';
      case 'CONSIDER':
      case 'WARNING':
        return '#f59e0b';
      case 'NOT_RECOMMENDED':
      case 'DANGER':
      default:
        return '#ff5c5c';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SAFE':
        return 'AMAN DIBELI';
      case 'CONSIDER':
      case 'WARNING':
        return 'PERTIMBANGKAN';
      case 'NOT_RECOMMENDED':
      case 'DANGER':
      default:
        return 'TIDAK DISARANKAN';
    }
  };

  const balanceAfter = result
    ? result.balanceAfterPurchase !== undefined
      ? parseFloat(String(result.balanceAfterPurchase))
      : (result as any).balanceAfter !== undefined
      ? parseFloat(String((result as any).balanceAfter))
      : 0
    : 0;

  const balanceBefore = result
    ? result.currentBalance !== undefined
      ? parseFloat(String(result.currentBalance))
      : (result as any).balanceBefore !== undefined
      ? parseFloat(String((result as any).balanceBefore))
      : 0
    : 0;

  const runwayDays = result?.runwayAfterDays !== undefined ? result.runwayAfterDays : 0;

  return (
    <ScrollView
      className="flex-1 bg-[#0f131e]"
      contentContainerStyle={{ paddingBottom: 150 }}
    >
      <View className="px-5 pt-12">
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

        {/* AI Badge & Title (Stitch Screen 5) */}
        <View className="flex-row items-center gap-2 mb-2">
          <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-[#171c2a] border border-[#262a3a]">
            <View className="w-2 h-2 rounded-full bg-[#10e57a]" />
            <Text className="text-white text-[11px] font-semibold">
              AI Simulation • Live Forecast
            </Text>
          </View>
        </View>

        <Text className="text-white text-2xl font-bold tracking-tight">Can I Buy It?</Text>
        <Text className="text-[#8e96a8] text-xs mt-1 mb-4">
          Uji ketahanan runway dan buffer tabungan sebelum Anda memutuskan checkout.
        </Text>

        {/* Target Item Input Card */}
        <View className="bg-[#171c2a] border border-[#262a3a] rounded-3xl p-5 mb-4 shadow-xl">
          <View className="mb-3.5">
            <Text className="text-[#8e96a8] text-[10px] font-bold uppercase tracking-wider mb-1.5">
              TARGET ITEM
            </Text>
            <View className="bg-[#0f131e] border border-[#262a3a] rounded-2xl px-4 py-2.5">
              <TextInput
                placeholder="Contoh: Sony WH-1000XM5 / Gadget"
                placeholderTextColor="#6b7280"
                value={productName}
                onChangeText={setProductName}
                className="text-white text-sm"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-[#8e96a8] text-[10px] font-bold uppercase tracking-wider mb-1.5">
              ESTIMASI HARGA (IDR)
            </Text>
            <View className="flex-row items-center bg-[#0f131e] border border-[#262a3a] rounded-2xl px-4 py-2.5">
              <Text className="text-[#8e96a8] font-bold mr-1.5">Rp</Text>
              <TextInput
                placeholder="0"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                value={
                  priceStr
                    ? parseInt(priceStr.replace(/[^0-9]/g, '') || '0', 10).toLocaleString('id-ID')
                    : ''
                }
                onChangeText={(text) => setPriceStr(text.replace(/[^0-9]/g, ''))}
                className="text-white text-base font-bold flex-1"
              />
            </View>
          </View>

          {/* Quick Tweak Pills */}
          <View className="flex-row gap-2 mb-4">
            {[1000000, 2450000, 5000000].map((tweak) => (
              <TouchableOpacity
                key={tweak}
                onPress={() => setPriceStr(tweak.toString())}
                className="px-3 py-1.5 rounded-full bg-[#262a36] border border-[#303546] active:opacity-75"
              >
                <Text className="text-[#dfe2f2] text-xs font-semibold">
                  Rp {tweak >= 1000000 ? `${tweak / 1000000}M` : tweak}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleAnalyze}
            disabled={isLoading}
            className="w-full bg-[#10e57a] py-3.5 rounded-full items-center shadow-lg active:opacity-90 flex-row justify-center"
            style={{
              shadowColor: '#10e57a',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#00210c" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#00210c" />
                <Text className="text-[#00210c] font-bold text-sm ml-2">
                  Jalankan Simulasi AI
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Result Card */}
        {result && (
          <View className="bg-[#171c2a] border border-[#262a3a] rounded-3xl p-5 mb-4 shadow-xl">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-[#8e96a8] text-[10px] font-bold uppercase tracking-wider">
                HASIL SIMULASI PREDIKTIF
              </Text>
              <View
                className="px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${getStatusColor(result.status)}25` }}
              >
                <Text
                  className="text-xs font-bold uppercase"
                  style={{ color: getStatusColor(result.status) }}
                >
                  {getStatusLabel(result.status)}
                </Text>
              </View>
            </View>

            <Text className="text-white text-sm leading-6 mb-4 font-medium">
              {result.recommendation || (result as any).analysis}
            </Text>

            {/* Impact Metric Grid (Using flex-row flex-1 for proper React Native layout) */}
            <View className="flex-row gap-2.5 mb-3.5">
              <View className="flex-1 bg-[#0f131e] p-3.5 rounded-2xl border border-[#262a3a]">
                <Text className="text-[#8e96a8] text-[10px] font-bold uppercase tracking-wider">
                  Saldo Setelah Beli
                </Text>
                <Text
                  className={`text-base font-bold mt-1 ${
                    balanceAfter >= 0 ? 'text-white' : 'text-[#ff5c5c]'
                  }`}
                >
                  {balanceAfter >= 0
                    ? formatCurrency(balanceAfter)
                    : `-${formatCurrency(Math.abs(balanceAfter))}`}
                </Text>
              </View>

              <View className="flex-1 bg-[#0f131e] p-3.5 rounded-2xl border border-[#262a3a]">
                <Text className="text-[#8e96a8] text-[10px] font-bold uppercase tracking-wider">
                  Runway Kas Sisa
                </Text>
                <Text
                  className={`text-base font-bold mt-1 ${
                    runwayDays > 0 ? 'text-[#10e57a]' : 'text-[#ff5c5c]'
                  }`}
                >
                  {runwayDays} Hari
                </Text>
              </View>
            </View>

            {/* Balance vs Price Breakdown Bar */}
            <View className="bg-[#0f131e] p-3.5 rounded-2xl border border-[#262a3a] mb-3.5">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-[#8e96a8] text-xs">Saldo Saat Ini</Text>
                <Text className="text-white text-xs font-bold">
                  {formatCurrency(balanceBefore)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-[#8e96a8] text-xs">Estimasi Harga Barang</Text>
                <Text className="text-[#ff5c5c] text-xs font-bold">
                  -{formatCurrency(result.price)}
                </Text>
              </View>
              <View className="w-full h-1.5 rounded-full bg-[#262a36] overflow-hidden">
                <View
                  style={{
                    width: `${
                      balanceBefore <= 0
                        ? 0
                        : Math.min(
                            Math.round((balanceBefore / (result.price || 1)) * 100),
                            100
                          )
                    }%`,
                  }}
                  className={`h-full rounded-full ${
                    balanceAfter >= 0 ? 'bg-[#10e57a]' : 'bg-[#ff5c5c]'
                  }`}
                />
              </View>
            </View>

            {/* Recommended Action */}
            <View className="bg-[#1b1f2b] p-3.5 rounded-2xl border border-[#2a2f42] flex-row items-center gap-2.5">
              <Ionicons
                name={result.status === 'SAFE' ? 'checkmark-circle' : 'time-outline'}
                size={22}
                color={getStatusColor(result.status)}
              />
              <View className="flex-1">
                <Text className="text-white text-xs font-bold">Rekomendasi Tindakan:</Text>
                <Text className="text-[#8e96a8] text-[11px] mt-0.5 leading-4">
                  {result.delayDays && result.delayDays > 0
                    ? `Sebaiknya tunda pembelian sekitar ${result.delayDays} hari hingga saldo tabungan mencukupi.`
                    : 'Aman untuk dibeli sekarang tanpa mengganggu kebutuhan pokok Anda!'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};
