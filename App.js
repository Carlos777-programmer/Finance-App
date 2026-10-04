import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

// IP local do seu computador na rede Wi-Fi
const API_URL = 'http://192.168.3.177:8000';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [transacoes, setTransacoes] = useState([]);

  // Busca as transações do banco com validações de segurança
  const buscarTransacoes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/transacoes`);

      if (!response.ok) {
        console.warn(`Servidor retornou status: ${response.status}`);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setTransacoes([...data].reverse());
      } else {
        console.warn('Resposta da API não é uma lista válida:', data);
        setTransacoes([]);
      }
    } catch (error) {
      console.error('Erro de conexão ao buscar transações:', error);
    }
  };

  useEffect(() => {
    buscarTransacoes();
  }, []);

  // Envia o texto digitado para a API
  const handleEnviar = async () => {
    if (!prompt.trim()) return;

    setCarregando(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/processar-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ texto: prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Falha ao processar comando');
      }

      setPrompt('');
      await buscarTransacoes();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível conectar com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  // 1. Cálculos do resumo financeiro (executados antes do render)
  const totalReceitas = transacoes
    .filter((item) => item.tipo === 'receita')
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const totalDespesas = transacoes
    .filter((item) => item.tipo === 'despesa')
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const saldoTotal = totalReceitas - totalDespesas;

  const renderItem = ({ item }) => {
    const valorFormatado = Number(item.valor || 0).toFixed(2);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.descricao}>{item.descricao}</Text>
          <Text
            style={[
              styles.valor,
              item.tipo === 'despesa' ? styles.valorDespesa : styles.valorReceita,
            ]}
          >
            {item.tipo === 'despesa' ? '-' : '+'} R$ {valorFormatado}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.badge}>{item.categoria || 'Geral'}</Text>
          {!!item.conta_cartao && (
            <Text style={styles.badgeConta}>{item.conta_cartao}</Text>
          )}
          {item.total_parcelas > 1 && (
            <Text style={styles.badgeParcela}>{item.total_parcelas}x</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#121214" />

        <Text style={styles.titulo}>Minhas Finanças</Text>

        {/* 2. Card de Resumo Financeiro renderizado no lugar correto */}
        <View style={styles.resumoContainer}>
          <View style={styles.cardResumo}>
            <Text style={styles.resumoRotulo}>Saldo</Text>
            <Text
              style={[
                styles.resumoValor,
                saldoTotal >= 0 ? styles.valorReceita : styles.valorDespesa,
              ]}
            >
              R$ {saldoTotal.toFixed(2)}
            </Text>
          </View>

          <View style={styles.cardResumo}>
            <Text style={styles.resumoRotulo}>Entradas</Text>
            <Text style={[styles.resumoValor, styles.valorReceita]}>
              + R$ {totalReceitas.toFixed(2)}
            </Text>
          </View>

          <View style={styles.cardResumo}>
            <Text style={styles.resumoRotulo}>Saídas</Text>
            <Text style={[styles.resumoValor, styles.valorDespesa]}>
              - R$ {totalDespesas.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Campo de Entrada de Texto */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ex: Almoço 35 no cartão Itaú"
            placeholderTextColor="#7c7c8a"
            value={prompt}
            onChangeText={setPrompt}
          />
          <TouchableOpacity
            style={styles.botao}
            onPress={handleEnviar}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.textoBotao}>Lançar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Lista de Transações */}
        <Text style={styles.subtitulo}>Histórico</Text>
        <FlatList
          data={transacoes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhum lançamento registrado ainda.</Text>
          }
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  input: {
    flex: 1,
    backgroundColor: '#202024',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    fontSize: 15,
    marginRight: 10,
  },
  botao: {
    backgroundColor: '#8257e5',
    borderRadius: 8,
    width: 80,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotao: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c4c4cc',
    marginBottom: 15,
  },
  lista: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#202024',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  descricao: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  valor: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  valorDespesa: {
    color: '#f75a68',
  },
  valorReceita: {
    color: '#00b37e',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#29292e',
    color: '#c4c4cc',
    fontSize: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  badgeConta: {
    backgroundColor: '#121214',
    color: '#8257e5',
    fontSize: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  badgeParcela: {
    backgroundColor: '#29292e',
    color: '#fba94c',
    fontSize: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  vazio: {
    color: '#7c7c8a',
    textAlign: 'center',
    marginTop: 30,
  },
  resumoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  cardResumo: {
    flex: 1,
    backgroundColor: '#202024',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resumoRotulo: {
    color: '#7c7c8a',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  resumoValor: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});