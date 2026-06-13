import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ScannerScreenWeb() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center p-6">
      <Ionicons name="phone-portrait-outline" size={64} color="#4F46E5" />
      <Text className="text-xl font-bold text-gray-900 mt-6 text-center">Mobile Only Feature</Text>
      <Text className="text-gray-500 text-center mt-2 mb-8">
        The AI Scanner and Camera features rely on Native Mobile processing (Google ML Kit). Please open the app on your Android or iOS device to test this feature.
      </Text>
      <TouchableOpacity 
        className="bg-indigo-600 px-8 py-4 rounded-xl w-full"
        onPress={() => router.back()}
      >
        <Text className="text-white font-bold text-center text-lg">Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
