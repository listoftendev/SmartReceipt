import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdBanner from '../components/AdBanner';
import { initDB, getReceipts, Receipt } from '../services/db';
import { useSettings } from '../context/SettingsContext';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currency, budgetLimit, isDarkMode } = useSettings();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        await initDB();
        const data = await getReceipts();
        setReceipts(data);
      } catch (error) {
        console.error('Failed to load database', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalExpense = receipts.reduce((sum, item) => sum + item.amount, 0);

  // Budget Progress calculation
  const progress = budgetLimit > 0 ? Math.min(totalExpense / budgetLimit, 1) : 0;
  const isOverBudget = budgetLimit > 0 && totalExpense > budgetLimit;
  let progressColor = '#10B981'; // Green
  if (progress > 0.7) progressColor = '#F59E0B'; // Yellow
  if (progress >= 1) progressColor = '#EF4444'; // Red

  const bgColor = isDarkMode ? '#111827' : '#F9FAFB';
  const cardColor = isDarkMode ? '#1F2937' : '#FFFFFF';
  const textColor = isDarkMode ? '#F9FAFB' : '#111827';
  const subtextColor = isDarkMode ? '#9CA3AF' : '#6B7280';

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={{ flex: 1 }}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.subtitle, { color: subtextColor }]}>This Month</Text>
              <Text style={[styles.title, { color: textColor }]}>
                {currency}{totalExpense.toFixed(2)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => router.push('/reports')}
              >
                <Ionicons name="pie-chart" size={24} color="#4F46E5" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => router.push('/profile')}
              >
                <Ionicons name="person-circle" size={24} color="#10B981" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Budget Progress Bar */}
          {budgetLimit > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: subtextColor, fontSize: 14 }}>Budget Limit</Text>
                <Text style={{ color: isOverBudget ? '#EF4444' : subtextColor, fontSize: 14, fontWeight: 'bold' }}>
                  {currency}{totalExpense.toFixed(2)} / {currency}{budgetLimit.toFixed(2)}
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: progressColor }} />
              </View>
            </View>
          )}

          {/* Recent Activity */}
          <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Receipts</Text>
          
          {receipts.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
              <Ionicons name="receipt-outline" size={48} color={subtextColor} />
              <Text style={[styles.emptyText, { color: subtextColor }]}>No receipts yet. Tap the camera to scan your first receipt!</Text>
            </View>
          ) : (
            <FlatList
              data={receipts}
              keyExtractor={(item) => item.id!.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                  <View style={styles.cardLeft}>
                    <View style={styles.cardIcon}>
                      <Ionicons name="cart" size={20} color="#4F46E5" />
                    </View>
                    <View>
                      <Text style={[styles.vendorName, { color: textColor }]}>{item.vendor}</Text>
                      <Text style={[styles.dateCategory, { color: subtextColor }]}>{item.date} • {item.category}</Text>
                    </View>
                  </View>
                  <Text style={[styles.amount, { color: textColor }]}>{currency}{item.amount.toFixed(2)}</Text>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          )}
        </View>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/scanner')}
        >
          <Ionicons name="camera" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* AdMob Banner */}
      <View style={[styles.adContainer, { backgroundColor: bgColor, paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 0 : 16) }]}>
        <AdBanner />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  adContainer: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 24,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
  },
  iconButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    backgroundColor: '#EEF2FF',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  vendorName: {
    color: '#111827',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  dateCategory: {
    color: '#6B7280',
    fontSize: 12,
  },
  amount: {
    color: '#111827',
    fontWeight: 'bold',
    fontSize: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 24, 
    right: 24,
    backgroundColor: '#4F46E5',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }
});
