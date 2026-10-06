import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const API_URL = 'http://192.168.3.177:8000';

export default function ContasScreen() {
  const [contas, setContas] = useState([]);
  const [nome, setNome] = useState('');
  const [saldo, setSaldo] = useState('');

  const carregarContas = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/contas`);
      if (response.ok) {
        const data = await response.json();
        setContas(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    carregarContas();
  }, []);

  const handleSalvarConta = async () => {
    if (!nome.trim() || !saldo.trim()) {
      Alert.alert('Atenção', 'Preencha o nome da conta e o saldo.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/contas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          saldo_inicial: parseFloat(saldo.replace(',', '.')) || 0,
        }),
      });

      if (response.ok) {
        setNome('');
        setSaldo('');
        await carregarContas();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível cadastrar a conta.');
    }
  };

  const handleDeletar = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/contas/${id}`, { method: 'DELETE' });
      if (response.ok) await carregarContas();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível deletar a conta.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>Minhas Contas & Carteiras</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nome do Banco (ex: Nubank, Itaú)"
          placeholderTextColor="#6B7280"
          value={nome}
          onChangeText={setNome}
        />
        <TextInput
          style={styles.input}
          placeholder="Saldo Inicial (ex: 1250.00)"
          placeholderTextColor="#6B7280"
          keyboardType="numeric"
          value={saldo}
          onChangeText={setSaldo}
        />
        <TouchableOpacity style={styles.btnSalvar} onPress={handleSalvarConta}>
          <Text style={styles.btnTexto}>+ Adicionar Conta</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={contas}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Feather name="credit-card" size={20} color="#A78BFA" />
              <View>
                <Text style={styles.nomeConta}>{item.nome}</Text>
                <Text style={styles.saldoConta}>R$ {Number(item.saldo_inicial).toFixed(2)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDeletar(item.id)}>
              <Feather name="trash-2" size={18} color="#FF4A5A" />
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E14', padding: 20 },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 16 },
  form: { backgroundColor: '#161B26', padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#262E3D' },
  input: { backgroundColor: '#0B0E14', borderRadius: 8, padding: 12, color: '#FFF', marginBottom: 10, borderWidth: 1, borderColor: '#262E3D' },
  btnSalvar: { backgroundColor: '#7C3AED', borderRadius: 8, padding: 12, alignItems: 'center' },
  btnTexto: { color: '#FFF', fontWeight: 'bold' },
  card: { backgroundColor: '#161B26', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#262E3D' },
  nomeConta: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  saldoConta: { color: '#00F5D4', fontSize: 14, fontWeight: 'bold' },
});