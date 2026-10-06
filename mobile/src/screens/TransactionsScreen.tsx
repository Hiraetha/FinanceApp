import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../stores/financeStore';
import { showAlert } from '../stores/alertStore';
import { formatCurrency } from '../services/api';

export const TransactionsScreen: React.FC = () => {
  const {
    transactions,
    fetchTransactions,
    deleteTransaction,
    isLoading,
    dashboard,
    fetchDashboard,
  } = useFinanceStore();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    fetchTransactions({
      type: filterType === 'ALL' ? undefined : filterType,
      search: search || undefined,
    });
  }, [filterType, search]);

  const handleDelete = (id: string, description: string) => {
    showAlert(
      'Hapus Transaksi',
      `Yakin ingin menghapus transaksi "${description}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => deleteTransaction(id),
        },
      ],
      'error',
    );
  };

  const rawIncome =
    dashboard?.monthlySummary?.income ??
    dashboard?.monthSummary?.income;
  const rawExpense =
    dashboard?.monthlySummary?.expense ??
    dashboard?.monthSummary?.expense;

  const incomeVal =
    rawIncome !== undefined && rawIncome !== null
      ? parseFloat(String(rawIncome)) || 0
      : 0;

  const expenseVal =
    rawExpense !== undefined && rawExpense !== null
      ? parseFloat(String(rawExpense)) || 0
      : 0;

  const totalFlow = incomeVal + expenseVal;
  const inPercent = totalFlow > 0 ? Math.round((incomeVal / totalFlow) * 100) : 0;

  return (
    <View className="flex-1 bg-[#0f131e]">
      {/* Top Header */}
      <View className="px-5 pt-12 pb-3">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2.5">
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 30, height: 30, borderRadius: 8 }}
              resizeMode="contain"
            />
            <Text className="text-white text-lg font-bold tracking-tight">My Finance</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-9 h-9 rounded-full bg-[#171c2a] border border-[#262a3a] items-center justify-center">
              <Ionicons name="notifications-outline" size={18} color="#dfe2f2" />
            </View>
          </View>
        </View>

        {/* Title */}
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-white text-2xl font-bold tracking-tight">Transaksi</Text>
            <Text className="text-[#8e96a8] text-xs mt-0.5">Aktivitas Arus Kas Real-Time</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-[#171c2a] border border-[#262a3a] items-center justify-center">
            <Ionicons name="download-outline" size={18} color="#10e57a" />
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#171c2a] border border-[#262a3a] rounded-2xl px-3.5 py-2.5 mb-3.5">
          <Ionicons name="search-outline" size={18} color="#8e96a8" />
          <TextInput
            placeholder="Cari transaksi, merchant, catatan..."
            placeholderTextColor="#6b7280"
            value={search}
            onChangeText={setSearch}
            className="flex-1 ml-2.5 text-white text-sm"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#8e96a8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <View className="flex-row gap-2 mb-3">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'INCOME', label: 'Pemasukan' },
            { id: 'EXPENSE', label: 'Pengeluaran' },
          ].map((tab) => {
            const active = filterType === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setFilterType(tab.id)}
                className={`px-4 py-1.5 rounded-full border ${
                  active
                    ? 'bg-[#10e57a] border-[#10e57a]'
                    : 'bg-[#171c2a] border-[#262a3a]'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    active ? 'text-[#00210c]' : 'text-[#8e96a8]'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Monthly Cashflow Overview (Stitch Screen 1) */}
        <View className="rounded-2xl bg-[#171c2a] border border-[#262a3a] p-4 mb-2">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[#8e96a8] text-[10px] uppercase font-bold tracking-wider">
              Arus Kas Bulanan
            </Text>
            <View className="px-2 py-0.5 rounded bg-[#262a36]">
              <Text className="text-[#dfe2f2] text-[10px] font-semibold">
                {transactions.length} Transaksi
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between mb-2.5">
            <View className="flex-row items-center gap-2">
              <View className="w-7 h-7 rounded-full bg-[#10e57a]/20 items-center justify-center">
                <Ionicons name="arrow-down" size={14} color="#10e57a" />
              </View>
              <View>
                <Text className="text-[#8e96a8] text-[10px]">Uang Masuk</Text>
                <Text className="text-[#10e57a] text-xs font-bold">
                  +{formatCurrency(incomeVal)}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <View className="w-7 h-7 rounded-full bg-[#ff5c5c]/20 items-center justify-center">
                <Ionicons name="arrow-up" size={14} color="#ff5c5c" />
              </View>
              <View>
                <Text className="text-[#8e96a8] text-[10px]">Uang Keluar</Text>
                <Text className="text-[#ff5c5c] text-xs font-bold">
                  -{formatCurrency(expenseVal)}
                </Text>
              </View>
            </View>
          </View>

          {/* Dual Bar Track */}
          <View className="w-full h-1.5 rounded-full bg-[#262a36] overflow-hidden flex-row">
            {totalFlow > 0 ? (
              <>
                <View style={{ width: `${inPercent}%` }} className="h-full bg-[#10e57a]" />
                <View style={{ flex: 1 }} className="h-full bg-[#ff5c5c]" />
              </>
            ) : (
              <View className="w-full h-full bg-[#303546]" />
            )}
          </View>
        </View>
      </View>

      {/* Transaction List */}
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 150 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              fetchDashboard();
              fetchTransactions({
                type: filterType === 'ALL' ? undefined : filterType,
                search: search || undefined,
              });
            }}
            tintColor="#10e57a"
          />
        }
      >
        {transactions.length > 0 ? (
          transactions.map((tx) => {
            const isExpense = tx.type === 'EXPENSE';
            const dateStr = tx.transactionDate
              ? new Date(tx.transactionDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Hari ini';

            return (
              <View
                key={tx.id}
                className="bg-[#171c2a] border border-[#262a3a] rounded-2xl p-3.5 mb-2.5 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                    style={{
                      backgroundColor: isExpense
                        ? 'rgba(255, 92, 92, 0.15)'
                        : 'rgba(16, 229, 122, 0.15)',
                    }}
                  >
                    <Ionicons
                      name={isExpense ? 'arrow-up' : 'arrow-down'}
                      size={18}
                      color={isExpense ? '#ff5c5c' : '#10e57a'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-sm font-semibold" numberOfLines={1}>
                      {tx.description}
                    </Text>
                    <Text className="text-[#8e96a8] text-[11px] mt-0.5">
                      {tx.category?.name || 'Umum'} • {dateStr}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text
                    className={`text-sm font-bold ${
                      isExpense ? 'text-[#ff5c5c]' : 'text-[#10e57a]'
                    }`}
                  >
                    {isExpense ? '-' : '+'}{formatCurrency(tx.amount)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDelete(tx.id, tx.description)}
                    className="mt-1"
                  >
                    <Ionicons name="trash-outline" size={14} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View className="bg-[#171c2a] border border-[#262a3a] rounded-2xl p-10 items-center justify-center mt-4">
            <Ionicons name="receipt-outline" size={40} color="#4b5563" />
            <Text className="text-white text-sm font-semibold mt-3">Tidak Ada Transaksi</Text>
            <Text className="text-[#8e96a8] text-xs text-center mt-1">
              {search
                ? 'Tidak ada transaksi yang cocok dengan kata kunci pencarian.'
                : 'Belum ada transaksi pada filter ini.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
