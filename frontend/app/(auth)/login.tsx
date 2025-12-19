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
import { colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Trim whitespace from inputs
    const cleanIdentifier = identifier.trim();
    const cleanPin = pin.trim();
    
    if (!cleanIdentifier || !cleanPin) {
      Alert.alert('Error', 'Please enter your phone/email and PIN');
      return;
    }

    // Validate PIN is numeric
    if (!/^\d{4,6}$/.test(cleanPin)) {
      Alert.alert('Error', 'PIN must be 4-6 digits');
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
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = 'Please check your input and try again.';
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative Circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.logoGradient}
            >
              <Image 
                source={require('../../assets/logo.jpg')}
                style={styles.logo}
                resizeMode="contain"
              />
            </LinearGradient>
          </View>
          
          <Text style={styles.title}>Supreme Hospitality</Text>
          <Text style={styles.subtitle}>Workforce Management</Text>
          
          {/* Feature Pills */}
          <View style={styles.featurePills}>
            <View style={styles.pill}>
              <Ionicons name="time-outline" size={14} color="white" />
              <Text style={styles.pillText}>Smart Timesheets</Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="calendar-outline" size={14} color="white" />
              <Text style={styles.pillText}>Easy Roster</Text>
            </View>
          </View>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your account</Text>
          </View>

          <View style={styles.form}>
            {/* Phone/Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone or Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone or email"
                  placeholderTextColor={colors.gray[400]}
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* PIN Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PIN Code</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your 4-digit PIN"
                  placeholderTextColor={colors.gray[400]}
                  value={pin}
                  onChangeText={setPin}
                  secureTextEntry
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#9CA3AF', '#9CA3AF'] : ['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Register Link */}
            <TouchableOpacity 
              style={styles.registerLink}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.registerText}>
                New employee? <Text style={styles.registerTextBold}>Register here</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security Badge */}
          <View style={styles.securityBadge}>
            <Ionicons name="shield-checkmark" size={16} color={colors.success} />
            <Text style={styles.securityText}>Secure & Encrypted</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 Supreme Hospitality</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  // Decorative circles
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -50,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 100,
    left: -30,
  },
  circle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: height * 0.3,
    left: width * 0.8,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
    textAlign: 'center',
  },
  featurePills: {
    flexDirection: 'row',
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  pillText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 1,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: colors.text.primary,
  },
  button: {
    height: 56,
    borderRadius: 16,
    marginTop: 8,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  registerTextBold: {
    fontWeight: '600',
    color: colors.primary,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: 8,
  },
  securityText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    zIndex: 1,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
});
