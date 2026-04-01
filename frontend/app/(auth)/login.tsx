import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { login } from '../../utils/api';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleLogin = async () => {
    const cleanIdentifier = identifier.trim();
    const cleanPin = pin.trim();
    
    if (!cleanIdentifier || !cleanPin) {
      Alert.alert('Missing Information', 'Please enter your phone/email and PIN');
      return;
    }

    if (!/^\d{4,6}$/.test(cleanPin)) {
      Alert.alert('Invalid PIN', 'PIN must be 4-6 digits');
      return;
    }

    setLoading(true);
    try {
      const response = await login(cleanIdentifier, cleanPin);
      
      if (response?.user && response?.token) {
        setUser(response.user, response.token);
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Login Failed', 'Invalid server response. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Invalid credentials. Please check your phone number and PIN.';
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        }
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Premium Gradient Background */}
      <LinearGradient
        colors={['#0f0f23', '#1a1a3e', '#0f0f23']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated Gradient Orbs */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={[styles.orb, styles.orb1]}
        />
        <LinearGradient
          colors={['#ec4899', '#f472b6']}
          style={[styles.orb, styles.orb2]}
        />
        <LinearGradient
          colors={['#06b6d4', '#22d3ee']}
          style={[styles.orb, styles.orb3]}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.1)']}
                style={styles.logoGradient}
              >
                <Image 
                  source={require('../../assets/logo.jpg')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </LinearGradient>
            </View>
            
            <Text style={styles.brandName}>Supreme Hospitality</Text>
            <Text style={styles.tagline}>SOPs & Compliance Generator</Text>
            
            {/* Feature Badges */}
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="flash" size={12} color="#fbbf24" />
                <Text style={styles.badgeText}>Fast</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="shield-checkmark" size={12} color="#10b981" />
                <Text style={styles.badgeText}>Secure</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="analytics" size={12} color="#6366f1" />
                <Text style={styles.badgeText}>Smart</Text>
              </View>
            </View>
          </View>

          {/* Login Card */}
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.welcomeText}>Welcome back</Text>
                <Text style={styles.instructionText}>Sign in to continue</Text>
              </View>

              {/* Phone/Email Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Phone or Email</Text>
                <View style={[
                  styles.inputContainer,
                  focusedInput === 'identifier' && styles.inputContainerFocused
                ]}>
                  <View style={styles.inputIconBox}>
                    <Ionicons name="person" size={18} color="#6366f1" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter phone or email"
                    placeholderTextColor="#9ca3af"
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onFocus={() => setFocusedInput('identifier')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              {/* PIN Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>PIN Code</Text>
                <View style={[
                  styles.inputContainer,
                  focusedInput === 'pin' && styles.inputContainerFocused
                ]}>
                  <View style={styles.inputIconBox}>
                    <Ionicons name="lock-closed" size={18} color="#6366f1" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 4-digit PIN"
                    placeholderTextColor="#9ca3af"
                    value={pin}
                    onChangeText={setPin}
                    secureTextEntry
                    keyboardType="number-pad"
                    maxLength={4}
                    onFocus={() => setFocusedInput('pin')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={loading ? ['#6b7280', '#6b7280'] : ['#6366f1', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signInGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.signInText}>Sign In</Text>
                      <View style={styles.arrowCircle}>
                        <Ionicons name="arrow-forward" size={16} color="#6366f1" />
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* App Description */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>SOPs & Compliance</Text>
                <View style={styles.dividerLine} />
              </View>
            </View>

            {/* Trust Badges */}
            <View style={styles.trustSection}>
              <View style={styles.trustItem}>
                <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                <Text style={styles.trustText}>256-bit SSL</Text>
              </View>
              <View style={styles.trustDot} />
              <View style={styles.trustItem}>
                <Ionicons name="finger-print" size={16} color="#6366f1" />
                <Text style={styles.trustText}>Biometric Ready</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 Supreme Hospitality Services</Text>
            <Text style={styles.versionText}>v2.0.0 — SOPs & Compliance Generator</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.4,
  },
  orb1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  orb2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -80,
  },
  orb3: {
    width: 150,
    height: 150,
    top: height * 0.4,
    right: -60,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    marginBottom: 20,
  },
  logoGradient: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logo: {
    width: 100,
    height: 50,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 20,
  },
  cardHeader: {
    marginBottom: 28,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 15,
    color: '#6b7280',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  inputContainerFocused: {
    borderColor: '#6366f1',
    backgroundColor: '#fafaff',
  },
  inputIconBox: {
    width: 48,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  signInButton: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  signInGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    gap: 12,
  },
  signInText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  registerText: {
    fontSize: 15,
    color: '#6b7280',
  },
  registerLink: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '700',
  },
  trustSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 16,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  trustDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  versionText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
});
