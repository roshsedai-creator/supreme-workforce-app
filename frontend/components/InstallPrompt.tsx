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

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const slideAnim = useState(new Animated.Value(100))[0];

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowBanner(false);
      setDismissed(true);
    });
  };

  if (!showBanner || dismissed || Platform.OS !== 'web') return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.bannerContent}>
        <View style={styles.bannerLeft}>
          <View style={styles.iconContainer}>
            <Image
              source={require('../assets/supreme-logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Install Supreme SOPs</Text>
            <Text style={styles.bannerSubtitle}>Add to home screen for quick access</Text>
          </View>
        </View>
        <View style={styles.bannerActions}>
          <TouchableOpacity style={styles.installBtn} onPress={handleInstall}>
            <Ionicons name="download-outline" size={16} color="#fff" />
            <Text style={styles.installBtnText}>Install</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
            <Ionicons name="close" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#0a0a14',
    borderTopWidth: 1,
    borderTopColor: 'rgba(196,162,101,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  logoImg: {
    width: 40,
    height: 40,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 1,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  installBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B2D8E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  installBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  dismissBtn: {
    padding: 4,
  },
});
