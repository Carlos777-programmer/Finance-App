import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
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

const API_URL = 'http://192.168.3.177:8000';

const CATEGORIA_CONFIG = {
  alimentacao: { icon: 'food-fork-drink', color: '#FF7A00' },
  restaurante: { icon: 'silverware-fork-knife', color: '#FFB800' },
  mercado: { icon: 'cart', color: '#00F5D4' },
  transporte: { icon: 'car-side', color: '#3B82F6' },
  uber: { icon: 'taxi', color: '#60A5FA' },
  combustivel: { icon: 'gas-station', color: '#EF4444' },
  saude: { icon: 'hospital-box', color: '#EC4899' },
  lazer: { icon: 'gamepad-variant', color: '#A855F7' },
  educacao: { icon: 'school', color: '#8B5CF6' },
  servicos: { icon: 'lightning-bolt', color: '#F59E0B' },
  geral: { icon: 'wallet-outline', color: '#6B7280' },
};

const getCategoriaInfo = (categoria = '') => {
  const cat = categoria
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const key in CATEGORIA_CONFIG) {
    if (cat.includes(key)) return CATEGORIA_CONFIG[key];
  }
  return CATEGORIA_CONFIG.geral;
};

const formatBRL = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const GlassSurface = ({ children, style, intensity = 26 }) => (
  <View style={[styles.glassShell, style]}>
    <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
    <LinearGradient
      colors={['rgba(255,255,255,0.075)', 'rgba(255,255,255,0.018)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    <View style={styles.glassHighlight} />
    {children}
  </View>
);

export default function AnalyticsScreen() {
  const [transacoes, setTransacoes] = useState([]);
  const [metaMensal, setMetaMensal] = useState(3000); // Meta padrão R$ 3.000,00
  const [modalMetaVisivel, setModalMetaVisivel] = useState(false);
  const [novaMeta, setNovaMeta] = useState('3000');
  const [carregando, setCarregando] = useState(false);

  const heroAnim = useRef(new Animated.Value(0)).current;

  const carregarDados = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/transacoes`);
      if (response.ok) {
        const data = await response.json();
        setTransacoes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    }
  };

  useEffect(() => {
    carregarDados();

    Animated.spring(heroAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  // Cálculos de Despesas e Categorias
  const totalDespesas = useMemo(() => {
    return transacoes
      .filter((item) => item.tipo === 'despesa')
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);
  }, [transacoes]);

  const porcentagemUso = useMemo(() => {
    if (!metaMensal || metaMensal <= 0) return 0;
    return Math.round((totalDespesas / metaMensal) * 100);
  }, [totalDespesas, metaMensal]);

  // Agrupamento por Categoria
  const despesasPorCategoria = useMemo(() => {
    const mapa = {};
    const despesas = transacoes.filter((t) => t.tipo === 'despesa');

    despesas.forEach((item) => {
      const cat = item.categoria || 'Geral';
      mapa[cat] = (mapa[cat] || 0) + Number(item.valor || 0);
    });

    return Object.keys(mapa)
      .map((cat) => ({
        categoria: cat,
        total: mapa[cat],
        porcentagem: totalDespesas > 0 ? (mapa[cat] / totalDespesas) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [transacoes, totalDespesas]);

  // Cores dinâmicas da barra de progresso do orçamento
  const getCorOrcamento = (pct) => {
    if (pct < 70) return ['#00F5D4', '#10B981'];
    if (pct <= 90) return ['#FF7A00', '#F59E0B'];
    return ['#FF2E93', '#FF4A5A'];
  };

  const salvarMeta = async () => {
    const valor = parseFloat(novaMeta.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      Alert.alert('Valor inválido', 'Digite um valor de meta mensal válido.');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMetaMensal(valor);
    setModalMetaVisivel(false);
  };

  // Cálculo de dias restantes no mês
  const hoje = new Date();
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const diasRestantes = Math.max(1, ultimoDiaMes - hoje.getDate() + 1);
  const saldoDisponivelMeta = Math.max(0, metaMensal - totalDespesas);
  const limiteDiarioRecomendado = saldoDisponivelMeta / diasRestantes;

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
                  <Feather name="pie-chart" size={16} color="#E9FFFC" />
                </View>
              </LinearGradient>
            </View>

            <View>
              <Text style={styles.kicker}>FINANCE MATRIX</Text>
              <Text style={styles.tituloApp}>Análise & Orçamento</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.btnAjustarMeta}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setNovaMeta(String(metaMensal));
              setModalMetaVisivel(true);
            }}
          >
            <LinearGradient
              colors={['#7C3AED', '#6D2ED4']}
              style={styles.btnAjustarGradient}
            >
              <Feather name="target" size={14} color="#FFFFFF" />
              <Text style={styles.btnAjustarTexto}>Definir Meta</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          {/* HERO CARD - BARRA DE ORÇAMENTO */}
          <Animated.View
            style={{
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            }}
          >
            <GlassSurface style={styles.heroCard} intensity={34}>
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.heroRotulo}>CONTROLE DE META MENSAL</Text>
                  <Text style={styles.heroMetaValor}>
                    Limite: <Text style={{ color: '#F9FCFF' }}>{formatBRL(metaMensal)}</Text>
                  </Text>
                </View>

                <View
                  style={[
                    styles.pctBadge,
                    {
                      backgroundColor:
                        porcentagemUso > 90
                          ? 'rgba(255,74,90,0.15)'
                          : 'rgba(0,245,212,0.12)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pctBadgeTexto,
                      { color: porcentagemUso > 90 ? '#FF4A5A' : '#00F5D4' },
                    ]}
                  >
                    {porcentagemUso}% usado
                  </Text>
                </View>
              </View>

              {/* BARRA DE PROGRESSO NEON */}
              <View style={styles.barContainer}>
                <View style={styles.barFundo}>
                  <LinearGradient
                    colors={getCorOrcamento(porcentagemUso)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.barPreenchimento,
                      { width: `${Math.min(porcentagemUso, 100)}%` },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.heroInfoRow}>
                <View>
                  <Text style={styles.infoRotulo}>Gasto Atual</Text>
                  <Text style={[styles.infoValor, styles.valorDespesa]}>
                    {formatBRL(totalDespesas)}
                  </Text>
                </View>

                <View style={styles.metricDivider} />

                <View>
                  <Text style={styles.infoRotulo}>Saldo na Meta</Text>
                  <Text style={[styles.infoValor, { color: '#00F5D4' }]}>
                    {formatBRL(saldoDisponivelMeta)}
                  </Text>
                </View>
              </View>

              <View style={styles.heroGlowLine}>
                <LinearGradient
                  colors={['transparent', '#00F5D4', '#7C3AED', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>

              <View style={styles.dicaRow}>
                <Feather name="zap" size={13} color="#C084FC" />
                <Text style={styles.dicaTexto}>
                  Recomendação: Mantenha seus gastos abaixo de{' '}
                  <Text style={{ color: '#00F5D4', fontWeight: '800' }}>
                    {formatBRL(limiteDiarioRecomendado)}
                  </Text>
                  /dia pelos próximos {diasRestantes} dias.
                </Text>
              </View>
            </GlassSurface>
          </Animated.View>

          {/* SEÇÃO GRÁFICO / DISTRIBUIÇÃO POR CATEGORIA */}
          <View style={styles.secaoHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionPulse} />
              <Text style={styles.subtitulo}>DISTRIBUIÇÃO POR CATEGORIA</Text>
            </View>

            <View style={styles.counterPill}>
              <Text style={styles.qtdItens}>{despesasPorCategoria.length} cat.</Text>
            </View>
          </View>

          {despesasPorCategoria.length === 0 ? (
            <GlassSurface style={styles.emptyCard} intensity={16}>
              <Feather name="bar-chart-2" size={24} color="#7C3AED" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>Sem dados de gastos</Text>
              <Text style={styles.emptyText}>
                Cadastre saídas na Home para visualizar o gráfico de distribuição.
              </Text>
            </GlassSurface>
          ) : (
            despesasPorCategoria.map((item, index) => {
              const info = getCategoriaInfo(item.categoria);
              return (
                <Pressable
                  key={index}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  style={({ pressed }) => [
                    styles.catOuter,
                    pressed && styles.catPressed,
                  ]}
                >
                  <GlassSurface style={styles.catCard} intensity={18}>
                    <View style={styles.catHeader}>
                      <View style={styles.catIconETextos}>
                        <View
                          style={[
                            styles.catIconeBg,
                            { backgroundColor: `${info.color}18` },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={info.icon}
                            size={20}
                            color={info.color}
                          />
                        </View>
                        <View>
                          <Text style={styles.catNome}>{item.categoria}</Text>
                          <Text style={styles.catPct}>
                            {item.porcentagem.toFixed(1)}% das despesas
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.catValor}>{formatBRL(item.total)}</Text>
                    </View>

                    {/* Barra de Progresso Individual da Categoria */}
                    <View style={styles.catBarFundo}>
                      <View
                        style={[
                          styles.catBarPreenchimento,
                          {
                            width: `${Math.min(item.porcentagem, 100)}%`,
                            backgroundColor: info.color,
                          },
                        ]}
                      />
                    </View>
                  </GlassSurface>
                </Pressable>
              );
            })
          )}
        </ScrollView>

        {/* MODAL PARA EDITAR META MENSAL */}
        <Modal
          visible={modalMetaVisivel}
          animationType="fade"
          transparent
          onRequestClose={() => setModalMetaVisivel(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ width: '100%' }}
              >
                <GlassSurface style={styles.modalContent} intensity={40}>
                  <View style={styles.modalHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Feather name="target" size={18} color="#C084FC" />
                      <Text style={styles.modalTitulo}>Definir Meta de Orçamento</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setModalMetaVisivel(false)}
                      hitSlop={10}
                    >
                      <Feather name="x" size={18} color="#7F8A9D" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>LIMITE MENSAL DE GASTOS (R$)</Text>
                  <View style={styles.modalInputCapsule}>
                    <Feather name="dollar-sign" size={15} color="#00F5D4" style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Ex: 3000.00"
                      placeholderTextColor="#626D80"
                      keyboardType="numeric"
                      value={novaMeta}
                      onChangeText={setNovaMeta}
                      selectionColor="#C084FC"
                      autoFocus
                    />
                  </View>

                  <View style={styles.modalBotoes}>
                    <TouchableOpacity
                      style={styles.modalBtnCancelar}
                      onPress={() => setModalMetaVisivel(false)}
                    >
                      <Text style={styles.btnTextoCancelar}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalBtnSalvar}
                      onPress={salvarMeta}
                    >
                      <LinearGradient
                        colors={['#7C3AED', '#6D2ED4']}
                        style={styles.modalBtnSalvarGradient}
                      >
                        <Text style={styles.btnTextoSalvar}>Atualizar Meta</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </GlassSurface>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
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

  btnAjustarMeta: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },

  btnAjustarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },

  btnAjustarTexto: {
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
    alignItems: 'flex-start',
  },

  heroRotulo: {
    color: '#7F8A9D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
  },

  heroMetaValor: {
    color: '#6F7A8E',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },

  pctBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  pctBadgeTexto: {
    fontSize: 11,
    fontWeight: '800',
  },

  barContainer: {
    marginVertical: 14,
  },

  barFundo: {
    height: 10,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 5,
    overflow: 'hidden',
  },

  barPreenchimento: {
    height: '100%',
    borderRadius: 5,
  },

  heroInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  infoRotulo: {
    color: '#6F7A8E',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },

  infoValor: {
    fontSize: 14,
    fontWeight: '800',
  },

  valorDespesa: {
    color: '#FF4A5A',
  },

  metricDivider: {
    width: 1,
    height: 25,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  heroGlowLine: {
    height: 1,
    width: '100%',
    overflow: 'hidden',
    opacity: 0.75,
    marginBottom: 12,
  },

  dicaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  dicaTexto: {
    color: '#7F8A9D',
    fontSize: 10,
    flex: 1,
    lineHeight: 14,
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

  catOuter: {
    marginBottom: 8,
  },

  catPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },

  catCard: {
    padding: 12,
  },

  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  catIconETextos: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  catIconeBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  catNome: {
    color: '#EEF2F7',
    fontSize: 13,
    fontWeight: '750',
  },

  catPct: {
    color: '#6F7A8E',
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },

  catValor: {
    color: '#FF4A5A',
    fontSize: 13,
    fontWeight: '800',
  },

  catBarFundo: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },

  catBarPreenchimento: {
    height: '100%',
    borderRadius: 2,
  },

  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    marginTop: 8,
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

  modalContent: {
    padding: 20,
    borderRadius: 24,
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

  modalInputCapsula: {
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