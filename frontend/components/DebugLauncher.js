// Debug Launcher - Uygulama crash'lerini debug etmek için
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import LaunchDiagnostics from '../utils/launchDiagnostics';
import CrashHandler from '../utils/crashHandler';

const DebugLauncher = ({ onContinue }) => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasErrors, setHasErrors] = useState(false);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    try {
      // Launch log'larını yükle
      const launchLogs = await LaunchDiagnostics.getLaunchLogs();
      setLogs(launchLogs);
      
      // Crash log'larını yükle
      const crashLogs = await CrashHandler.getCrashLogs();
      
      // Hata kontrolü
      const errorLogs = [...launchLogs, ...crashLogs].filter(log => 
        log.stage?.includes('ERROR') || log.stage?.includes('CRASH') || log.stage?.includes('FAILED')
      );
      
      setHasErrors(errorLogs.length > 0);
      setIsLoading(false);
      
      console.log('DebugLauncher: Diagnostics loaded:', { 
        launchLogs: launchLogs.length, 
        crashLogs: crashLogs.length,
        errorLogs: errorLogs.length 
      });
      
    } catch (error) {
      console.error('DebugLauncher: Failed to load diagnostics:', error);
      setIsLoading(false);
      setHasErrors(true);
    }
  };

  const handleContinue = () => {
    console.log('DebugLauncher: Continuing to app...');
    if (onContinue) {
      onContinue();
    }
  };

  const handleClearLogs = () => {
    LaunchDiagnostics.clearLaunchLogs();
    CrashHandler.clearCrashLogs();
    setLogs([]);
    setHasErrors(false);
  };

  const handleTestCrash = () => {
    if (__DEV__) {
      Alert.alert(
        'Test Crash',
        'Bir crash testi tetiklemek istiyor musunuz?',
        [
          { text: 'JavaScript Error', onPress: () => { throw new Error('Test JavaScript Error'); } },
          { text: 'Promise Rejection', onPress: () => Promise.reject(new Error('Test Promise Rejection')) },
          { text: 'İptal', style: 'cancel' }
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Debug Launcher</Text>
        <Text style={styles.loadingText}>Diagnostics yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐛 Debug Launcher</Text>
      
      {hasErrors && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ Uygulama başlatılırken hatalar tespit edildi!</Text>
        </View>
      )}
      
      <ScrollView style={styles.logContainer}>
        <Text style={styles.sectionTitle}>Launch Log'ları:</Text>
        {logs.length === 0 ? (
          <Text style={styles.noLogsText}>Henüz log yok</Text>
        ) : (
          logs.map((log, index) => (
            <View key={index} style={styles.logEntry}>
              <Text style={styles.logTimestamp}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
              <Text style={[styles.logStage, log.stage?.includes('ERROR') && styles.errorLog]}>
                {log.stage}
              </Text>
              {log.data && (
                <Text style={styles.logData}>{JSON.stringify(log.data, null, 2)}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Uygulamaya Devam Et</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClearLogs}>
          <Text style={styles.buttonText}>Log'ları Temizle</Text>
        </TouchableOpacity>
        
        {__DEV__ && (
          <TouchableOpacity style={[styles.button, styles.testButton]} onPress={handleTestCrash}>
            <Text style={styles.buttonText}>Test Crash Tetikle</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
  },
  errorBanner: {
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  noLogsText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  logEntry: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#3a3a4e',
    borderRadius: 5,
  },
  logTimestamp: {
    color: '#00D9CC',
    fontSize: 12,
  },
  logStage: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  errorLog: {
    color: '#ff4444',
  },
  logData: {
    color: '#aaa',
    fontSize: 10,
    marginTop: 5,
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    backgroundColor: '#6E00B3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
  },
  testButton: {
    backgroundColor: '#ffa500',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DebugLauncher;