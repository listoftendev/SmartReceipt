import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TextRecognition from '@react-native-ml-kit/text-recognition';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center p-6">
        <Ionicons name="camera-outline" size={64} color="#4F46E5" />
        <Text className="text-xl font-bold text-gray-900 mt-6 text-center">Camera Access Required</Text>
        <Text className="text-gray-500 text-center mt-2 mb-8">
          We need access to your camera to scan receipts.
        </Text>
        <TouchableOpacity 
          className="bg-indigo-600 px-8 py-4 rounded-xl w-full"
          onPress={requestPermission}
        >
          <Text className="text-white font-bold text-center text-lg">Allow Access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const takePictureAndProcess = async () => {
    if (!cameraRef.current || isProcessing) return;
    
    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        // Run ML Kit Text Recognition
        const result = await TextRecognition.recognize(photo.uri);
        
        // Very basic extraction logic for MVP
        // In a real app, you'd use RegEx or LLM to parse amount and vendor accurately
        const extractedText = result.text;
        
        // Pass data to Edit Screen
        router.push({
          pathname: '/edit-receipt',
          params: { 
            imageUri: photo.uri,
            extractedText: extractedText 
          }
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to process receipt. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView 
        ref={cameraRef}
        style={{ flex: 1 }} 
        facing="back"
      >
        <SafeAreaView className="flex-1 justify-between">
          {/* Top Bar */}
          <View className="p-4 flex-row justify-between items-center">
            <TouchableOpacity 
              className="bg-black/50 p-3 rounded-full"
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text className="text-white font-bold text-lg">Scan Receipt</Text>
            <View className="w-12" /> {/* Spacer for alignment */}
          </View>

          {/* Scanner Overlay Guide */}
          <View className="flex-1 justify-center items-center">
            <View className="w-4/5 h-3/5 border-2 border-white/50 rounded-2xl" />
            <Text className="text-white mt-4 font-medium bg-black/50 px-4 py-2 rounded-full">
              Align receipt within the frame
            </Text>
          </View>

          {/* Bottom Controls */}
          <View className="p-8 pb-12 items-center">
            <TouchableOpacity
              onPress={takePictureAndProcess}
              disabled={isProcessing}
              className={`w-20 h-20 rounded-full border-4 border-white items-center justify-center ${isProcessing ? 'opacity-50' : ''}`}
            >
              <View className="w-16 h-16 bg-white rounded-full items-center justify-center">
                {isProcessing && <ActivityIndicator size="small" color="#4F46E5" />}
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
