import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  StatusBar,
  Modal,
  Pressable,
  Keyboard,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'http://192.168.3.177:8000';

const BANCO_ICONES = {
  nubank: { icon: 'credit-card-outline', color: '#8A05BE' },
  itaú: { icon: 'bank', color: '#EC7000' },
  itau: { icon: 'bank', color: '#EC7000' },
  bradesco: { icon: 'bank', color: '#CC092F' },
  santander: { icon: 'bank', color: '#EC0000' },
  inter: { icon: 'lightning-bolt-outline', color: '#FF7A00' },
  carteira: { icon: 'wallet-outline', color: '#00F5D4' },
  dinheiro: { icon: 'cash', color: '#10B981' },
  geral: { icon: 'credit-card-chip-outline', color: '#7C3AED' },
};

const getBancoInfo = (nome = '') => {
  const n = String(nome).toLowerCase();
  for (const key in BANCO_ICONES) {
    if (n.includes(key)) return BANCO_ICONES[key];
  }
  return BANCO_ICONES.geral;
};

const formatBRL = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

// Adicionado pointerEvents="none" para evitar que o efeito de vidro bloqueie os inputs/toques
const GlassSurface = ({ children, style, intensity = 26 }) => (
  <View style={[styles.glassShell, style]}>
    <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
    <LinearGradient
      colors={['rgba(255,255,255,0.075)', 'rgba(255,255,255,0.018)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
    <View style={styles.glassHighlight} pointerEvents="none" />
    {children}
  </View>
);

export default function ContasScreen() {
  const [contas, setContas] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [nome, setNome] = useState('');
  const [saldo, setSaldo] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [contaEditando, setContaEditando] = useState(null);

  const listAnim = useRef(new Animated.Value(0)).current;

  const carregarDados = useCallback(async () => {
    try {
      const [resContas, resTrans] = await Promise.all([
        fetch(`${API_URL}/api/v1/contas`),
        fetch(`${API_URL}/api/v1/transacoes`),
      ]);

      if (resContas.ok) {
        const dataContas = await resContas.json();
        setContas(Array.isArray(dataContas) ? dataContas : []);
      }

      if (resTrans.ok) {
        const dataTrans = await resTrans.json();
        setTransacoes(Array.isArray(dataTrans) ? dataTrans : []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de contas:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  useEffect(() => {
    listAnim.setValue(0);
    Animated.spring(listAnim, {
      toValue: 1,
      friction: 8,
      tension: 42,
      useNativeDriver: true,
    }).start();
  }, [contas.length]);

  const calcularSaldoAtualConta = (conta) => {
    const saldoInicial = Number(conta.saldo_inicial || 0);

    const fluxoConta = transacoes
      .filter((t) => t.conta_cartao && t.conta_cartao.toLowerCase() === conta.nome.toLowerCase())
      .reduce((acc, t) => {
        const valor = Number(t.valor || 0);
        return t.tipo === 'receita' ? acc + valor : acc - valor;
      }, 0);

    return saldoInicial + fluxoConta;
  };

  const totalSaldosBancos = contas.reduce(
    (acc, conta) => acc + calcularSaldoAtualConta(conta),
    0
  );

  const abrirModalCriar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setContaEditando(null);
    setNome('');
    setSaldo('');
    setModalVisivel(true);
  };

  const abrirModalEditar = (conta) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setContaEditando(conta);
    setNome(conta.nome || '');
    setSaldo(String(conta.saldo_inicial || ''));
    setModalVisivel(true);
  };

  const fecharModal = () => {
    setModalVisivel(false);
    setContaEditando(null);
    setNome('');
    setSaldo('');
  };

  const handleSalvarConta = async () => {
    if (!nome.trim() || !saldo.trim() || carregando) {
      Alert.alert('Atenção', 'Preencha o nome do banco e o saldo inicial.');
      return;
    }

    Keyboard.dismiss();
    setCarregando(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const isEditMode = !!contaEditando;
      const url = isEditMode
        ? `${API_URL}/api/v1/contas/${contaEditando.id}`
        : `${API_URL}/api/v1/contas`;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          saldo_inicial: parseFloat(saldo.replace(',', '.')) || 0,
        }),
      });

      if (!response.ok) throw new Error('Falha ao salvar conta.');

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fecharModal();
      await carregarDados();
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro ao Salvar', error.message || 'Não foi possível salvar a instituição.');
    } finally {
      setCarregando(false);
    }
  };

  const handleDeletar = async (id, nomeConta) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      'Remover Conta',
      `Deseja realmente apagar "${nomeConta}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/v1/contas/${id}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                await carregarDados();
              } else {
                throw new Error('Falha ao deletar');
              }
            } catch (error) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Erro', 'Não foi possível deletar a conta.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item, index }) => {
    const info = getBancoInfo(item.nome);
    const valorSaldoAtual = calcularSaldoAtualConta(item);

    return (
      <Animated.View
        style={{
          opacity: listAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
          transform: [
            {
              translateY: listAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [18 + index * 3, 0],
              }),
            },
          ],
        }}
      >
        <Pressable
          onPress={() => abrirModalEditar(item)}
          style={({ pressed }) => [
            styles.cardOuter,
            pressed && styles.cardPressed,
          ]}
        >
          <GlassSurface style={styles.cardConta} intensity={18}>
            <View style={styles.cardMainRow}>
              <View style={[styles.bancoIconeBg, { backgroundColor: `${info.color}18` }]}>
                <MaterialCommunityIcons name={info.icon} size={22} color={info.color} />
              </View>

              <View style={styles.bancoTextos}>
                <Text style={styles.bancoNome} numberOfLines={1}>
                  {item.nome}
                </Text>
                <Text style={styles.bancoSub}>
                  Inicial: {formatBRL(item.saldo_inicial)}
                </Text>
              </View>

              <View style={styles.valorEAcao}>
                <Text
                  style={[
                    styles.bancoSaldo,
                    valorSaldoAtual < 0 && styles.bancoSaldoNegativo,
                  ]}
                >
                  {formatBRL(valorSaldoAtual)}
                </Text>

                <View style={styles.acoesGroup}>
                  <Pressable
                    onPress={() => abrirModalEditar(item)}
                    style={({ pressed }) => [
                      styles.btnAcao,
                      styles.btnEditar,
                      pressed && styles.btnAcaoPressed,
                    ]}
                    hitSlop={6}
                  >
                    <Feather name="edit-2" size={13} color="#C084FC" />
                  </Pressable>

                  <Pressable
                    onPress={() => handleDeletar(item.id, item.nome)}
                    style={({ pressed }) => [
                      styles.btnAcao,
                      styles.btnLixeira,
                      pressed && styles.btnAcaoPressed,
                    ]}
                    hitSlop={6}
                  >
                    <Feather name="trash-2" size={13} color="#FF4A5A" />
                  </Pressable>
                </View>
              </View>
            </View>
          </GlassSurface>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#05070A', '#080B12', '#0A0E17']}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={styles.ambientTop} />
      <View pointerEvents="none" style={styles.ambientBottom} />

      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#05070A" />

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.identityRow}>
            <View style={styles.avatarRing}>
              <LinearGradient
                colors={['#00F5D4', '#7C3AED', '#FF2E93']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <View style={styles.avatarInner}>
                  <Feather name="credit-card" size={16} color="#E9FFFC" />
                </View>
              </LinearGradient>
            </View>

            <View>
              <Text style={styles.kicker}>FINANCE MATRIX</Text>
              <Text style={styles.tituloApp}>Minhas Contas</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.btnNovaContaHeader}
            activeOpacity={0.8}
            onPress={abrirModalCriar}
          >
            <LinearGradient
              colors={['#7C3AED', '#6D2ED4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnNovaContaGradient}
            >
              <Feather name="plus" size={15} color="#FFFFFF" />
              <Text style={styles.btnNovaContaTexto}>Adicionar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* HERO CARD PATRIMÔNIO BANCÁRIO */}
        <GlassSurface style={styles.heroCard} intensity={34}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroRotulo}>PATRIMÔNIO BANCÁRIO</Text>
            <View style={styles.liveRow}>
              <View style={styles.liveMiniDot} />
              <Text style={styles.liveText}>{contas.length} CONTA(S)</Text>
            </View>
          </View>

          <Text style={styles.heroSaldo}>{formatBRL(totalSaldosBancos)}</Text>

          <View style={styles.heroGlowLine}>
            <LinearGradient
              colors={['transparent', '#00F5D4', '#7C3AED', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </View>

          <View style={styles.heroInfoFooter}>
            <Feather name="shield" size={13} color="#00F5D4" />
            <Text style={styles.heroFooterTexto}>Saldos liquidados e sincronizados em tempo real</Text>
          </View>
        </GlassSurface>

        {/* SEÇÃO HEADER */}
        <View style={styles.secaoHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionPulse} />
            <Text style={styles.subtitulo}>INSTITUIÇÕES CADASTRADAS</Text>
          </View>

          <View style={styles.counterPill}>
            <Text style={styles.qtdItens}>{contas.length}</Text>
          </View>
        </View>

        {/* LISTA DE CONTAS */}
        <FlatList
          data={contas}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <GlassSurface style={styles.emptyCard} intensity={16}>
              <View style={styles.emptyIcon}>
                <Feather name="credit-card" size={22} color="#7C3AED" />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma conta conectada</Text>
              <Text style={styles.emptyText}>
                Clique no botão "Adicionar" acima para cadastrar seu primeiro banco ou carteira.
              </Text>
            </GlassSurface>
          }
        />

        {/* MODAL CORRIGIDO PARA INPUTS */}
        <Modal
          visible={modalVisivel}
          animationType="fade"
          transparent
          onRequestClose={fecharModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalBackdropTouch} />
            </TouchableWithoutFeedback>

            <GlassSurface style={styles.modalContent} intensity={40}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather
                    name={contaEditando ? 'edit-3' : 'plus-circle'}
                    size={18}
                    color="#C084FC"
                  />
                  <Text style={styles.modalTitulo}>
                    {contaEditando ? 'Editar Instituição' : 'Adicionar Instituição'}
                  </Text>
                </View>
                <TouchableOpacity onPress={fecharModal} hitSlop={10}>
                  <Feather name="x" size={18} color="#7F8A9D" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>NOME DO BANCO OU CARTEIRA</Text>
              <View style={styles.modalInputCapsule}>
                <Feather name="home" size={15} color="#7C3AED" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ex: Nubank, Itaú, Dinheiro..."
                  placeholderTextColor="#626D80"
                  value={nome}
                  onChangeText={setNome}
                  selectionColor="#C084FC"
                  editable={true}
                />
              </View>

              <Text style={styles.inputLabel}>SALDO INICIAL (R$)</Text>
              <View style={styles.modalInputCapsule}>
                <Feather name="dollar-sign" size={15} color="#00F5D4" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ex: 1250.00"
                  placeholderTextColor="#626D80"
                  keyboardType="numeric"
                  value={saldo}
                  onChangeText={setSaldo}
                  selectionColor="#C084FC"
                  editable={true}
                />
              </View>

              <View style={styles.modalBotoes}>
                <TouchableOpacity style={styles.modalBtnCancelar} onPress={fecharModal}>
                  <Text style={styles.btnTextoCancelar}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalBtnSalvar}
                  onPress={handleSalvarConta}
                  disabled={carregando}
                >
                  <LinearGradient
                    colors={['#7C3AED', '#6D2ED4']}
                    style={styles.modalBtnSalvarGradient}
                  >
                    {carregando ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.btnTextoSalvar}>
                        {contaEditando ? 'Atualizar' : 'Salvar Conta'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </GlassSurface>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05070A',
  },

  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
  },

  ambientTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -100,
    right: -60,
    backgroundColor: 'rgba(124,58,237,0.08)',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.7,
    shadowRadius: 90,
  },

  ambientBottom: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    bottom: -150,
    left: -100,
    backgroundColor: 'rgba(0,245,212,0.045)',
    shadowColor: '#00F5D4',
    shadowOpacity: 0.5,
    shadowRadius: 90,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
    marginRight: 10,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 5,
  },

  avatarGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 2,
  },

  avatarInner: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#0B1018',
    justifyContent: 'center',
    alignItems: 'center',
  },

  kicker: {
    color: '#69758A',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 2,
  },

  tituloApp: {
    color: '#F6F8FC',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  btnNovaContaHeader: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },

  btnNovaContaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },

  btnNovaContaTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  glassShell: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(13,17,27,0.85)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    shadowColor: '#000',
    shadowOpacity: 0.38,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },

  heroCard: {
    padding: 18,
    marginBottom: 16,
  },

  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  heroRotulo: {
    color: '#7F8A9D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
  },

  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  liveMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#00F5D4',
    marginRight: 5,
  },

  liveText: {
    color: '#4C9F96',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  heroSaldo: {
    color: '#F9FCFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1.2,
    marginTop: 8,
    marginBottom: 12,
    textShadowColor: 'rgba(0,245,212,0.25)',
    textShadowRadius: 14,
  },

  heroGlowLine: {
    height: 1,
    width: '100%',
    overflow: 'hidden',
    opacity: 0.75,
    marginBottom: 10,
  },

  heroInfoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  heroFooterTexto: {
    color: '#6F7A8E',
    fontSize: 10,
    fontWeight: '500',
  },

  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionPulse: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#00F5D4',
    marginRight: 7,
  },

  subtitulo: {
    color: '#E9EDF5',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
  },

  counterPill: {
    minWidth: 32,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.065)',
  },

  qtdItens: {
    color: '#7E899B',
    fontSize: 9,
    fontWeight: '800',
  },

  lista: {
    paddingBottom: 25,
  },

  cardOuter: {
    marginBottom: 8,
  },

  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },

  cardConta: {
    padding: 12,
  },

  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  bancoIconeBg: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  bancoTextos: {
    flex: 1,
  },

  bancoNome: {
    color: '#EEF2F7',
    fontSize: 14,
    fontWeight: '750',
  },

  bancoSub: {
    color: '#6F7A8E',
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },

  valorEAcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  bancoSaldo: {
    color: '#00F5D4',
    fontSize: 13,
    fontWeight: '800',
  },

  bancoSaldoNegativo: {
    color: '#FF4A5A',
  },

  acoesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  btnAcao: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  btnEditar: {
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderColor: 'rgba(192,132,252,0.22)',
  },

  btnLixeira: {
    backgroundColor: 'rgba(255,74,90,0.10)',
    borderColor: 'rgba(255,74,90,0.18)',
  },

  btnAcaoPressed: {
    transform: [{ scale: 0.9 }],
  },

  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    marginTop: 8,
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,58,237,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.18)',
    marginBottom: 10,
  },

  emptyTitle: {
    color: '#E8ECF3',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },

  emptyText: {
    color: '#667184',
    fontSize: 10,
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 18,
  },

  modalBackdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },

  modalContent: {
    padding: 20,
    borderRadius: 24,
    zIndex: 10,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  modalTitulo: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },

  inputLabel: {
    color: '#7F8A9D',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 6,
  },

  modalInputCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 12,
  },

  modalInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  modalBotoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },

  modalBtnCancelar: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  btnTextoCancelar: {
    color: '#7F8A9D',
    fontSize: 12,
    fontWeight: '600',
  },

  modalBtnSalvar: {
    borderRadius: 12,
    overflow: 'hidden',
  },

  modalBtnSalvarGradient: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnTextoSalvar: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});