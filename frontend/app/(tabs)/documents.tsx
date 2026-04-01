import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getDocuments, getCategories, deleteDocument, updateDocument, getDocumentExportUrl } from '../../utils/api';
import * as WebBrowser from 'expo-web-browser';

const { width, height } = Dimensions.get('window');

interface Document {
  id: string;
  title: string;
  category: string;
  content: string;
  sections: Array<{ title: string; content: string; order?: number }>;
  status: string;
  document_type?: string;
  ai_generated?: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ filterCategory?: string; viewDocId?: string }>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  const loadData = async (category?: string | null, search?: string) => {
    try {
      const queryParams: any = {};
      if (category) queryParams.category = category;
      if (search) queryParams.search = search;
      if (activeStatus) queryParams.status = activeStatus;

      const [docsData, catsData] = await Promise.all([
        getDocuments(queryParams),
        getCategories(),
      ]);
      setDocuments(docsData);
      setCategories(catsData);
    } catch (err) {
      console.error('Load documents error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const cat = params.filterCategory || null;
      if (cat) setActiveCategory(cat);
      loadData(cat || activeCategory, searchQuery);
    }, [params.filterCategory])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData(activeCategory, searchQuery);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    loadData(activeCategory, text);
  };

  const handleCategoryFilter = (catId: string | null) => {
    setActiveCategory(catId);
    loadData(catId, searchQuery);
  };

  const handleStatusFilter = (status: string | null) => {
    setActiveStatus(status);
    // Reload with new status
    setTimeout(() => loadData(activeCategory, searchQuery), 100);
  };

  const handleDeleteDoc = (doc: Document) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${doc.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(doc.id);
              loadData(activeCategory, searchQuery);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (doc: Document) => {
    const newStatus = doc.status === 'published' ? 'draft' : 'published';
    try {
      await updateDocument(doc.id, { status: newStatus });
      loadData(activeCategory, searchQuery);
      if (selectedDoc?.id === doc.id) {
        setSelectedDoc({ ...doc, status: newStatus });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleExport = async (doc: Document) => {
    try {
      const url = getDocumentExportUrl(doc.id);
      await WebBrowser.openBrowserAsync(url);
    } catch (err) {
      Alert.alert('Error', 'Failed to open document for export');
    }
  };

  const openDocViewer = (doc: Document) => {
    setSelectedDoc(doc);
    setShowViewer(true);
  };

  const getCategoryInfo = (catId: string) => {
    return categories.find(c => c.id === catId);
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
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderDocViewer = () => {
    if (!selectedDoc) return null;
    const cat = getCategoryInfo(selectedDoc.category);

    return (
      <Modal visible={showViewer} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.viewerContainer, { paddingTop: insets.top }]}>
          {/* Viewer Header */}
          <LinearGradient
            colors={['#0a0a14', '#1a1a2e']}
            style={styles.viewerHeader}
          >
            <TouchableOpacity
              style={styles.viewerBackBtn}
              onPress={() => setShowViewer(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.viewerHeaderCenter}>
              <Text style={styles.viewerBrand}>SUPREME HOSPITALITY SERVICES</Text>
              <Text style={styles.viewerTitle} numberOfLines={2}>{selectedDoc.title}</Text>
              <View style={styles.viewerMeta}>
                <View style={[styles.viewerBadge, { backgroundColor: (cat?.color || '#7B2D8E') + '30' }]}>
                  <Text style={[styles.viewerBadgeText, { color: cat?.color || '#7B2D8E' }]}>
                    {cat?.name || selectedDoc.category}
                  </Text>
                </View>
                <View style={[
                  styles.viewerBadge,
                  { backgroundColor: selectedDoc.status === 'published' ? '#10b98130' : '#f59e0b30' }
                ]}>
                  <Text style={[
                    styles.viewerBadgeText,
                    { color: selectedDoc.status === 'published' ? '#10b981' : '#f59e0b' }
                  ]}>
                    {selectedDoc.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.viewerActions}>
              <TouchableOpacity
                style={styles.viewerActionBtn}
                onPress={() => handleExport(selectedDoc)}
              >
                <Ionicons name="open-outline" size={20} color="#C4A265" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewerActionBtn}
                onPress={() => handleToggleStatus(selectedDoc)}
              >
                <Ionicons
                  name={selectedDoc.status === 'published' ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#C4A265"
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Document Content */}
          <ScrollView
            style={styles.viewerBody}
            contentContainerStyle={styles.viewerBodyContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedDoc.content ? (
              <View style={styles.viewerSummary}>
                <Text style={styles.viewerSummaryText}>{selectedDoc.content}</Text>
              </View>
            ) : null}

            {selectedDoc.sections?.map((section, index) => (
              <View key={index} style={styles.viewerSection}>
                <View style={styles.viewerSectionHeader}>
                  <View style={[styles.viewerSectionNumber, { backgroundColor: (cat?.color || '#7B2D8E') + '15' }]}>
                    <Text style={[styles.viewerSectionNumberText, { color: cat?.color || '#7B2D8E' }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={styles.viewerSectionTitle}>{section.title}</Text>
                </View>
                <Text style={styles.viewerSectionContent}>{section.content}</Text>
              </View>
            ))}

            <View style={styles.viewerFooter}>
              <Text style={styles.viewerFooterConfidential}>
                CONFIDENTIAL — SUPREME HOSPITALITY
              </Text>
              <Text style={styles.viewerFooterText}>
                Created: {formatDate(selectedDoc.created_at)}
              </Text>
              {selectedDoc.ai_generated && (
                <View style={styles.viewerAiBadge}>
                  <Ionicons name="sparkles" size={12} color="#7B2D8E" />
                  <Text style={styles.viewerAiText}>AI Generated</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={[styles.viewerBottomBar, { paddingBottom: insets.bottom + 8 }]}>
            <TouchableOpacity
              style={styles.viewerBottomBtn}
              onPress={() => handleExport(selectedDoc)}
            >
              <Ionicons name="download-outline" size={20} color="#7B2D8E" />
              <Text style={styles.viewerBottomBtnText}>Export / Print</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewerBottomBtn, styles.viewerBottomBtnPrimary]}
              onPress={() => handleToggleStatus(selectedDoc)}
            >
              <Ionicons
                name={selectedDoc.status === 'published' ? 'eye-off' : 'checkmark-circle'}
                size={20}
                color="#fff"
              />
              <Text style={[styles.viewerBottomBtnText, { color: '#fff' }]}>
                {selectedDoc.status === 'published' ? 'Unpublish' : 'Publish'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#7B2D8E" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Documents</Text>
        <Text style={styles.screenSubtitle}>{documents.length} document{documents.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipContainer}
      >
        <TouchableOpacity
          style={[styles.chip, !activeCategory && styles.chipActive]}
          onPress={() => handleCategoryFilter(null)}
        >
          <Text style={[styles.chipText, !activeCategory && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.chip, activeCategory === cat.id && styles.chipActive]}
            onPress={() => handleCategoryFilter(cat.id)}
          >
            <Ionicons
              name={getCategoryIcon(cat.icon)}
              size={14}
              color={activeCategory === cat.id ? '#fff' : cat.color}
            />
            <Text style={[styles.chipText, activeCategory === cat.id && styles.chipTextActive]}>
              {cat.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Status Filters */}
      <View style={styles.statusFilters}>
        <TouchableOpacity
          style={[styles.statusChip, !activeStatus && styles.statusChipActive]}
          onPress={() => handleStatusFilter(null)}
        >
          <Text style={[styles.statusChipText, !activeStatus && styles.statusChipTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusChip, activeStatus === 'published' && styles.statusChipActiveGreen]}
          onPress={() => handleStatusFilter(activeStatus === 'published' ? null : 'published')}
        >
          <Text style={[styles.statusChipText, activeStatus === 'published' && styles.statusChipTextActive]}>
            Published
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusChip, activeStatus === 'draft' && styles.statusChipActiveYellow]}
          onPress={() => handleStatusFilter(activeStatus === 'draft' ? null : 'draft')}
        >
          <Text style={[styles.statusChipText, activeStatus === 'draft' && styles.statusChipTextActive]}>
            Drafts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Documents List */}
      <ScrollView
        style={styles.docList}
        contentContainerStyle={styles.docListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7B2D8E" />
        }
      >
        {documents.length > 0 ? (
          documents.map((doc) => {
            const cat = getCategoryInfo(doc.category);
            return (
              <TouchableOpacity
                key={doc.id}
                style={styles.docCard}
                activeOpacity={0.7}
                onPress={() => openDocViewer(doc)}
              >
                <View style={styles.docCardHeader}>
                  <View style={[styles.docCardIcon, { backgroundColor: (cat?.color || '#7B2D8E') + '15' }]}>
                    <Ionicons
                      name={getCategoryIcon(cat?.icon || 'document-outline')}
                      size={22}
                      color={cat?.color || '#7B2D8E'}
                    />
                  </View>
                  <View style={styles.docCardInfo}>
                    <Text style={styles.docCardTitle} numberOfLines={1}>{doc.title}</Text>
                    <Text style={styles.docCardCategory}>{cat?.name || doc.category}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.docCardMenu}
                    onPress={() => handleDeleteDoc(doc)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <View style={styles.docCardFooter}>
                  <View style={styles.docCardFooterLeft}>
                    {doc.ai_generated && (
                      <View style={styles.aiBadge}>
                        <Ionicons name="sparkles" size={10} color="#7B2D8E" />
                        <Text style={styles.aiBadgeText}>AI</Text>
                      </View>
                    )}
                    <Text style={styles.docCardDate}>{formatDate(doc.updated_at || doc.created_at)}</Text>
                    <Text style={styles.docCardSections}>
                      {doc.sections?.length || 0} section{(doc.sections?.length || 0) !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={[
                    styles.docStatusBadge,
                    { backgroundColor: doc.status === 'published' ? '#ecfdf5' : '#fef3c7' }
                  ]}>
                    <View style={[
                      styles.docStatusDot,
                      { backgroundColor: doc.status === 'published' ? '#10b981' : '#f59e0b' }
                    ]} />
                    <Text style={[
                      styles.docStatusText,
                      { color: doc.status === 'published' ? '#059669' : '#d97706' }
                    ]}>
                      {doc.status === 'published' ? 'Published' : 'Draft'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={56} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No documents found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try a different search term' : 'Generate your first document'}
            </Text>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {renderDocViewer()}
    </View>
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
  screenHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  chipContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 5,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#7B2D8E',
    borderColor: '#7B2D8E',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  statusFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  statusChipActive: {
    backgroundColor: '#7B2D8E',
  },
  statusChipActiveGreen: {
    backgroundColor: '#10b981',
  },
  statusChipActiveYellow: {
    backgroundColor: '#f59e0b',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  statusChipTextActive: {
    color: '#fff',
  },
  docList: {
    flex: 1,
  },
  docListContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  docCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  docCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  docCardCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  docCardMenu: {
    padding: 8,
  },
  docCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  docCardFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f0ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7B2D8E',
  },
  docCardDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  docCardSections: {
    fontSize: 12,
    color: '#9ca3af',
  },
  docStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  docStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  docStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  // Viewer Styles
  viewerContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  viewerHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  viewerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerHeaderCenter: {
    flex: 1,
    marginLeft: 12,
  },
  viewerBrand: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C4A265',
    letterSpacing: 2,
    marginBottom: 4,
  },
  viewerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 26,
  },
  viewerMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  viewerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  viewerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  viewerActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  viewerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerBody: {
    flex: 1,
  },
  viewerBodyContent: {
    padding: 16,
  },
  viewerSummary: {
    backgroundColor: '#f5f0ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#7B2D8E',
  },
  viewerSummaryText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  viewerSection: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  viewerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewerSectionNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerSectionNumberText: {
    fontSize: 14,
    fontWeight: '800',
  },
  viewerSectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 10,
  },
  viewerSectionContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  viewerFooter: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  viewerFooterConfidential: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E74C3C',
    letterSpacing: 1,
    marginBottom: 4,
  },
  viewerFooterText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  viewerAiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#f5f0ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewerAiText: {
    fontSize: 11,
    color: '#7B2D8E',
    fontWeight: '600',
  },
  viewerBottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  viewerBottomBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    gap: 6,
  },
  viewerBottomBtnPrimary: {
    backgroundColor: '#7B2D8E',
  },
  viewerBottomBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});
