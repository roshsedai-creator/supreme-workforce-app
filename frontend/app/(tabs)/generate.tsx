import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getCategories, generateDocument } from '../../utils/api';

const { width } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

const SUGGESTED_TITLES: Record<string, string[]> = {
  room_cleaning: [
    'Guest Room Cleaning & Turndown SOP',
    'Departure Room Cleaning Procedure',
    'Stayover Room Service Standards',
    'VIP Room Preparation Protocol',
    'Room Inspection Quality Checklist',
  ],
  laundry_linen: [
    'Linen Inventory Management SOP',
    'Laundry Processing & Quality Control',
    'Stain Removal & Treatment Guide',
    'Linen Par Level Management',
    'Guest Laundry Service Procedure',
  ],
  chemical_safety: [
    'Chemical Handling & Storage SOP',
    'MSDS Register & Compliance Guide',
    'Dilution Ratios & Mixing Procedures',
    'Chemical Spill Response Protocol',
    'PPE Requirements for Chemical Use',
  ],
  deep_cleaning: [
    'Quarterly Deep Cleaning Schedule',
    'Bathroom Sanitisation Protocol',
    'Carpet & Floor Deep Cleaning SOP',
    'Infection Control Cleaning Procedure',
    'Post-COVID Room Sanitisation Guide',
  ],
  public_areas: [
    'Lobby & Reception Cleaning SOP',
    'Restroom Cleaning & Sanitisation',
    'Elevator & Corridor Maintenance',
    'Conference Room Setup & Cleaning',
    'Pool & Gym Area Cleaning Procedure',
  ],
  equipment_trolley: [
    'Housekeeping Trolley Setup Guide',
    'Equipment Maintenance Schedule',
    'Vacuum Cleaner Care & Maintenance',
    'Supply Inventory & Restocking SOP',
    'Trolley Loading Standards',
  ],
  quality_inspection: [
    'Room Inspection Checklist',
    'Quality Audit Scoring Criteria',
    'Supervisor Inspection Procedure',
    'Guest Complaint Follow-up Audit',
    'Monthly Quality Performance Review',
  ],
  staff_training: [
    'New Staff Induction Program',
    'Room Attendant Training Checklist',
    'Supervisor Development Program',
    'Cross-Training Competency Matrix',
    'Annual Refresher Training Schedule',
  ],
  whs_compliance: [
    'Manual Handling & Ergonomics SOP',
    'Slip, Trip & Fall Prevention',
    'Incident Reporting Procedure',
    'First Aid Response Protocol',
    'Hazard Identification & Risk Assessment',
  ],
  guest_requests: [
    'Guest Request Response Procedure',
    'Complaint Handling & Escalation',
    'Lost & Found Management SOP',
    'Extra Amenities Delivery Protocol',
    'DND & Privacy Policy Procedure',
  ],
  swms: [
    'Manual Handling of Linen & Supplies',
    'Working at Heights — High Dusting',
    'Chemical Handling & Mixing SWMS',
    'Hot Water & Steam Equipment Use',
    'Biological Hazard Cleanup SWMS',
  ],
};

