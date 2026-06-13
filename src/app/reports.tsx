import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, ActivityIndicator, StyleSheet, Platform, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AdBanner from '../components/AdBanner';
import { getReceipts, Receipt } from '../services/db';
import { useSettings } from '../context/SettingsContext';

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currency, categories: allCategories, isDarkMode } = useSettings();
  
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getReceipts();
      setReceipts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter(r => {
    const matchesSearch = r.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? r.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Group expenses by category
  const expensesByCategory = filteredReceipts.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const exportPDF = async () => {
    if (filteredReceipts.length === 0) {
      Alert.alert('No Data', 'You do not have any receipts to export.');
      return;
    }

    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; color: #4F46E5; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #E5E7EB; padding: 12px; text-align: left; }
              th { background-color: #F3F4F6; }
              .amount { font-weight: bold; }
              img { max-height: 60px; border-radius: 4px; object-fit: contain; }
            </style>
          </head>
          <body>
            <h1>Expense Report</h1>
            <table>
              <tr>
                <th>Date</th>
                <th>Vendor</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Image</th>
              </tr>
              ${filteredReceipts.map(r => `
                <tr>
                  <td>${r.date}</td>
                  <td>${r.vendor}</td>
                  <td>${r.category}</td>
                  <td class="amount">${currency}${r.amount.toFixed(2)}</td>
                  <td>${r.imageUri ? `<img src="${r.imageUri}" />` : '-'}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export PDF Report',
          UTI: 'com.adobe.pdf'
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not generate PDF file.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // Get a specific icon for categories
  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('food') || lower.includes('dining')) return 'restaurant';
    if (lower.includes('transport')) return 'bus';
    if (lower.includes('software') || lower.includes('tech')) return 'laptop';
    if (lower.includes('grocery')) return 'cart';
    return 'pricetag';
  };

  const bgColor = isDarkMode ? '#111827' : '#F9FAFB';
  const headerBg = isDarkMode ? '#1F2937' : '#FFFFFF';
  const textColor = isDarkMode ? '#F9FAFB' : '#111827';
  const subtextColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const borderColor = isDarkMode ? '#374151' : '#F3F4F6';
  const cardBg = isDarkMode ? '#1F2937' : '#FFFFFF';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }} 
          style={[styles.backButton, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Expense Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Search & Filter */}
        <View style={{ marginBottom: 20 }}>
          <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor }]}>
            <Ionicons name="search" size={20} color={subtextColor} style={{ marginRight: 8 }} />
            <TextInput 
              style={{ flex: 1, color: textColor, fontSize: 16 }}
              placeholder="Search vendor..."
              placeholderTextColor={subtextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={subtextColor} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <TouchableOpacity 
              style={[styles.pill, selectedCategory === null ? styles.pillActive : { backgroundColor: cardBg, borderColor }]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.pillText, selectedCategory === null ? styles.pillTextActive : { color: textColor }]}>All</Text>
            </TouchableOpacity>
            
            {allCategories.map(cat => (
              <TouchableOpacity 
                key={cat}
                style={[styles.pill, selectedCategory === cat ? styles.pillActive : { backgroundColor: cardBg, borderColor }]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.pillText, selectedCategory === cat ? styles.pillTextActive : { color: textColor }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Export Button */}
        <TouchableOpacity style={styles.exportButton} onPress={exportPDF}>
          <View style={styles.exportIconContainer}>
            <Ionicons name="document-text" size={24} color="#4F46E5" />
          </View>
          <Text style={styles.exportText}>Export as PDF</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: textColor }]}>Spending by Category</Text>
        
        {Object.keys(expensesByCategory).length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
            <Ionicons name="pie-chart-outline" size={48} color={subtextColor} />
            <Text style={[styles.emptyText, { color: subtextColor }]}>No data available to show.</Text>
          </View>
        ) : (
          <FlatList
            data={Object.entries(expensesByCategory)}
            keyExtractor={(item) => item[0]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: cardBg }]}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={getCategoryIcon(item[0]) as any} size={20} color="#4F46E5" />
                  </View>
                  <Text style={[styles.categoryName, { color: textColor }]}>{item[0]}</Text>
                </View>
                <Text style={[styles.amount, { color: textColor }]}>{currency}{item[1].toFixed(2)}</Text>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  exportButton: {
    backgroundColor: '#4F46E5', // Indigo
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  exportIconContainer: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
  },
  exportText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
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
  },
  iconCircle: {
    backgroundColor: '#EEF2FF',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryName: {
    fontWeight: '600',
    fontSize: 16,
  },
  amount: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#FFF',
  }
});
