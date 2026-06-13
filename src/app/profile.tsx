import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Linking, Platform, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AdBanner from '../components/AdBanner';
import { useSettings } from '../context/SettingsContext';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { 
    currency, setCurrency, 
    budgetLimit, setBudgetLimit, 
    theme, setTheme, isDarkMode, 
    appLockEnabled, setAppLockEnabled,
    categories, addCategory, removeCategory
  } = useSettings();

  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return subscriber; // unsubscribe on unmount
  }, [initializing]);

  const handleAuthentication = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert('Success', 'Logged in successfully!');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert('Success', 'Account created! Your receipts will now be synced.');
      }
    } catch (error: any) {
      Alert.alert('Authentication Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  const promptNewCategory = () => {
    Alert.prompt(
      "New Category",
      "Enter the name of the new category:",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Add", 
          onPress: (text) => {
            if (text && text.trim().length > 0) {
              addCategory(text.trim());
            }
          }
        }
      ]
    );
  };

  const bgColor = isDarkMode ? '#111827' : '#F9FAFB';
  const headerBg = isDarkMode ? '#1F2937' : '#FFFFFF';
  const textColor = isDarkMode ? '#F9FAFB' : '#111827';
  const subtextColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const borderColor = isDarkMode ? '#374151' : '#E5E7EB';
  const cardBg = isDarkMode ? '#1F2937' : '#FFFFFF';

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Settings & Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* APP SETTINGS */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>App Settings</Text>
        <View style={[styles.settingsCard, { backgroundColor: cardBg }]}>
          
          <View style={[styles.settingRow, { borderBottomColor: borderColor, borderBottomWidth: 1 }]}>
            <Text style={[styles.settingLabel, { color: textColor }]}>Currency Symbol</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {['$', '€', '₾', '£'].map(c => (
                <TouchableOpacity 
                  key={c}
                  onPress={() => setCurrency(c)}
                  style={{ padding: 8, backgroundColor: currency === c ? '#4F46E5' : (isDarkMode ? '#374151' : '#F3F4F6'), borderRadius: 8 }}
                >
                  <Text style={{ color: currency === c ? '#FFF' : textColor, fontWeight: 'bold' }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.settingRow, { borderBottomColor: borderColor, borderBottomWidth: 1 }]}>
            <Text style={[styles.settingLabel, { color: textColor }]}>Monthly Budget</Text>
            <TextInput 
              style={[styles.budgetInput, { color: textColor, borderColor: borderColor, backgroundColor: isDarkMode ? '#374151' : '#FFF' }]}
              keyboardType="numeric"
              value={budgetLimit === 0 ? '' : budgetLimit.toString()}
              placeholder="0 (Disabled)"
              placeholderTextColor={subtextColor}
              onChangeText={(val) => setBudgetLimit(Number(val) || 0)}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: borderColor, borderBottomWidth: 1 }]}>
            <Text style={[styles.settingLabel, { color: textColor }]}>Dark Mode</Text>
            <Switch 
              value={theme === 'dark'}
              onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
              trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: borderColor, borderBottomWidth: 1 }]}>
            <Text style={[styles.settingLabel, { color: textColor }]}>Biometric App Lock</Text>
            <Switch 
              value={appLockEnabled}
              onValueChange={setAppLockEnabled}
              trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
            />
          </View>

          <View style={[styles.settingRow, { paddingVertical: 16 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: textColor, marginBottom: 8 }]}>Custom Categories</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {categories.map(cat => (
                  <TouchableOpacity key={cat} onPress={() => removeCategory(cat)} style={[styles.catBadge, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}>
                    <Text style={{ color: textColor, fontSize: 12 }}>{cat}</Text>
                    <Ionicons name="close" size={14} color="#EF4444" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={promptNewCategory} style={[styles.catBadge, { backgroundColor: '#EEF2FF', borderColor: '#4F46E5', borderWidth: 1 }]}>
                  <Text style={{ color: '#4F46E5', fontSize: 12, fontWeight: 'bold' }}>+ Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </View>

        {/* CLOUD SYNC */}
        <Text style={[styles.sectionTitle, { color: textColor, marginTop: 32 }]}>Cloud Backup</Text>
        {user ? (
          <View style={styles.loggedInContainer}>
            <Ionicons name="cloud-done" size={80} color="#10B981" />
            <Text style={styles.syncTitle}>Cloud Sync is Active</Text>
            <Text style={styles.syncSubtitle}>
              Logged in as: {user.email}
            </Text>
            <Text style={styles.syncDescription}>
              All your newly added receipts will be securely backed up to the cloud. You won't lose your data if you change phones.
            </Text>

            <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.authForm}>
            <View style={styles.authHeader}>
              <Ionicons name="cloud-offline" size={64} color="#6B7280" />
              <Text style={styles.authTitle}>Back Up Your Receipts</Text>
              <Text style={styles.authSubtitle}>Create an account to securely save your data in the cloud.</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleAuthentication}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isLogin ? 'Log In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchModeButton}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.switchModeText}>
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.footer, { paddingBottom: 60 }]}>
          <Text style={[styles.footerText, { color: subtextColor }]}>App created by </Text>
          <Text 
            style={styles.twincodeText}
            onPress={() => Linking.openURL('https://twincode.ge')}
          >
            twincode.ge
          </Text>
        </View>
      </ScrollView>

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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingsCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  budgetInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 100,
    textAlign: 'center',
    fontSize: 16,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  authForm: {
    flex: 1,
    justifyContent: 'center',
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  authSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchModeButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchModeText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  loggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 24,
  },
  syncSubtitle: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
    marginTop: 8,
  },
  syncDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 48,
    width: '100%',
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingTop: 40,
    paddingBottom: 40,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  twincodeText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
