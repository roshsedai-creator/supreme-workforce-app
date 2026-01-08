import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const slideAnim = useState(new Animated.Value(200))[0];

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const checkInstallStatus = async () => {
      try {
        // Check if already dismissed or installed
        const dismissed = await AsyncStorage.getItem('pwa_install_dismissed');
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        
        if (dismissed || isStandalone) {
          return;
        }

        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(isIOSDevice);

        // For iOS, show instructions banner
        if (isIOSDevice) {
          setTimeout(() => {
            setShowBanner(true);
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }).start();
          }, 2000);
        }
      } catch (error) {
        console.log('Install check error:', error);
      }
    };

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      setTimeout(() => {
        setShowBanner(true);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    checkInstallStatus();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android/Chrome install
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = async () => {
    Animated.timing(slideAnim, {
      toValue: 200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowBanner(false);
    });
    
    try {
      await AsyncStorage.setItem('pwa_install_dismissed', 'true');
    } catch (error) {
      console.log('Error saving dismiss state:', error);
    }
  };

  if (!showBanner || Platform.OS !== 'web') return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.banner}>
        <View style={styles.iconContainer}>
          <View style={styles.appIcon}>
            <Ionicons name="time" size={28} color="#fff" />
          </View>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>Install Supreme Workforce</Text>
          <Text style={styles.subtitle}>
            {isIOS 
              ? 'Tap Share ⬆️ then "Add to Home Screen"'
              : 'Add to your home screen for quick access'
            }
          </Text>
        </View>

        {!isIOS && deferredPrompt && (
          <TouchableOpacity style={styles.installBtn} onPress={handleInstall}>
            <Text style={styles.installBtnText}>Install</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss}>
          <Ionicons name="close" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: 16,
    paddingBottom: 32,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconContainer: {
    marginRight: 12,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  installBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 12,
  },
  installBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 8,
    marginLeft: 4,
  },
});
