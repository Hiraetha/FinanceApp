import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../stores/financeStore';
import { formatCurrency, api } from '../services/api';

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const ReportsScreen: React.FC = () => {
  const { monthlyReport, fetchMonthlyReport, isLoading } = useFinanceStore();
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const currentMonth = selectedDate.getMonth() + 1;
  const currentYear = selectedDate.getFullYear();
  const monthLabel = `${MONTH_NAMES[selectedDate.getMonth()]} ${currentYear}`;

  const loadData = async (m: number, y: number) => {
    await fetchMonthlyReport(m, y);
    try {
      const res = await api.get('/reports/category', {
        params: { month: m, year: y, type: 'EXPENSE' },
      });
      setCategoryBreakdown(res.data?.data?.categories || []);
    } catch {
      setCategoryBreakdown([]);
    }
  };

  useEffect(() => {
    loadData(currentMonth, currentYear);
  }, [selectedDate, timeframe]);

  const handlePrev = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      if (timeframe === 'Yearly') {
        d.setFullYear(d.getFullYear() - 1);
      } else {
        d.setMonth(d.getMonth() - 1);
      }
      return d;
    });
  };

  const handleNext = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      if (timeframe === 'Yearly') {
        d.setFullYear(d.getFullYear() + 1);
      } else {
        d.setMonth(d.getMonth() + 1);
      }
      return d;
    });
  };

  // Safely parse actual numbers without hardcoded mock fallbacks (defaults strictly to 0 for new accounts)
  const rawIncome =
    typeof (monthlyReport as any)?.income === 'object'
      ? (monthlyReport as any)?.income?.total
      : (monthlyReport as any)?.income;
  const incomeTotal =
    rawIncome !== undefined && rawIncome !== null ? parseFloat(String(rawIncome)) || 0 : 0;

  const rawExpense =
    typeof (monthlyReport as any)?.expense === 'object'
      ? (monthlyReport as any)?.expense?.total
      : (monthlyReport as any)?.expense;
  const expenseTotal =
    rawExpense !== undefined && rawExpense !== null ? parseFloat(String(rawExpense)) || 0 : 0;

  const netSavings = incomeTotal - expenseTotal;
  const savingsRate =
    incomeTotal > 0 ? Math.max(0, Math.round((netSavings / incomeTotal) * 100)) : 0;

  const getInsight = () => {
    if (incomeTotal === 0 && expenseTotal === 0) {
      return `Belum ada catatan transaksi pada ${monthLabel}. Mulai catat transaksi harian untuk memantau performa keuangan Anda.`;
    }
    if (netSavings > 0) {
      return `Arus kas Anda surplus ${formatCurrency(netSavings)} pada ${monthLabel} dengan rasio tabungan ${savingsRate}%. Pertahankan kebiasaan positif ini!`;
    }
    if (netSavings < 0) {
      return `Pengeluaran melebihi pemasukan sebesar ${formatCurrency(Math.abs(netSavings))} pada ${monthLabel}. Evaluasi pos pengeluaran terbesar Anda.`;
    }
    return `Pemasukan dan pengeluaran Anda seimbang pada ${monthLabel}. Usahakan mulai menyisihkan tabungan ke pos tujuan Anda.`;
  };

  return (
    <ScrollView
      className="flex-1 bg-[#0f131e]"
      contentContainerStyle={{ paddingBottom: 150 }}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => loadData(currentMonth, currentYear)}
          tintColor="#10e57a"
        />
      }
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

        {/* Title & Interactive Month Selector */}
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-[#8e96a8] text-[10px] font-bold uppercase tracking-wider">
              ANALITIK & ARUS KAS
            </Text>
            <Text className="text-white text-2xl font-bold tracking-tight">Laporan Keuangan</Text>
          </View>
          <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#171c2a] border border-[#262a3a]">
            <TouchableOpacity
              onPress={handlePrev}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="p-1 active:opacity-60"
            >
              <Ionicons name="chevron-back" size={14} color="#8e96a8" />
            </TouchableOpacity>
            <Text className="text-white text-xs font-semibold min-w-[90px] text-center">
              {timeframe === 'Yearly' ? `${currentYear}` : monthLabel}
            </Text>
            <TouchableOpacity
              onPress={handleNext}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="p-1 active:opacity-60"
            >
              <Ionicons name="chevron-forward" size={14} color="#8e96a8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Timeframe Chips */}
        <View className="flex-row gap-2 mb-4">
          {(['Weekly', 'Monthly', 'Yearly'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTimeframe(t)}
              className={`flex-1 py-1.5 rounded-full items-center border ${
                timeframe === t
                  ? 'bg-[#262a36] border-[#10e57a]'
                  : 'bg-[#171c2a] border-[#262a3a]'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  timeframe === t ? 'text-white' : 'text-[#8e96a8]'
                }`}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dual Metric Cards */}
        <View className="flex-row gap-2.5 mb-3">
          <View className="flex-1 rounded-2xl bg-[#171c2a] border border-[#262a3a] p-3.5">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-[#8e96a8] text-[10px] uppercase font-bold">TOTAL PEMASUKAN</Text>
              <Ionicons name="arrow-down-circle" size={16} color="#10e57a" />
            </View>
            <Text className="text-white text-base font-bold mb-1">
              {formatCurrency(incomeTotal)}
            </Text>
            <Text
              className={`text-[10px] font-semibold ${
                incomeTotal > 0 ? 'text-[#10e57a]' : 'text-[#8e96a8]'
              }`}
            >
              {incomeTotal > 0 ? 'Pemasukan aktif' : 'Belum ada data'}
            </Text>
          </View>

          <View className="flex-1 rounded-2xl bg-[#171c2a] border border-[#262a3a] p-3.5">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-[#8e96a8] text-[10px] uppercase font-bold">TOTAL PENGELUARAN</Text>
              <Ionicons name="arrow-up-circle" size={16} color="#ff5c5c" />
            </View>
            <Text className="text-white text-base font-bold mb-1">
              {formatCurrency(expenseTotal)}
            </Text>
            <Text
              className={`text-[10px] font-semibold ${
                expenseTotal > 0 ? 'text-[#ff5c5c]' : 'text-[#8e96a8]'
              }`}
            >
              {expenseTotal > 0 ? 'Pengeluaran aktif' : 'Belum ada data'}
            </Text>
          </View>
        </View>

        {/* Net Savings Hero Card */}
        <View className="rounded-2xl bg-[#171c2a] border border-[#262a3a] p-4 mb-4">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-[#8e96a8] text-[10px] uppercase font-bold tracking-wider">
              TABUNGAN BERSIH
            </Text>
            <View className="px-2.5 py-0.5 rounded-full bg-[#10e57a]/15">
              <Text className="text-[#10e57a] text-[10px] font-bold">
                Rasio Tabungan: {savingsRate}%
              </Text>
            </View>
          </View>
          <Text
            className={`text-2xl font-extrabold tracking-tight mt-1 ${
              netSavings >= 0 ? 'text-[#10e57a]' : 'text-[#ff5c5c]'
            }`}
          >
            {netSavings >= 0
              ? `+${formatCurrency(netSavings)}`
              : `-${formatCurrency(Math.abs(netSavings))}`}
          </Text>
        </View>

        {/* Spending by Category */}
        <View className="rounded-2xl bg-[#171c2a] border border-[#262a3a] p-4 mb-4">
          <Text className="text-white text-sm font-bold mb-1">Pengeluaran per Kategori</Text>
          <Text className="text-[#8e96a8] text-xs mb-3.5">
            Proporsi pengeluaran aktif {monthLabel}
          </Text>

          {categoryBreakdown.length > 0 ? (
            categoryBreakdown.map((item, index) => {
              const pct = Math.round(item.percentage ?? 0);
              const color = item.color || item.category?.color || '#10e57a';
              const name = item.name || item.category?.name || 'Kategori';
              const totalVal = parseFloat(String(item.total || 0));
              return (
                <View key={item.id || item.category?.id || index} className="mb-3">
                  <View className="flex-row justify-between items-center mb-1">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <Text className="text-white text-xs font-semibold">
                        {name}
                      </Text>
                    </View>
                    <Text className="text-white text-xs font-bold">
                      {formatCurrency(totalVal)}{' '}
                      <Text className="text-[#8e96a8] font-normal">({pct}%)</Text>
                    </Text>
                  </View>
                  <View className="w-full h-1.5 rounded-full bg-[#262a36] overflow-hidden">
                    <View
                      style={{ width: `${pct}%`, backgroundColor: color }}
                      className="h-full rounded-full"
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <View className="py-6 items-center">
              <View className="w-10 h-10 rounded-full bg-[#262a36] items-center justify-center mb-2">
                <Ionicons name="pie-chart-outline" size={20} color="#8e96a8" />
              </View>
              <Text className="text-[#8e96a8] text-xs font-medium">
                Belum ada data pengeluaran pada {monthLabel}
              </Text>
            </View>
          )}
        </View>

        {/* Smart AI Insight Box */}
        <View className="rounded-2xl bg-[#171c2a] border border-[#262a3a] p-4 flex-row items-start gap-3">
          <View className="w-9 h-9 rounded-xl bg-[#10e57a]/20 items-center justify-center flex-shrink-0">
            <Ionicons name="bulb-outline" size={18} color="#10e57a" />
          </View>
          <View className="flex-1">
            <Text className="text-[#10e57a] text-xs font-bold uppercase tracking-wider mb-0.5">
              SMART AI INSIGHT
            </Text>
            <Text className="text-[#dfe2f2] text-xs leading-5">
              {getInsight()}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
