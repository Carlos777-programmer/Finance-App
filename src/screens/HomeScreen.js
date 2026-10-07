import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Keyboard,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const API_URL = 'http://192.168.3.177:8000';

const CATEGORIA_ICONES = {
  alimentacao: 'food-fork-drink',
  restaurante: 'silverware-fork-knife',
  mercado: 'cart',
  transporte: 'car-side',
  uber: 'taxi',
  combustivel: 'gas-station',
  saude: 'hospital-box',
  lazer: 'gamepad-variant',
  educacao: 'school',
  salario: 'cash-multiple',
  renda: 'trending-up',
  servicos: 'lightning-bolt',
  geral: 'wallet-outline',
};

const PLACEHOLDERS = [
  'Ex: Gastei 45 no mercado hoje...',
  'Ex: Recebi 1200 via PIX...',
  'Ex: Abasteci 180 no posto...',
  'Ex: Paguei 79,90 de internet...',
];

const getCategoriaIcon = (categoria = '') => {
  if (!categoria) return CATEGORIA_ICONES.geral;

  const cat = String(categoria)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const key in CATEGORIA_ICONES) {
    if (cat.includes(key)) return CATEGORIA_ICONES[key];
  }
  return CATEGORIA_ICONES.geral;
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

export default function HomeScreen() {
  const [prompt, setPrompt] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [transacoes, setTransacoes] = useState([]);
  const [contas, setContas] = useState([]);
  const [filtroAtivo, setFiltroAtivo] = useState('todos');
  const [saldoOculto, setSaldoOculto] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const heroFloat = useRef(new Animated.Value(0)).current;
  const aiPulse = useRef(new Animated.Value(0)).current;
  const orbPulse = useRef(new Animated.Value(0)).current;
  const inputPulse = useRef(new Animated.Value(0)).current;
  const privacyAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const placeholderOpacity = useRef(new Animated.Value(1)).current;

  const carregarDados = async () => {
    try {
      const [resTrans, resContas] = await Promise.all([
        fetch(`${API_URL}/api/v1/transacoes`),
        fetch(`${API_URL}/api/v1/contas`),
      ]);

      if (resTrans.ok) {
        const dataTrans = await resTrans.json();
        setTransacoes(Array.isArray(dataTrans) ? [...dataTrans].reverse() : []);
      }

      if (resContas.ok) {
        const dataContas = await resContas.json();
        setContas(Array.isArray(dataContas) ? dataContas : []);
      }
    } catch (error) {
      console.error('Erro de conexão ao buscar dados:', error);
    }
  };

  useEffect(() => {
    carregarDados();

    Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloat, {
          toValue: 1,
          duration: 3600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(heroFloat, {
          toValue: 0,
          duration: 3600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(aiPulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(aiPulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(orbPulse, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.sequence([
        Animated.timing(placeholderOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(placeholderOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();

      setPlaceholderIndex((current) => (current + 1) % PLACEHOLDERS.length);
    }, 3300);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Animated.spring(listAnim, {
      toValue: 1,
      friction: 8,
      tension: 42,
      useNativeDriver: true,
    }).start();
  }, [filtroAtivo, transacoes.length]);

  const enviarComando = async () => {
    if (!prompt.trim() || carregando) return;

    Keyboard.dismiss();
    setCarregando(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await fetch(`${API_URL}/api/v1/processar-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: prompt }),
      });

      if (!response.ok) throw new Error('Falha ao processar comando');

      setPrompt('');
      await carregarDados();

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.sequence([
        Animated.timing(inputPulse, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(inputPulse, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Conexão interrompida', error.message || 'Não foi possível conectar com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  const handleDeletarTransacao = async (id, descricao) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      'Remover Transação',
      `Deseja apagar "${descricao || 'esta transação'}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/v1/transacoes/${id}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                await carregarDados();
              } else {
                throw new Error('Falha ao remover transação');
              }
            } catch (error) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Erro', 'Não foi possível deletar a transação.');
            }
          },
        },
      ]
    );
  };

  const alternarPrivacidade = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(privacyAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(privacyAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();

    setSaldoOculto((value) => !value);
  };

  const selecionarFiltro = async (id) => {
    await Haptics.selectionAsync();
    setFiltroAtivo(id);
  };

  const totalSaldosIniciais = contas.reduce(
    (acc, c) => acc + Number(c.saldo_inicial || 0),
    0
  );

  const totalReceitas = transacoes
    .filter((item) => item.tipo === 'receita')
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const totalDespesas = transacoes
    .filter((item) => item.tipo === 'despesa')
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const patrimonioTotal = totalSaldosIniciais + totalReceitas - totalDespesas;

  const transacoesFiltradas = useMemo(
    () =>
      transacoes.filter((item) => {
        if (filtroAtivo === 'todos') return true;
        if (filtroAtivo === 'despesa') return item.tipo === 'despesa';
        if (filtroAtivo === 'receita') return item.tipo === 'receita';
        return item.categoria && item.categoria.toLowerCase() === filtroAtivo.toLowerCase();
      }),
    [transacoes, filtroAtivo]
  );

  const opcoesFiltro = [
    { id: 'todos', label: 'Tudo', icon: 'layers' },
    { id: 'despesa', label: 'Saídas', icon: 'arrow-up-right' },
    { id: 'receita', label: 'Entradas', icon: 'arrow-down-left' },
    { id: 'Alimentação', label: 'Alimentação', icon: 'coffee' },
    { id: 'Transporte', label: 'Transporte', icon: 'truck' },
    { id: 'Lazer', label: 'Lazer', icon: 'tv' },
  ];

  const AnimatedGlow = ({ style }) => (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glowOrb,
        style,
        {
          opacity: aiPulse.interpolate({
            inputRange: [0, 1],
            outputRange: [0.26, 0.58],
          }),
          transform: [
            {
              scale: aiPulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1.18],
              }),
            },
          ],
        },
      ]}
    />
  );

  const renderWave = (top, width, rotate, opacity, color) => (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wave,
        {
          top,
          width,
          borderColor: color,
          opacity: orbPulse.interpolate({
            inputRange: [0, 1],
            outputRange: [opacity * 0.55, opacity],
          }),
          transform: [
            { rotate: `${rotate}deg` },
            {
              translateX: heroFloat.interpolate({
                inputRange: [0, 1],
                outputRange: [-12, 12],
              }),
            },
          ],
        },
      ]}
    />
  );

  const renderItem = ({ item, index }) => {
    const isDespesa = item.tipo === 'despesa';
    const valor = Number(item.valor || 0);
    const valorCritico = isDespesa && valor >= Math.max(250, totalDespesas * 0.15);
    const iconName = getCategoriaIcon(item.categoria);

    return (
      <Animated.View
        style={[
          {
            opacity: listAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            transform: [
              {
                translateY: listAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20 + index * 3, 0],
                }),
              },
              {
                scale: listAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.97, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          style={({ pressed }) => [
            styles.transactionOuter,
            pressed && styles.transactionPressed,
          ]}
        >
          <GlassSurface style={styles.transactionCard} intensity={18}>
            {valorCritico && <View style={styles.criticalRail} />}

            <View style={styles.cardIconeETextos}>
              <LinearGradient
                colors={
                  isDespesa
                    ? ['rgba(255,46,147,0.20)', 'rgba(255,74,90,0.05)']
                    : ['rgba(0,245,212,0.20)', 'rgba(16,185,129,0.05)']
                }
                style={styles.iconeBg}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={21}
                  color={isDespesa ? '#FF4A5A' : '#00F5D4'}
                />
              </LinearGradient>

              <View style={styles.cardTextos}>
                <Text style={styles.descricao} numberOfLines={1}>
                  {item.descricao || 'Transação'}
                </Text>

                <View style={styles.badgerow}>
                  <Text style={styles.badge}>{item.categoria || 'Geral'}</Text>
                  {!!item.conta_cartao && (
                    <Text style={styles.badgeConta}>{item.conta_cartao}</Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.valorEExcluirGroup}>
              <View style={styles.valorContainer}>
                <Text
                  style={[
                    styles.valor,
                    isDespesa ? styles.valorDespesa : styles.valorReceita,
                  ]}
                >
                  {isDespesa ? '-' : '+'} {formatBRL(valor)}
                </Text>
                {valorCritico && (
                  <View style={styles.alertDot}>
                    <Feather name="alert-triangle" size={9} color="#FF4A5A" />
                  </View>
                )}
              </View>

              <Pressable
                onPress={() => handleDeletarTransacao(item.id, item.descricao)}
                style={({ pressed }) => [
                  styles.btnTrashTransacao,
                  pressed && styles.btnTrashPressed,
                ]}
                hitSlop={8}
              >
                <Feather name="trash-2" size={13} color="#FF4A5A" />
              </Pressable>
            </View>
          </GlassSurface>
        </Pressable>
      </Animated.View>
    );
  };

  const saldoVisivel = saldoOculto ? '••••••' : formatBRL(patrimonioTotal);

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
                  <Feather name="user" size={17} color="#E9FFFC" />
                </View>
              </LinearGradient>
            </View>

            <View>
              <Text style={styles.kicker}>FINANCE MATRIX</Text>
              <Text style={styles.tituloApp}>Central de comando</Text>
            </View>
          </View>

          <Animated.View
            style={[
              styles.aiBadgeWrap,
              {
                opacity: aiPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.82, 1],
                }),
                transform: [
                  {
                    scale: aiPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.035],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.aiBadge}>
              <Animated.View
                style={[
                  styles.aiDotGlow,
                  {
                    opacity: aiPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.25, 0.8],
                    }),
                  },
                ]}
              />
              <View style={styles.aiDot} />
              <Text style={styles.statusIaTexto}>GEMINI CORE</Text>
            </View>
          </Animated.View>
        </View>

        {/* HERO */}
        <Animated.View
          style={{
            transform: [
              {
                translateY: heroFloat.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -3],
                }),
              },
            ],
          }}
        >
          <GlassSurface style={styles.heroCard} intensity={34}>
            <AnimatedGlow style={styles.glowTop} />
            <AnimatedGlow style={styles.glowRight} />

            <View style={styles.heroGridLine} />

            {renderWave(30, '125%', -8, 0.34, '#00F5D4')}
            {renderWave(54, '115%', 7, 0.18, '#7C3AED')}
            {renderWave(83, '105%', -5, 0.13, '#00F5D4')}

            <View style={styles.heroHeader}>
              <View>
                <Text style={styles.heroRotulo}>PATRIMÔNIO ATUAL</Text>
                <View style={styles.liveRow}>
                  <View style={styles.liveMiniDot} />
                  <Text style={styles.liveText}>MONITORAMENTO ATIVO</Text>
                </View>
              </View>

              <Pressable
                onPress={alternarPrivacidade}
                style={styles.eyeButton}
              >
                <Feather
                  name={saldoOculto ? 'eye-off' : 'eye'}
                  size={17}
                  color="#C084FC"
                />
              </Pressable>
            </View>

            <Animated.View
              style={{
                opacity: privacyAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.35],
                }),
                transform: [
                  {
                    scale: privacyAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.985],
                    }),
                  },
                ],
              }}
            >
              <Text style={styles.heroSaldo}>{saldoVisivel}</Text>
            </Animated.View>

            <View style={styles.heroGlowLine}>
              <LinearGradient
                colors={['transparent', '#00F5D4', '#7C3AED', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </View>

            <View style={styles.heroMetricasRow}>
              <View style={styles.heroMetrica}>
                <View style={styles.metricaHeaderRow}>
                  <View style={styles.metricIconPositive}>
                    <Feather name="arrow-down-left" size={11} color="#00F5D4" />
                  </View>
                  <Text style={styles.metricaRotulo}>ENTRADAS</Text>
                </View>
                <Text style={[styles.metricaValor, styles.valorReceita]}>
                  {saldoOculto ? '••••' : `+ ${formatBRL(totalReceitas)}`}
                </Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.heroMetrica}>
                <View style={styles.metricaHeaderRow}>
                  <View style={styles.metricIconNegative}>
                    <Feather name="arrow-up-right" size={11} color="#FF4A5A" />
                  </View>
                  <Text style={styles.metricaRotulo}>SAÍDAS</Text>
                </View>
                <Text style={[styles.metricaValor, styles.valorDespesa]}>
                  {saldoOculto ? '••••' : `- ${formatBRL(totalDespesas)}`}
                </Text>
              </View>
            </View>
          </GlassSurface>
        </Animated.View>

        {/* IA INPUT */}
        <View style={styles.inputZone}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.inputRipple,
              {
                opacity: inputPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.48],
                }),
                transform: [
                  {
                    scale: inputPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1.035],
                    }),
                  },
                ],
              },
            ]}
          />

          <GlassSurface style={styles.inputCapsula} intensity={30}>
            <LinearGradient
              colors={[
                'rgba(124,58,237,0.32)',
                'rgba(192,132,252,0.08)',
                'rgba(124,58,237,0.22)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.inputNeonBorder}
            />

            <View style={styles.inputIconeBox}>
              <Feather name="zap" size={15} color="#C084FC" />
            </View>

            <View style={styles.inputTextWrap}>
              {!prompt && (
                <Animated.Text
                  pointerEvents="none"
                  style={[styles.dynamicPlaceholder, { opacity: placeholderOpacity }]}
                >
                  {PLACEHOLDERS[placeholderIndex]}
                </Animated.Text>
              )}
              <TextInput
                style={styles.input}
                placeholder=""
                placeholderTextColor="transparent"
                value={prompt}
                onChangeText={setPrompt}
                onSubmitEditing={enviarComando}
                returnKeyType="send"
                selectionColor="#C084FC"
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.botaoEnviar,
                !prompt.trim() && styles.botaoEnviarIdle,
                pressed && styles.botaoEnviarPressed,
              ]}
              onPress={enviarComando}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Feather name="arrow-up-right" size={17} color="#FFFFFF" />
              )}
            </Pressable>
          </GlassSurface>
        </View>

        {/* HISTORY HEADER */}
        <View style={styles.secaoHeader}>
          <View>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionPulse} />
              <Text style={styles.subtitulo}>FLUXO FINANCEIRO</Text>
            </View>
            <Text style={styles.sectionCaption}>Movimentações recentes</Text>
          </View>

          <View style={styles.counterPill}>
            <Text style={styles.qtdItens}>
              {transacoesFiltradas.length}/{transacoes.length}
            </Text>
          </View>
        </View>

        {/* FILTERS */}
        <View style={styles.filtersArea}>
          <FlatList
            horizontal
            data={opcoesFiltro}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => {
              const active = filtroAtivo === item.id;

              return (
                <Pressable
                  onPress={() => selecionarFiltro(item.id)}
                  style={({ pressed }) => [
                    styles.chipFiltro,
                    active && styles.chipFiltroAtivo,
                    pressed && styles.chipPressed,
                  ]}
                >
                  {active && <View style={styles.chipAura} />}
                  <Feather
                    name={item.icon}
                    size={13}
                    color={active ? '#FFFFFF' : '#788399'}
                  />
                  <Text
                    style={[
                      styles.textoChipFiltro,
                      active && styles.textoChipFiltroAtivo,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {/* TRANSACTIONS */}
        <FlatList
          data={transacoesFiltradas}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <GlassSurface style={styles.emptyCard} intensity={16}>
              <View style={styles.emptyIcon}>
                <Feather name="activity" size={21} color="#7C3AED" />
              </View>
              <Text style={styles.emptyTitle}>Fluxo limpo</Text>
              <Text style={styles.emptyText}>
                Nenhuma movimentação encontrada neste filtro.
              </Text>
            </GlassSurface>
          }
        />
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

  aiBadgeWrap: {
    shadowColor: '#7C3AED',
    shadowOpacity: 0.55,
    shadowRadius: 13,
    elevation: 6,
  },

  aiBadge: {
    minWidth: 102,
    height: 31,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.32)',
    backgroundColor: 'rgba(38,24,65,0.70)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  aiDotGlow: {
    position: 'absolute',
    left: 11,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00F5D4',
  },

  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00F5D4',
    marginRight: 7,
  },

  statusIaTexto: {
    color: '#C084FC',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.9,
  },

  glassShell: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(13,17,27,0.68)',
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
    height: 202,
    padding: 18,
    marginBottom: 13,
  },

  glowOrb: {
    position: 'absolute',
    width: 115,
    height: 115,
    borderRadius: 58,
    backgroundColor: '#00F5D4',
    shadowColor: '#00F5D4',
    shadowOpacity: 0.9,
    shadowRadius: 35,
  },

  glowTop: {
    top: -72,
    right: -25,
  },

  glowRight: {
    bottom: -85,
    left: -58,
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
  },

  heroGridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '63%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },

  wave: {
    position: 'absolute',
    left: '-12%',
    height: 42,
    borderWidth: 1,
    borderRadius: 999,
    transformOrigin: 'center',
  },

  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 3,
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
    marginTop: 5,
  },

  liveMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#00F5D4',
    marginRight: 5,
    shadowColor: '#00F5D4',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },

  liveText: {
    color: '#4C9F96',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
  },

  eyeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.20)',
    backgroundColor: 'rgba(124,58,237,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroSaldo: {
    color: '#F9FCFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.4,
    marginTop: 11,
    marginBottom: 10,
    textShadowColor: 'rgba(0,245,212,0.25)',
    textShadowRadius: 14,
  },

  heroGlowLine: {
    height: 1,
    width: '100%',
    overflow: 'hidden',
    opacity: 0.75,
    marginBottom: 13,
  },

  heroMetricasRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroMetrica: {
    flex: 1,
  },

  metricDivider: {
    width: 1,
    height: 31,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 16,
  },

  metricaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  metricIconPositive: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: 'rgba(0,245,212,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  metricIconNegative: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: 'rgba(255,74,90,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  metricaRotulo: {
    color: '#6F7A8E',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.1,
  },

  metricaValor: {
    fontSize: 13,
    fontWeight: '800',
  },

  valorDespesa: {
    color: '#FF4A5A',
  },

  valorReceita: {
    color: '#00F5D4',
  },

  inputZone: {
    position: 'relative',
    marginBottom: 16,
  },

  inputRipple: {
    position: 'absolute',
    top: -3,
    left: -2,
    right: -2,
    bottom: -3,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#C084FC',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.8,
    shadowRadius: 18,
  },

  inputCapsula: {
    height: 57,
    borderRadius: 20,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'rgba(124,58,237,0.36)',
  },

  inputNeonBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.8,
  },

  inputIconeBox: {
    width: 35,
    height: 35,
    borderRadius: 13,
    marginLeft: 2,
    marginRight: 5,
    backgroundColor: 'rgba(124,58,237,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputTextWrap: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    position: 'relative',
  },

  dynamicPlaceholder: {
    position: 'absolute',
    left: 2,
    right: 0,
    color: '#626D80',
    fontSize: 12,
    fontWeight: '500',
  },

  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 0,
  },

  botaoEnviar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.58,
    shadowRadius: 14,
    elevation: 7,
  },

  botaoEnviarIdle: {
    opacity: 0.66,
  },

  botaoEnviarPressed: {
    transform: [{ scale: 0.91 }],
  },

  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
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
    shadowColor: '#00F5D4',
    shadowOpacity: 1,
    shadowRadius: 7,
  },

  subtitulo: {
    color: '#E9EDF5',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
  },

  sectionCaption: {
    color: '#4E596B',
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
    marginLeft: 12,
  },

  counterPill: {
    minWidth: 38,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
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

  filtersArea: {
    marginBottom: 10,
  },

  filterList: {
    gap: 7,
    paddingVertical: 2,
    paddingRight: 10,
  },

  chipFiltro: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(18,23,34,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.055)',
    overflow: 'visible',
  },

  chipFiltroAtivo: {
    backgroundColor: '#6D2ED4',
    borderColor: 'rgba(192,132,252,0.65)',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 4,
  },

  chipAura: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.18)',
  },

  chipPressed: {
    transform: [{ scale: 0.94 }],
  },

  textoChipFiltro: {
    color: '#778295',
    fontSize: 10,
    fontWeight: '700',
  },

  textoChipFiltroAtivo: {
    color: '#FFFFFF',
  },

  lista: {
    paddingTop: 1,
    paddingBottom: 25,
  },

  transactionOuter: {
    marginBottom: 7,
  },

  transactionPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },

  transactionCard: {
    minHeight: 65,
    borderRadius: 17,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  criticalRail: {
    position: 'absolute',
    left: 0,
    top: 11,
    bottom: 11,
    width: 2,
    borderRadius: 2,
    backgroundColor: '#FF4A5A',
    shadowColor: '#FF4A5A',
    shadowOpacity: 0.85,
    shadowRadius: 7,
  },

  cardIconeETextos: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  iconeBg: {
    width: 41,
    height: 41,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  cardTextos: {
    flex: 1,
    minWidth: 0,
  },

  descricao: {
    color: '#EEF2F7',
    fontSize: 12,
    fontWeight: '750',
    marginBottom: 5,
  },

  badgerow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },

  badge: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    color: '#737F91',
    fontSize: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 5,
    overflow: 'hidden',
  },

  badgeConta: {
    backgroundColor: 'rgba(124,58,237,0.11)',
    color: '#A98ADE',
    fontSize: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 5,
    fontWeight: '700',
    overflow: 'hidden',
  },

  valorEExcluirGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  valorContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },

  valor: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: -0.15,
  },

  alertDot: {
    marginTop: 5,
    width: 17,
    height: 17,
    borderRadius: 6,
    backgroundColor: 'rgba(255,74,90,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnTrashTransacao: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(255,74,90,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,74,90,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnTrashPressed: {
    transform: [{ scale: 0.88 }],
    backgroundColor: 'rgba(255,74,90,0.22)',
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
});