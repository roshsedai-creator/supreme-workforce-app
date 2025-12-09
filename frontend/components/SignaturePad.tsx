import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SignatureCanvas from 'react-native-signature-canvas';
import { colors } from '../constants/colors';

interface SignaturePadProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  title?: string;
}

export default function SignaturePad({ visible, onClose, onSave, title = "Sign Here" }: SignaturePadProps) {
  const signatureRef = useRef<any>();
  const [hasSignature, setHasSignature] = useState(false);

  const handleOK = (signature: string) => {
    setHasSignature(true);
    onSave(signature);
    onClose();
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setHasSignature(false);
  };

  const handleConfirm = () => {
    if (!hasSignature) {
      Alert.alert('Please sign', 'Please provide your signature before saving');
      return;
    }
    signatureRef.current?.readSignature();
  };

  const style = `.m-signature-pad {box-shadow: none; border: none; } 
                .m-signature-pad--body {border: none;}
                .m-signature-pad--footer {display: none; margin: 0px;}
                body,html {width: 100%; height: 100%;}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.instructions}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
          <Text style={styles.instructionText}>
            Please sign using your finger or stylus
          </Text>
        </View>

        <View style={styles.signatureContainer}>
          <SignatureCanvas
            ref={signatureRef}
            onOK={handleOK}
            onBegin={() => setHasSignature(true)}
            descriptionText=""
            clearText="Clear"
            confirmText="Save"
            webStyle={style}
            backgroundColor={colors.white}
            penColor={colors.text.primary}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Ionicons name="refresh" size={20} color={colors.error} />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleConfirm}>
            <Ionicons name="checkmark" size={20} color={colors.white} />
            <Text style={styles.saveButtonText}>Save Signature</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.primary + '15',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    gap: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  signatureContainer: {
    flex: 1,
    margin: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.error + '15',
    borderRadius: 12,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
