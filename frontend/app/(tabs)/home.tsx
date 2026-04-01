import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { getDashboardStats, getCategories } from '../../utils/api';

const { width } = Dimensions.get('window');

interface DashboardStats {
  total_documents: number;
  published_documents: number;
  draft_documents: number;
  total_templates: number;
  category_counts: Record<string, number>;
  recent_documents: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    updated_at: string;
    ai_generated?: boolean;
  }>;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [statsData, catsData] = await Promise.all([
        getDashboardStats(),
        getCategories(),
      ]);
      setStats(statsData);
      setCategories(catsData);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getCategoryIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'bed-outline': 'bed-outline',
      'restaurant-outline': 'restaurant-outline',
      'desktop-outline': 'desktop-outline',
      'medkit-outline': 'medkit-outline',
      'flame-outline': 'flame-outline',
      'people-outline': 'people-outline',
      'settings-outline': 'settings-outline',
      'star-outline': 'star-outline',
    };
    return (iconMap[iconName] || 'document-outline') as any;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#0f0f23', '#1a1a3e', '#252550']}
        style={styles.headerGradient}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.brandLabel}>SUPREME HOSPITALITY</Text>
            <Text style={styles.greeting}>
              Welcome, {user?.first_name || 'User'}
            </Text>
          </View>
          <View style={styles.headerLogo}>
            <Image
              source={require('../../assets/logo.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(99,102,241,0.15)', 'rgba(99,102,241,0.05)']}
              style={styles.statCardGradient}
            >
              <Ionicons name="document-text" size={24} color="#a5b4fc" />
              <Text style={styles.statNumber}>{stats?.total_documents || 0}</Text>
              <Text style={styles.statLabel}>Total Docs</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)']}
              style={styles.statCardGradient}
            >
              <Ionicons name="checkmark-circle" size={24} color="#6ee7b7" />
              <Text style={styles.statNumber}>{stats?.published_documents || 0}</Text>
              <Text style={styles.statLabel}>Published</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']}
              style={styles.statCardGradient}
            >
              <Ionicons name="create" size={24} color="#fcd34d" />
              <Text style={styles.statNumber}>{stats?.draft_documents || 0}</Text>
              <Text style={styles.statLabel}>Drafts</Text>
            </LinearGradient>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Generate CTA */}
      <TouchableOpacity
        style={styles.ctaCard}
        activeOpacity={0.9}
        onPress={() => router.push('/(tabs)/generate')}
      >
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <View style={styles.ctaContent}>
            <View style={styles.ctaIconContainer}>
              <Ionicons name="sparkles" size={28} color="#fff" />
            </View>
            <View style={styles.ctaText}>
              <Text style={styles.ctaTitle}>Generate New Document</Text>
              <Text style={styles.ctaSubtitle}>
                AI-powered SOPs & compliance checklists
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={32} color="rgba(255,255,255,0.8)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Categories Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Document Categories</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/documents')}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoriesGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              activeOpacity={0.7}
              onPress={() => router.push({
                pathname: '/(tabs)/documents',
                params: { filterCategory: cat.id }
              })}
            >
              <View style={[styles.categoryIcon, { backgroundColor: cat.color + '15' }]}>
                <Ionicons name={getCategoryIcon(cat.icon)} size={24} color={cat.color} />
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>{cat.name}</Text>
              <Text style={styles.categoryCount}>
                {stats?.category_counts?.[cat.id] || 0} docs
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Documents */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Documents</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/documents')}>
            <Text style={styles.sectionLink}>See All</Text>
          </TouchableOpacity>
        </View>
        {stats?.recent_documents && stats.recent_documents.length > 0 ? (
          stats.recent_documents.map((doc) => {
            const cat = categories.find(c => c.id === doc.category);
            return (
              <TouchableOpacity
                key={doc.id}
                style={styles.recentCard}
                activeOpacity={0.7}
                onPress={() => router.push({
                  pathname: '/(tabs)/documents',
                  params: { viewDocId: doc.id }
                })}
              >
                <View style={[styles.recentIcon, { backgroundColor: (cat?.color || '#6366f1') + '15' }]}>
                  <Ionicons
                    name={getCategoryIcon(cat?.icon || 'document-outline')}
                    size={20}
                    color={cat?.color || '#6366f1'}
                  />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle} numberOfLines={1}>{doc.title}</Text>
                  <View style={styles.recentMeta}>
                    <Text style={styles.recentCategory}>{cat?.name || doc.category}</Text>
                    <Text style={styles.recentDate}>{formatDate(doc.updated_at)}</Text>
                  </View>
                </View>
                <View style={[
                  styles.recentStatusBadge,
                  { backgroundColor: doc.status === 'published' ? '#ecfdf5' : '#fef3c7' }
                ]}>
                  <View style={[
                    styles.recentStatusDot,
                    { backgroundColor: doc.status === 'published' ? '#10b981' : '#f59e0b' }
                  ]} />
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyRecent}>
            <Ionicons name="document-outline" size={36} color="#d1d5db" />
            <Text style={styles.emptyRecentText}>No documents yet</Text>
            <Text style={styles.emptyRecentSub}>Generate your first SOP to get started</Text>
          </View>
        )}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a5b4fc',
    letterSpacing: 2,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerLogo: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
  },
  statCardGradient: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginTop: 2,
  },
  ctaCard: {
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaGradient: {
    borderRadius: 16,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 12,
  },
  ctaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  ctaSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: (width - 52) / 4,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 28,
  },
  categoryCount: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  recentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  recentCategory: {
    fontSize: 11,
    color: '#6b7280',
  },
  recentDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  recentStatusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  recentStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyRecent: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  emptyRecentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 10,
  },
  emptyRecentSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});
