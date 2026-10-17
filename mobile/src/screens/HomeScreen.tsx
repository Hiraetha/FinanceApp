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
import { useAuthStore } from '../stores/authStore';
import { useFinanceStore } from '../stores/financeStore';
import { formatCurrency } from '../services/api';
import { showAlert } from '../stores/alertStore';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { user, logout } = useAuthStore();
  const { dashboard, fetchDashboard, isLoading } = useFinanceStore();
  const [hideBalance, setHideBalance] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const healthScore = dashboard?.financialHealth?.score ?? 0;
  const healthStatus = dashboard?.financialHealth?.status ?? (healthScore > 0 ? 'HEALTHY' : 'UNRATED');
  const rawBalance =
    parseFloat((dashboard as any)?.currentBalance || dashboard?.balance || '0') || 0;
  const incomeVal =
    parseFloat((dashboard as any)?.monthlySummary?.income || dashboard?.monthSummary?.income || '0') || 0;
  const expenseVal =
    parseFloat((dashboard as any)?.monthlySummary?.expense || dashboard?.monthSummary?.expense || '0') || 0;
  const netSavingsVal =
    parseFloat((dashboard as any)?.monthlySummary?.net || dashboard?.monthSummary?.netSavings || '0') ||
    incomeVal - expenseVal;

  const totalBudget =
    parseFloat(
      (dashboard as any)?.budgetSummary?.totalBudget ||
        (dashboard?.budgets as any)?.totalBudget ||
        '0',
    ) || 0;
  const totalSpent =
    parseFloat(
      (dashboard as any)?.budgetSummary?.totalUsed ||
        (dashboard?.budgets as any)?.totalSpent ||
        '0',
    ) || expenseVal;
  const budgetRatio =
    (dashboard as any)?.budgetSummary?.percentage !== undefined
      ? Math.round((dashboard as any).budgetSummary.percentage)
      : (totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0);
  const budgetLeft =
    parseFloat((dashboard as any)?.budgetSummary?.totalRemaining || '0') ||
    Math.max(totalBudget - totalSpent, 0);
  const runwayDays =
    (dashboard as any)?.runway?.estimatedDays ?? dashboard?.moneyRunway?.runwayDays ?? dashboard?.financialHealth?.runwayDays ?? 0;
  const savingsRateVal =
    dashboard?.financialHealth?.savingsRate !== undefined
      ? Math.round(dashboard.financialHealth.savingsRate)
      : (incomeVal > 0 ? Math.max(0, Math.min(100, Math.round(((incomeVal - expenseVal) / incomeVal) * 100))) : 0);
  const disciplineVal =
    (dashboard?.financialHealth as any)?.budgetAdherence !== undefined
      ? Math.round((dashboard?.financialHealth as any).budgetAdherence)
      : (totalBudget > 0 ? Math.max(0, Math.min(100, 100 - Math.max(0, budgetRatio - 100))) : 0);
  const emergencyReserveText =
    runwayDays > 0
      ? runwayDays >= 30
        ? `${(runwayDays / 30).toFixed(1)} Bulan Runway`
        : `${runwayDays} Hari Runway`
      : '0 Hari Runway';

  return (
    <ScrollView
      className="flex-1 bg-[#0f131e]"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={fetchDashboard}
          tintColor="#10e57a"
        />
      }
    >
      <View className="px-5 pt-12 pb-40">
        {/* Top Header - Stitch Navigation Bar */}
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-row items-center gap-2.5">
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 32, height: 32, borderRadius: 9 }}
              resizeMode="contain"
            />
            <Text className="text-white text-lg font-bold tracking-tight">
              My Finance
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => onNavigate('reports')}
              className="w-10 h-10 rounded-full bg-[#171c2a] border border-[#262a3a] items-center justify-center relative active:opacity-75"
            >
              <Ionicons name="notifications-outline" size={20} color="#dfe2f2" />
              <View className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#10e57a]" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                showAlert(
                  'Konfirmasi Keluar',
                  'Apakah Anda yakin ingin keluar dari akun My Finance?',
                  [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Keluar', style: 'destructive', onPress: () => logout() },
                  ],
                  'warning',
                );
              }}
              className="w-10 h-10 rounded-full bg-[#171c2a] border border-[#262a3a] items-center justify-center active:opacity-75"
            >
              <Ionicons name="log-out-outline" size={20} color="#8e96a8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Salutation & Header Context */}
        <View className="flex-row items-center justify-between mb-5">
          <View>
            <Text className="text-[#8e96a8] text-[11px] uppercase tracking-wider font-semibold">
              DASHBOARD
            </Text>
            <Text className="text-white text-2xl font-bold tracking-tight mt-0.5">
              Selamat datang, {user?.name?.split(' ')[0] || 'User'}
            </Text>
          </View>

          <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b1f2b] border border-[#2a2f42]">
            <View className="w-2 h-2 rounded-full bg-[#10e57a]" />
            <Text className="text-white text-xs font-medium">Live Synced</Text>
          </View>
        </View>

        {/* Hero Wealth Card (Stitch Screen 2) */}
        <View
          className="rounded-[24px] bg-[#171c2a] border border-[#262a3a] p-5 mb-4 relative overflow-hidden"
          style={{
            shadowColor: '#10e57a',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.18,
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          {/* Decorative Circles & Glowing Rings */}
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
            className="absolute top-7 right-24 w-2 h-2 rounded-full bg-[#10e57a]/40"
          />
          <View
            pointerEvents="none"
            className="absolute bottom-24 right-10 w-1.5 h-1.5 rounded-full bg-[#10e57a]/30"
          />

          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-[#8e96a8] text-xs font-medium tracking-wide">
              Total Saldo
            </Text>
            <TouchableOpacity
              onPress={() => setHideBalance(!hideBalance)}
              className="w-8 h-8 rounded-full items-center justify-center text-[#8e96a8] active:opacity-75"
            >
              <Ionicons
                name={hideBalance ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#8e96a8"
              />
            </TouchableOpacity>
          </View>

          <Text className="text-white text-3xl font-extrabold tracking-tight mb-2">
            {hideBalance ? 'Rp ••••••••' : formatCurrency(rawBalance)}
          </Text>

          <View className="inline-flex flex-row items-center self-start gap-1.5 px-2.5 py-1 rounded-full bg-[#262a36] border border-[#303546] mb-5">
            <Ionicons name="trending-up" size={14} color="#10e57a" />
            <Text className="text-[#10e57a] text-xs font-semibold">
              {netSavingsVal >= 0 ? '+' : ''}{formatCurrency(netSavingsVal)}
            </Text>
            <Text className="text-[#8e96a8] text-[11px]">bulan ini</Text>
          </View>

          {/* Quick Actions Grid */}
          <View className="flex-row justify-around pt-3 border-t border-[#262a3a]">
            <TouchableOpacity
              onPress={() => onNavigate('add-transaction')}
              className="items-center active:scale-95 transition-transform"
            >
              <View className="w-12 h-12 rounded-full bg-[#262a36] border border-[#303546] items-center justify-center mb-1.5 shadow-sm">
                <Ionicons name="arrow-down" size={20} color="#10e57a" />
              </View>
              <Text className="text-[#dfe2f2] text-xs font-medium">Pemasukan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onNavigate('add-transaction')}
              className="items-center active:scale-95 transition-transform"
            >
              <View className="w-12 h-12 rounded-full bg-[#262a36] border border-[#303546] items-center justify-center mb-1.5 shadow-sm">
                <Ionicons name="arrow-up" size={20} color="#ff5c5c" />
              </View>
              <Text className="text-[#dfe2f2] text-xs font-medium">Pengeluaran</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onNavigate('simulator')}
              className="items-center active:scale-95 transition-transform"
            >
              <View className="w-12 h-12 rounded-full bg-[#262a36] border border-[#303546] items-center justify-center mb-1.5 shadow-sm">
                <Ionicons name="calculator-outline" size={20} color="#c1c5dc" />
              </View>
              <Text className="text-[#dfe2f2] text-xs font-medium">Boleh Beli?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Monthly Metric Triptych */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 rounded-2xl bg-[#171c2a] border border-[#262a3a] p-3">
            <View className="flex-row items-center gap-1.5 mb-1">
              <View className="w-1.5 h-1.5 rounded-full bg-[#10e57a]" />
              <Text className="text-[#8e96a8] text-[11px] font-medium">Pemasukan</Text>
            </View>
            <Text className="text-[#10e57a] text-xs font-bold truncate">
              {formatCurrency(incomeVal)}
            </Text>
          </View>

          <View className="flex-1 rounded-2xl bg-[#171c2a] border border-[#262a3a] p-3">
            <View className="flex-row items-center gap-1.5 mb-1">
              <View className="w-1.5 h-1.5 rounded-full bg-[#ff5c5c]" />
              <Text className="text-[#8e96a8] text-[11px] font-medium">Pengeluaran</Text>
            </View>
            <Text className="text-[#ff5c5c] text-xs font-bold truncate">
              {formatCurrency(expenseVal)}
            </Text>
          </View>

          <View className="flex-1 rounded-2xl bg-[#171c2a] border border-[#262a3a] p-3">
            <View className="flex-row items-center gap-1.5 mb-1">
              <View className="w-1.5 h-1.5 rounded-full bg-[#6fff9e]" />
              <Text className="text-[#8e96a8] text-[11px] font-medium">Net Surplus</Text>
            </View>
            <Text className="text-[#6fff9e] text-xs font-bold truncate">
              {netSavingsVal >= 0 ? '+' : ''}{formatCurrency(netSavingsVal)}
            </Text>
          </View>
        </View>

        {/* Monthly Status Card */}
        <TouchableOpacity
          onPress={() => onNavigate('reports')}
          activeOpacity={0.8}
          className="rounded-2xl bg-[#171c2a] border border-[#262a3a] p-4 mb-4 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-10 h-10 rounded-xl bg-[#262a36] items-center justify-center mr-3 flex-shrink-0">
              <Ionicons name="shield-checkmark" size={20} color="#10e57a" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-0.5">
                <Text className="text-white text-xs font-semibold">Status Bulanan</Text>
                <View className="px-2 py-0.5 rounded bg-[#10e57a]/20">
                  <Text className="text-[#10e57a] text-[10px] font-bold">
                    {netSavingsVal >= 0 ? 'SURPLUS' : 'DEFISIT'}
                  </Text>
                </View>
              </View>
              <Text className="text-[#8e96a8] text-[11px]" numberOfLines={1}>
                {netSavingsVal >= 0
                  ? 'Pemasukan melebihi pengeluaran periode ini.'
                  : 'Pengeluaran melebihi pemasukan bulan ini.'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8e96a8" />
        </TouchableOpacity>

        {/* Financial Health Widget - Stitch Design */}
        <TouchableOpacity
          onPress={() => onNavigate('reports')}
          activeOpacity={0.88}
          className="rounded-2xl bg-[#171c2a] border border-[#262a3a] p-4 mb-5 shadow-xl"
        >
          {/* Card Header */}
          <View className="flex-row items-center justify-between mb-3.5">
            <View className="flex-row items-center gap-2">
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={healthScore === 0 ? '#8e96a8' : '#10e57a'}
              />
              <Text className="text-white text-base font-bold tracking-tight">
                Financial Health 
              </Text>
            </View>
            <View
              className="px-2.5 py-0.5 rounded"
              style={{
                backgroundColor:
                  healthScore === 0
                    ? 'rgba(142, 150, 168, 0.15)'
                    : healthScore >= 80
                    ? 'rgba(16, 229, 122, 0.15)'
                    : healthScore >= 60
                    ? 'rgba(59, 130, 246, 0.15)'
                    : healthScore >= 40
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
              }}
            >
              <Text
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{
                  color:
                    healthScore === 0
                      ? '#8e96a8'
                      : healthScore >= 80
                      ? '#10e57a'
                      : healthScore >= 60
                      ? '#3b82f6'
                      : healthScore >= 40
                      ? '#f59e0b'
                      : '#ef4444',
                }}
              >
                {healthScore === 0 ? 'UNRATED' : (healthStatus || 'EXCELLENT')}
              </Text>
            </View>
          </View>

          {/* Card Body: Circular Gauge + Metrics Grid */}
          <View className="flex-row items-center">
            {/* Circular Gauge */}
            <View className="relative w-[74px] h-[74px] items-center justify-center flex-shrink-0">
              {/* Background Track Circle */}
              <View
                className="absolute w-[72px] h-[72px] rounded-full"
                style={{
                  borderWidth: 4,
                  borderColor: '#262a36',
                }}
              />

              {/* Active Neon Arc - only display if healthScore > 0 */}
              {healthScore > 0 && (
                <View
                  className="absolute w-[72px] h-[72px] rounded-full"
                  style={{
                    borderWidth: 4.5,
                    borderColor:
                      healthScore >= 80
                        ? '#10e57a'
                        : healthScore >= 60
                        ? '#3b82f6'
                        : healthScore >= 40
                        ? '#f59e0b'
                        : '#ef4444',
                    borderBottomColor: 'transparent',
                    borderLeftColor:
                      healthScore < 70
                        ? 'transparent'
                        : healthScore >= 80
                        ? '#10e57a'
                        : '#3b82f6',
                    transform: [{ rotate: '-45deg' }],
                    shadowColor: healthScore >= 80 ? '#10e57a' : '#3b82f6',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 6,
                    elevation: 4,
                  }}
                />
              )}

              {/* Center Score */}
              <View className="items-center justify-center">
                <Text
                  className={`text-base font-extrabold tracking-tight ${
                    healthScore === 0 ? 'text-[#8e96a8]' : 'text-white'
                  }`}
                >
                  {healthScore}
                </Text>
                <Text className="text-[#8e96a8] text-[9px] font-medium -mt-1">
                  /100
                </Text>
              </View>
            </View>

            {/* Health Pillars */}
            <View className="flex-1 ml-4 justify-between">
              <View className="flex-row justify-between mb-2">
                <View className="flex-1">
                  <Text className="text-[#8e96a8] text-[11px] font-medium">Savings Rate</Text>
                  <Text
                    className={`text-base font-bold mt-0.5 ${
                      savingsRateVal > 0 ? 'text-[#10e57a]' : 'text-[#8e96a8]'
                    }`}
                  >
                    {savingsRateVal}%
                  </Text>
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-[#8e96a8] text-[11px] font-medium">Discipline</Text>
                  <Text
                    className={`text-base font-bold mt-0.5 ${
                      disciplineVal > 0 ? 'text-white' : 'text-[#8e96a8]'
                    }`}
                  >
                    {disciplineVal}%
                  </Text>
                </View>
              </View>

              <View>
                <Text className="text-[#8e96a8] text-[11px] font-medium">Emergency Reserve</Text>
                <Text
                  className={`text-sm font-semibold mt-0.5 ${
                    runwayDays > 0 ? 'text-white' : 'text-[#8e96a8]'
                  }`}
                >
                  {emergencyReserveText}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Recent Transactions Section */}
        <View className="mb-2">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white text-base font-bold">Transaksi Terakhir</Text>
            <TouchableOpacity onPress={() => onNavigate('transactions')}>
              <Text className="text-[#10e57a] text-xs font-semibold">Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {dashboard?.recentTransactions && dashboard.recentTransactions.length > 0 ? (
            dashboard.recentTransactions.slice(0, 5).map((tx) => {
              const isExpense = tx.type === 'EXPENSE';
              const dateStr = tx.transactionDate
                ? new Date(tx.transactionDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                  })
                : 'Hari ini';
              return (
                <View
                  key={tx.id}
                  className="bg-[#171c2a] border border-[#262a3a] rounded-2xl p-3.5 mb-2.5 flex-row items-center justify-between shadow-sm"
                >
                  <View className="flex-row items-center flex-1 mr-3">
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
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
                  <Text
                    className={`text-sm font-bold ${
                      isExpense ? 'text-[#ff5c5c]' : 'text-[#10e57a]'
                    }`}
                  >
                    {isExpense ? '-' : '+'}{formatCurrency(tx.amount)}
                  </Text>
                </View>
              );
            })
          ) : (
            <View className="bg-[#171c2a] border border-[#262a3a] rounded-2xl p-6 items-center justify-center">
              <Text className="text-[#8e96a8] text-xs">Belum ada transaksi tercatat</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
