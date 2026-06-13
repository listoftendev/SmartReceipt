import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { insertReceipt } from '../services/db';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../context/SettingsContext';

const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-3940256099942544/1033173712';
const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

export default function EditReceiptScreen() {
  const router = useRouter();
  const { categories: CATEGORIES, currency, isDarkMode } = useSettings();
  const { imageUri, extractedText } = useLocalSearchParams<{ imageUri: string, extractedText: string }>();

  const [vendor, setVendor] = useState('Unknown Vendor');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0] || 'Other');
  const [isSaving, setIsSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setLoaded(true);
    });

    // Load ad immediately
    interstitial.load();

    return unsubscribe;
  }, []);

  // Better regex and extraction logic
  useEffect(() => {
    if (extractedText) {
      // Find all numbers that look like prices, including Georgian text
      // Matches formats like "12.50", "12,50", "1 250.00"
      const priceRegex = /(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2}))/g;
      const matches = [...extractedText.matchAll(priceRegex)];
      
      if (matches && matches.length > 0) {
        // Extract all numerical values and find the maximum (often the total)
        const prices = matches.map(m => {
          // normalize commas and spaces to standard float format
          let normalized = m[1].replace(/\s/g, '').replace(',', '.');
          // if there are multiple dots (e.g. 1.250.00), keep only the last one
          const parts = normalized.split('.');
          if (parts.length > 2) {
            normalized = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
          }
          return parseFloat(normalized);
        });
        
        // Let's filter out unrealistic prices (like year 2024 as a price)
        const validPrices = prices.filter(p => !isNaN(p) && p < 100000);
        
        // Often the max price is the total
        const maxPrice = Math.max(...validPrices);
        if (maxPrice > 0 && maxPrice !== -Infinity) {
          setAmount(maxPrice.toFixed(2));
        } else if (validPrices.length > 0) {
          setAmount(validPrices[validPrices.length - 1].toFixed(2));
        }
      }
      
      const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      // Heuristic: remove common ML Kit noise (browser tabs etc.)
      const validLines = lines.filter(l => 
        !l.includes('uTub') && 
        !l.includes('WEB') && 
        !l.includes('Canva') && 
        !l.includes('Google') &&
        l.length > 2 &&
        !/^[\d\s.,:]+$/.test(l) // skip lines that are only numbers/symbols
      );
      
      if (validLines.length > 0) {
        // Often vendor is at the top
        setVendor(validLines[0]);
      }
    }
  }, [extractedText]);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Invalid Amount', 'Please enter a valid number for the amount.');
      return;
    }

    try {
      setIsSaving(true);
      const date = new Date().toISOString().split('T')[0]; // Current date YYYY-MM-DD
      
      await insertReceipt({
        vendor,
        amount: parseFloat(amount),
        category,
        date,
        imageUri: imageUri || '',
      });
      
      // Logic to show interstitial every 2nd save
      try {
        const countStr = await AsyncStorage.getItem('save_count');
        let count = countStr ? parseInt(countStr, 10) : 0;
        count += 1;
        await AsyncStorage.setItem('save_count', count.toString());

        if (count % 2 === 0 && loaded) {
          interstitial.show();
        }
      } catch (e) {
        // Ignore error
      }

      Alert.alert('Success', 'Receipt saved successfully!', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save receipt.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: isDarkMode ? '#111827' : '#F9FAFB' }}>
      {/* Header */}
      <View className="flex-row justify-between items-center p-4 border-b" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderBottomColor: isDarkMode ? '#374151' : '#F3F4F6' }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#F9FAFB' : '#111827'} />
        </TouchableOpacity>
        <Text className="text-lg font-bold" style={{ color: isDarkMode ? '#F9FAFB' : '#111827' }}>Review Receipt</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        <View className="p-6 rounded-2xl shadow-sm mb-6" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }}>
          
          {/* Vendor */}
          <Text className="text-sm font-bold text-gray-500 mb-2 uppercase">Vendor Name</Text>
          <TextInput
            className="text-xl font-bold border-b pb-2 mb-6"
            style={{ color: isDarkMode ? '#F9FAFB' : '#111827', borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' }}
            value={vendor}
            onChangeText={setVendor}
            placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
            placeholder="e.g. Starbucks"
          />

          {/* Amount */}
          <Text className="text-sm font-bold text-gray-500 mb-2 uppercase">Total Amount ({currency})</Text>
          <TextInput
            className="text-3xl font-bold text-indigo-600 border-b pb-2 mb-6"
            style={{ borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' }}
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          {/* Category */}
          <Text className="text-sm font-bold text-gray-500 mb-3 uppercase">Category</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full border ${category === cat ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}
              >
                <Text className={`${category === cat ? 'text-white' : 'text-gray-700'} font-medium`}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Extracted Raw Text Debug (Optional, good for user to see what was read) */}
        <View className="mb-10">
          <Text className="text-xs text-gray-400 mb-2">Raw Extracted Text (For reference)</Text>
          <View className="bg-gray-100 p-3 rounded-lg">
            <Text className="text-gray-500 text-xs">{extractedText || "No text could be extracted."}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="p-6 border-t" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderTopColor: isDarkMode ? '#374151' : '#F3F4F6' }}>
        <TouchableOpacity
          className={`bg-indigo-600 py-4 rounded-xl flex-row justify-center items-center ${isSaving ? 'opacity-70' : ''}`}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Ionicons name="checkmark-circle" size={24} color="white" className="mr-2" />
          <Text className="text-white font-bold text-lg ml-2">
            {isSaving ? 'Saving...' : 'Save Receipt'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
