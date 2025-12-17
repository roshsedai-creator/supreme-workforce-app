import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { colors } from '../constants/colors';

// Platform-specific imports
let SignatureCanvas: any = null;
let SignatureScreen: any = null;

if (Platform.OS === 'web') {
  // Use react-signature-canvas for web
  SignatureCanvas = require('react-signature-canvas').default;
} else {
  // Use react-native-signature-canvas for mobile
  SignatureScreen = require('react-native-signature-canvas').default;
}

interface SignaturePadProps {
  onOK: (signature: string) => void;
  onClear?: () => void;
}

export interface SignaturePadRef {
  clearSignature: () => void;
  readSignature: () => void;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({ onOK, onClear }, ref) => {
  const webSignatureRef = useRef<any>(null);
  const mobileSignatureRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    clearSignature: () => {
      if (Platform.OS === 'web' && webSignatureRef.current) {
        webSignatureRef.current.clear();
      } else if (mobileSignatureRef.current) {
        mobileSignatureRef.current.clearSignature();
      }
      onClear?.();
    },
    readSignature: () => {
      if (Platform.OS === 'web' && webSignatureRef.current) {
        if (webSignatureRef.current.isEmpty()) {
          alert('Please provide a signature');
          return;
        }
        const dataURL = webSignatureRef.current.toDataURL('image/png');
        onOK(dataURL);
      } else if (mobileSignatureRef.current) {
        mobileSignatureRef.current.readSignature();
      }
    },
  }));

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.signatureBox}>
          <SignatureCanvas
            ref={webSignatureRef}
            canvasProps={{
              style: {
                width: '100%',
                height: '100%',
                border: '2px dashed #ccc',
                borderRadius: 12,
                backgroundColor: 'white',
              },
            }}
            penColor="black"
            minWidth={1}
            maxWidth={3}
          />
        </View>
        <Text style={styles.hint}>Draw your signature above</Text>
      </View>
    );
  }

  // Mobile version
  return (
    <View style={styles.container}>
      <View style={styles.signatureBox}>
        <SignatureScreen
          ref={mobileSignatureRef}
          onOK={onOK}
          onEmpty={() => alert('Please provide a signature')}
          autoClear={false}
          descriptionText=""
          webStyle={`
            .m-signature-pad {
              box-shadow: none;
              border: 2px dashed #ccc;
              border-radius: 12px;
              height: 100%;
            }
            .m-signature-pad--body {
              border: none;
            }
            .m-signature-pad--footer {
              display: none;
            }
          `}
          backgroundColor="white"
          penColor="black"
          dotSize={2}
          minWidth={1}
          maxWidth={3}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  signatureBox: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
  },
  hint: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: colors.text.secondary,
  },
});

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