export default function GenerateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [step, setStep] = useState(1); // 1: type, 2: category, 3: details, 4: generating
  const [docType, setDocType] = useState<'sop' | 'checklist' | 'swms'>('sop');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [title, setTitle] = useState('');
  const [requirements, setRequirements] = useState('');
  const [sectionsCount, setSectionsCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Load categories error:', err);
    }
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

  const handleGenerate = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your document');
      return;
    }

    setStep(4);
    setGenerating(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const result = await generateDocument({
        category: selectedCategory,
        document_type: docType,
        title: title.trim(),
        specific_requirements: requirements.trim() || undefined,
        sections_count: sectionsCount,
      });

      clearInterval(progressInterval);
      setProgress(100);

      // Short delay for UX
      setTimeout(() => {
        setGenerating(false);
        Alert.alert(
          'Document Generated!',
          `"${result.document?.title || title}" has been created successfully.`,
          [
            {
              text: 'View Document',
              onPress: () => {
                // Reset state
                resetForm();
                router.push('/(tabs)/documents');
              },
            },
            {
              text: 'Generate Another',
              onPress: () => {
                resetForm();
              },
            },
          ]
        );
      }, 500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setGenerating(false);
      setStep(3);
      console.error('Generate error:', err);
      Alert.alert(
        'Generation Failed',
        err?.response?.data?.detail || 'Failed to generate document. Please try again.'
      );
    }
  };

  const resetForm = () => {
    setStep(1);
    setDocType('sop');
    setSelectedCategory('');
    setTitle('');
    setRequirements('');
    setSectionsCount(5);
    setProgress(0);
  };

  const selectedCatInfo = categories.find(c => c.id === selectedCategory);

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What would you like to create?</Text>
      <Text style={styles.stepSubtitle}>Choose the type of document</Text>

      <TouchableOpacity
        style={[styles.typeCard, docType === 'sop' && styles.typeCardActive]}
        onPress={() => setDocType('sop')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={docType === 'sop' ? ['#7B2D8E', '#9B4DB0'] : ['#ffffff', '#f9fafb']}
          style={styles.typeCardGradient}
        >
          <View style={[styles.typeIconBg, { backgroundColor: docType === 'sop' ? 'rgba(255,255,255,0.2)' : '#f5f0ff' }]}>
            <Ionicons name="document-text" size={32} color={docType === 'sop' ? '#fff' : '#7B2D8E'} />
          </View>
          <Text style={[styles.typeTitle, docType === 'sop' && styles.typeTitleActive]}>
            Standard Operating Procedure
          </Text>
          <Text style={[styles.typeDesc, docType === 'sop' && styles.typeDescActive]}>
            Detailed step-by-step procedures with responsibilities, safety notes, and compliance requirements
          </Text>
          {docType === 'sop' && (
            <View style={styles.typeCheck}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.typeCard, docType === 'checklist' && styles.typeCardActive]}
        onPress={() => setDocType('checklist')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={docType === 'checklist' ? ['#2ECC71', '#27AE60'] : ['#ffffff', '#f9fafb']}
          style={styles.typeCardGradient}
        >
          <View style={[styles.typeIconBg, { backgroundColor: docType === 'checklist' ? 'rgba(255,255,255,0.2)' : '#ecfdf5' }]}>
            <Ionicons name="checkbox" size={32} color={docType === 'checklist' ? '#fff' : '#2ECC71'} />
          </View>
          <Text style={[styles.typeTitle, docType === 'checklist' && styles.typeTitleActive]}>
            Compliance Checklist
          </Text>
          <Text style={[styles.typeDesc, docType === 'checklist' && styles.typeDescActive]}>
            Actionable checkbox items for audits, inspections, and compliance verification
          </Text>
          {docType === 'checklist' && (
            <View style={styles.typeCheck}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.typeCard, docType === 'swms' && styles.typeCardActive]}
        onPress={() => setDocType('swms')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={docType === 'swms' ? ['#C0392B', '#E74C3C'] : ['#ffffff', '#f9fafb']}
          style={styles.typeCardGradient}
        >
          <View style={[styles.typeIconBg, { backgroundColor: docType === 'swms' ? 'rgba(255,255,255,0.2)' : '#fef2f2' }]}>
            <Ionicons name="shield-checkmark" size={32} color={docType === 'swms' ? '#fff' : '#C0392B'} />
          </View>
          <Text style={[styles.typeTitle, docType === 'swms' && styles.typeTitleActive]}>
            Safe Work Method Statement
          </Text>
          <Text style={[styles.typeDesc, docType === 'swms' && styles.typeDescActive]}>
            SWMS for high-risk activities with hazard controls, PPE requirements, and risk assessments
          </Text>
          {docType === 'swms' && (
            <View style={styles.typeCheck}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.nextBtn}
        onPress={() => setStep(2)}
      >
        <LinearGradient
          colors={['#7B2D8E', '#9B4DB0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.nextBtnGradient}
        >
          <Text style={styles.nextBtnText}>Choose Category</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select a Category</Text>
      <Text style={styles.stepSubtitle}>
        Choose the area for your {docType === 'sop' ? 'SOP' : docType === 'swms' ? 'SWMS' : 'checklist'}
      </Text>

      <View style={styles.categoryGrid}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.catCard,
              selectedCategory === cat.id && { borderColor: cat.color, borderWidth: 2 }
            ]}
            onPress={() => setSelectedCategory(cat.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.catIconBg, { backgroundColor: cat.color + '15' }]}>
              <Ionicons name={getCategoryIcon(cat.icon)} size={26} color={cat.color} />
            </View>
            <Text style={styles.catCardName}>{cat.name}</Text>
            {selectedCategory === cat.id && (
              <View style={[styles.catCheck, { backgroundColor: cat.color }]}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
          <Ionicons name="arrow-back" size={20} color="#7B2D8E" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, !selectedCategory && styles.nextBtnDisabled]}
          onPress={() => selectedCategory && setStep(3)}
          disabled={!selectedCategory}
        >
          <LinearGradient
            colors={selectedCategory ? ['#7B2D8E', '#9B4DB0'] : ['#d1d5db', '#d1d5db']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextBtnGradient}
          >
            <Text style={styles.nextBtnText}>Add Details</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => {
    const suggestions = SUGGESTED_TITLES[selectedCategory] || [];

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.stepContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.stepTitle}>Document Details</Text>
          <Text style={styles.stepSubtitle}>
            {selectedCatInfo?.name} — {docType === 'sop' ? 'SOP' : 'Checklist'}
          </Text>

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Document Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Guest Room Cleaning Procedure"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Suggestions */}
          {suggestions.length > 0 && !title && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsLabel}>
                <Ionicons name="bulb-outline" size={14} color="#f59e0b" /> Suggested titles:
              </Text>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionChip}
                  onPress={() => setTitle(s)}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                  <Ionicons name="add-circle-outline" size={16} color="#7B2D8E" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Additional Requirements */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Specific Requirements{' '}
              <Text style={styles.inputOptional}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Add any specific requirements, focus areas, or details you want included..."
              placeholderTextColor="#9ca3af"
              value={requirements}
              onChangeText={setRequirements}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Sections Count */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Number of Sections</Text>
            <View style={styles.sectionCountRow}>
              {[3, 5, 7, 10].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.sectionCountBtn,
                    sectionsCount === n && styles.sectionCountBtnActive,
                  ]}
                  onPress={() => setSectionsCount(n)}
                >
                  <Text style={[
                    styles.sectionCountText,
                    sectionsCount === n && styles.sectionCountTextActive,
                  ]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Generate Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Type</Text>
              <Text style={styles.summaryValue}>
                {docType === 'sop' ? 'Standard Operating Procedure' : docType === 'swms' ? 'Safe Work Method Statement' : 'Compliance Checklist'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Category</Text>
              <Text style={styles.summaryValue}>{selectedCatInfo?.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sections</Text>
              <Text style={styles.summaryValue}>{sectionsCount} sections</Text>
            </View>
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
              <Ionicons name="arrow-back" size={20} color="#7B2D8E" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.generateBtn, !title.trim() && styles.generateBtnDisabled]}
              onPress={handleGenerate}
              disabled={!title.trim() || generating}
            >
              <LinearGradient
                colors={title.trim() ? ['#7B2D8E', '#9B4DB0'] : ['#d1d5db', '#d1d5db']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateBtnGradient}
              >
                <Ionicons name="sparkles" size={20} color="#fff" />
                <Text style={styles.generateBtnText}>Generate with AI</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderStep4 = () => (
    <View style={styles.generatingContainer}>
      <LinearGradient
        colors={['#0a0a14', '#1a1a2e']}
        style={styles.generatingGradient}
      >
        <View style={styles.generatingContent}>
          <View style={styles.generatingIconWrap}>
            <ActivityIndicator size="large" color="#C4A265" />
          </View>
          <Text style={styles.generatingTitle}>Generating Document...</Text>
          <Text style={styles.generatingSubtitle}>
            Our AI is crafting your {docType === 'sop' ? 'SOP' : docType === 'swms' ? 'SWMS' : 'checklist'}
          </Text>
          <Text style={styles.generatingDocTitle}>"{title}"</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(Math.min(progress, 100))}%</Text>

          <View style={styles.generatingSteps}>
            <View style={styles.genStep}>
              <Ionicons
                name={progress > 10 ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={progress > 10 ? '#10b981' : '#6b7280'}
              />
              <Text style={[styles.genStepText, progress > 10 && styles.genStepDone]}>
                Analyzing requirements
              </Text>
            </View>
            <View style={styles.genStep}>
              <Ionicons
                name={progress > 40 ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={progress > 40 ? '#10b981' : '#6b7280'}
              />
              <Text style={[styles.genStepText, progress > 40 && styles.genStepDone]}>
                Generating content with AI
              </Text>
            </View>
            <View style={styles.genStep}>
              <Ionicons
                name={progress > 70 ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={progress > 70 ? '#10b981' : '#6b7280'}
              />
              <Text style={[styles.genStepText, progress > 70 && styles.genStepDone]}>
                Structuring sections
              </Text>
            </View>
            <View style={styles.genStep}>
              <Ionicons
                name={progress >= 100 ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={progress >= 100 ? '#10b981' : '#6b7280'}
              />
              <Text style={[styles.genStepText, progress >= 100 && styles.genStepDone]}>
                Saving document
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.screenHeader}>
        <View style={styles.headerLeft}>
          {step > 1 && step < 4 && (
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => setStep(step - 1)}
            >
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.screenTitle}>
              {step === 4 ? 'Generating...' : 'Create Document'}
            </Text>
            <Text style={styles.screenSubtitle}>
              {step === 1 ? 'AI-powered generation' : `Step ${step} of 3`}
            </Text>
          </View>
        </View>
        {step < 4 && (
          <TouchableOpacity style={styles.resetBtn} onPress={resetForm}>
            <Ionicons name="refresh" size={18} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Step Indicator */}
      {step < 4 && (
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map(s => (
            <View key={s} style={styles.stepDotRow}>
              <View
                style={[
                  styles.stepDot,
                  s <= step && styles.stepDotActive,
                  s < step && styles.stepDotCompleted,
                ]}
              >
                {s < step ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Text style={[styles.stepDotText, s <= step && styles.stepDotTextActive]}>
                    {s}
                  </Text>
                )}
              </View>
              {s < 3 && (
                <View style={[styles.stepLine, s < step && styles.stepLineActive]} />
              )}
            </View>
          ))}
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 1,
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 12,
  },
  stepDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#7B2D8E',
  },
  stepDotCompleted: {
    backgroundColor: '#10b981',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
  },
  stepDotTextActive: {
    color: '#fff',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
    borderRadius: 2,
  },
  stepLineActive: {
    backgroundColor: '#10b981',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  // Type Cards
  typeCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  typeCardActive: {},
  typeCardGradient: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  typeIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  typeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  typeTitleActive: {
    color: '#ffffff',
  },
  typeDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 19,
  },
  typeDescActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  typeCheck: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catCard: {
    width: (width - 50) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  catIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  catCardName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 18,
  },
  catCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Navigation
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    gap: 6,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B2D8E',
  },
  nextBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 20,
  },
  nextBtnDisabled: {
    opacity: 0.7,
  },
  nextBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  generateBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  generateBtnDisabled: {
    opacity: 0.7,
  },
  generateBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Inputs
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputOptional: {
    fontWeight: '400',
    color: '#9ca3af',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  suggestionsContainer: {
    marginBottom: 16,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  suggestionsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#fef3c7',
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    marginRight: 8,
  },
  sectionCountRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sectionCountBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  sectionCountBtnActive: {
    backgroundColor: '#7B2D8E',
    borderColor: '#7B2D8E',
  },
  sectionCountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  sectionCountTextActive: {
    color: '#ffffff',
  },
  summaryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    maxWidth: '60%',
    textAlign: 'right',
  },
  // Generating
  generatingContainer: {
    flex: 1,
  },
  generatingGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  generatingContent: {
    alignItems: 'center',
    width: '100%',
  },
  generatingIconWrap: {
    marginBottom: 24,
  },
  generatingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  generatingSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  generatingDocTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C4A265',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7B2D8E',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    marginBottom: 32,
  },
  generatingSteps: {
    width: '100%',
    gap: 12,
  },
  genStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  genStepText: {
    fontSize: 14,
    color: '#6b7280',
  },
  genStepDone: {
    color: '#10b981',
  },
});
