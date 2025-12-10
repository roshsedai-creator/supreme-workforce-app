import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { colors } from '../constants/colors';

export default function RegisterScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(!!token);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    pin: '',
    confirmPin: '',
    job_title: '',
  });

  // Fetch invitation data if token is provided
  useEffect(() => {
    if (token && typeof token === 'string') {
      fetchInvitation(token);
    }
  }, [token]);

  const fetchInvitation = async (inviteToken: string) => {
    try {
      setLoadingInvite(true);
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/invitations/${inviteToken}`
      );
      
      const invite = response.data;
      setFormData(prev => ({
        ...prev,
        first_name: invite.first_name || '',
        last_name: invite.last_name || '',
        email: invite.email || '',
        phone: invite.phone || '',
        job_title: invite.job_title || '',
      }));
      setInvitationToken(inviteToken);
      
      Alert.alert(
        'Welcome!',
        `You've been invited to join as ${invite.job_title}. Please complete your registration.`
      );
    } catch (error: any) {
      Alert.alert(
        'Invalid Invitation',
        error.response?.data?.detail || 'This invitation link is invalid or has expired.',
        [
          { text: 'OK', onPress: () => router.replace('/register') }
        ]
      );
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleRegister = async () => {
    console.log('handleRegister called');
    console.log('Form data:', formData);
    
    // Validation
    if (!formData.first_name || !formData.last_name || !formData.phone || !formData.email || !formData.pin) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Phone validation (Australian format)
    const phoneRegex = /^04\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      Alert.alert('Error', 'Please enter a valid Australian mobile number (04xxxxxxxx)');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // PIN validation
    if (formData.pin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits');
      return;
    }

    if (formData.pin !== formData.confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    try {
      setLoading(true);
      console.log('Sending registration request...');
      
      const requestData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        pin: formData.pin,
        job_title: formData.job_title.trim() || 'Employee',
        award_level: 1,
        ...(invitationToken && { token: invitationToken }),
      };
      
      console.log('Request data:', requestData);
      
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/auth/register`,
        requestData
      );

      console.log('Response:', response.data);

      if (response.data.success) {
        Alert.alert(
          '✅ Registration Completed!',
          `Welcome ${formData.first_name}!\n\nYour account has been successfully created.\n\nYour Login Details:\n📱 Phone: ${formData.phone}\n🔐 PIN: ${formData.pin}\n\nYou can now login and start using the app.`,
          [
            {
              text: 'Go to Login',
              onPress: () => router.replace('/')
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.detail || 
                          error.message || 
                          'Unable to create account. Please try again.';
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingInvite) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.text.secondary }}>
          Loading invitation details...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="person-add" size={64} color={colors.primary} />
          <Text style={styles.title}>
            {invitationToken ? '📧 Complete Your Invitation' : 'Join Our Team'}
          </Text>
          <Text style={styles.subtitle}>
            {invitationToken ? 'You\'ve been invited! Just set your PIN.' : 'Create your employee account'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.first_name}
              onChangeText={(text) => setFormData({...formData, first_name: text})}
              placeholder="John"
              placeholderTextColor={colors.gray[400]}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.last_name}
              onChangeText={(text) => setFormData({...formData, last_name: text})}
              placeholder="Smith"
              placeholderTextColor={colors.gray[400]}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({...formData, phone: text})}
              placeholder="0412345678"
              placeholderTextColor={colors.gray[400]}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <Text style={styles.hint}>This will be your username</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              placeholder="john.smith@example.com"
              placeholderTextColor={colors.gray[400]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Title (Optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.job_title}
              onChangeText={(text) => setFormData({...formData, job_title: text})}
              placeholder="Room Attendant"
              placeholderTextColor={colors.gray[400]}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Create PIN *</Text>
            <TextInput
              style={styles.input}
              value={formData.pin}
              onChangeText={(text) => setFormData({...formData, pin: text})}
              placeholder="Enter 4-digit PIN"
              placeholderTextColor={colors.gray[400]}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
            />
            <Text style={styles.hint}>This will be your password (min 4 digits)</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm PIN *</Text>
            <TextInput
              style={styles.input}
              value={formData.confirmPin}
              onChangeText={(text) => setFormData({...formData, confirmPin: text})}
              placeholder="Re-enter PIN"
              placeholderTextColor={colors.gray[400]}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color={colors.white} />
                <Text style={styles.registerButtonText}>Create Account</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 8,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[300],
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
  },
  hint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  loginLinkBold: {
    fontWeight: '600',
    color: colors.primary,
  },
});
