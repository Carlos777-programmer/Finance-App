import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

export default function FaturasScreen() {
  const handleSelecionarCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        Alert.alert('Fatura Selecionada', `Ficheiro: ${file.name}`);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar o ficheiro.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>Importar Fatura CSV</Text>
      <Text style={styles.subtitulo}>
        Envia o extrato ou a fatura CSV do teu banco para importar automaticamente os teus gastos.
      </Text>

      <TouchableOpacity style={styles.cardUpload} onPress={handleSelecionarCSV}>
        <Feather name="file-text" size={42} color="#7C3AED" />
        <Text style={styles.textoUpload}>Selecionar ficheiro CSV</Text>
        <Text style={styles.textoSubUpload}>
          Suporta extratos do Nubank, Itaú, Inter, etc.
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E14', padding: 20 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 6 },
  subtitulo: { color: '#9CA3AF', fontSize: 13, marginBottom: 24, lineHeight: 18 },
  cardUpload: {
    backgroundColor: '#161B26',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#7C3AED',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoUpload: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginTop: 14 },
  textoSubUpload: { color: '#6B7280', fontSize: 12, marginTop: 6, textAlign: 'center' },
});