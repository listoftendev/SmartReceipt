import { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';

export default function PaywallScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      // Ensure Purchases is configured in App.js or _layout.tsx in production
      // await Purchases.purchasePackage(packages[0]);
      
      // Simulation for MVP
      setTimeout(() => {
        Alert.alert('Success', 'You are now a Premium user! Ads are removed.', [
          { text: 'Awesome!', onPress: () => router.back() }
        ]);
        setLoading(false);
      }, 1500);

    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Error', error.message);
      }
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-indigo-600">
      <View className="p-4 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-indigo-500 rounded-full">
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center p-8">
        <View className="items-center mb-8">
          <Ionicons name="diamond" size={64} color="#FBBF24" />
          <Text className="text-white text-3xl font-bold text-center mt-4">SmartReceipt Premium</Text>
          <Text className="text-indigo-200 text-center text-lg mt-2">Take control of your expenses without limits.</Text>
        </View>

        <View className="bg-white rounded-3xl p-6 mb-8">
          <View className="flex-row items-center mb-4">
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text className="text-gray-700 text-lg ml-3">Remove all ads</Text>
          </View>
          <View className="flex-row items-center mb-4">
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text className="text-gray-700 text-lg ml-3">Unlimited AI Receipt Scans</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text className="text-gray-700 text-lg ml-3">Export to CSV & Excel</Text>
          </View>
        </View>

        <TouchableOpacity 
          className="bg-yellow-400 py-4 rounded-2xl items-center shadow-lg"
          onPress={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text className="text-black font-bold text-xl">Start for $4.99 / month</Text>
          )}
        </TouchableOpacity>
        
        <Text className="text-indigo-200 text-center mt-4 text-xs">
          Cancel anytime. Subscription automatically renews.
        </Text>
      </View>
    </SafeAreaView>
  );
}
