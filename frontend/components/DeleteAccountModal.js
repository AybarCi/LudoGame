import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';

const DeleteAccountModal = ({ visible, onClose, onConfirm, loading = false }) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Ionicons name="warning" size={24} color="#FF4444" />
            <Text style={styles.modalTitle}>Hesabı Sil</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.warningText}>
              Bu işlem geri alınamaz!{'\n\n'}
              Hesabınızı silerseniz:
            </Text>
            
            <View style={styles.warningList}>
              <Text style={styles.warningItem}>• Tüm oyun verileriniz silinecek</Text>
              <Text style={styles.warningItem}>• Puan ve istatistikleriniz kaybolacak</Text>
              <Text style={styles.warningItem}>• Satın aldığınız ürünler geri ödenmeyecek</Text>
              <Text style={styles.warningItem}>• Telefon numaranız kayıtlardan kaldırılacak</Text>
            </View>

            <Text style={styles.confirmationText}>
              Devam etmek istediğinize emin misiniz?
            </Text>
          </View>

          <View style={styles.modalFooter}>
            <Button
              title="İptal"
              type="outline"
              onPress={onClose}
              buttonStyle={styles.cancelButton}
              titleStyle={styles.cancelButtonText}
              disabled={loading}
            />
            <Button
              title={loading ? "Siliniyor..." : "Hesabı Sil"}
              onPress={onConfirm}
              buttonStyle={styles.deleteButton}
              titleStyle={styles.deleteButtonText}
              disabled={loading}
              icon={loading ? null : <Ionicons name="trash" size={16} color="white" style={{ marginRight: 8 }} />}
            />
          </View>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.loadingText}>Hesabınız siliniyor...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FF4444',
    flex: 1,
    marginLeft: 10,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    marginBottom: 25,
  },
  warningText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Poppins_500Medium',
    lineHeight: 20,
    marginBottom: 15,
  },
  warningList: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#FF4444',
  },
  warningItem: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 5,
    lineHeight: 18,
  },
  confirmationText: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginTop: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: 'white',
    fontFamily: 'Poppins_500Medium',
  },
});

export default DeleteAccountModal;