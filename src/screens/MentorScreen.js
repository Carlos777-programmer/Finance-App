import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'http://192.168.3.177:8000';

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

export default function MentorScreen() {
  const [diagnostico, setDiagnostico] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const scoreAnim = useRef(new Animated.Value(0)).current;

  const carregarMentor = useCallback(async () => {
    setCarregando(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/mentor-financeiro`);
      if (response.ok) {
        const data = await response.json();
        setDiagnostico(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do Mentor:', error);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarMentor();
    }, [carregarMentor])
  );

  useEffect(() => {
    if (diagnostico) {
      scoreAnim.setValue(0);
      Animated.spring(scoreAnim, {
        toValue: 1,
        friction: 7,
        tension: 30,
        useNativeDriver: true,
      }).start();
    }
  }, [diagnostico]);

  const getCorScore = (score) => {
    if (score >= 80) return '#00F5D4';
    if (score >= 50) return '#FFB800';
    return '#FF4A5A';
  };

  const getIconeInsight = (tipo) => {
    if (tipo === 'alerta') return { name: 'alert-triangle', color: '#FF4A5A' };
    if (tipo === 'atencao') return { name: 'alert-circle', color: '#FFB800' };
    return { name: 'award', color: '#00F5D4' };
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
                  <Feather name="shield" size={16} color="#E9FFFC" />
                </View>
              </LinearGradient>
            </View>

            <View>
              <Text style={styles.kicker}>FINANCE MATRIX</Text>
              <Text style={styles.tituloApp}>Mentor Financeiro</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.btnAtualizar}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              carregarMentor();
            }}
          >
            <LinearGradient colors={['#7C3AED', '#6D2ED4']} style={styles.btnGradient}>
              <Feather name="refresh-cw" size={13} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {carregando ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#C084FC" />
            <Text style={styles.loadingText}>O Mentor está analisando suas finanças...</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
            {/* CARD DE SCORE */}
            <Animated.View style={{ opacity: scoreAnim, transform: [{ scale: scoreAnim }] }}>
              <GlassSurface style={styles.scoreCard} intensity={34}>
                <Text style={styles.cardRotulo}>SCORE DE SAÚDE FINANCEIRA</Text>

                <View style={styles.scoreDisplayRow}>
                  <Text style={[styles.scoreNumero, { color: getCorScore(diagnostico?.score_saude) }]}>
                    {diagnostico?.score_saude ?? 0}
                  </Text>
                  <Text style={styles.scoreMax}>/100</Text>
                </View>

                <Text style={styles.resumoStatus}>{diagnostico?.resumo_status}</Text>
              </GlassSurface>
            </Animated.View>

            {/* SEÇÃO DE INSIGHTS E DICAS */}
            <View style={styles.secaoHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionPulse} />
                <Text style={styles.subtitulo}>INSIGHTS & ORIENTAÇÕES</Text>
              </View>
            </View>

            {diagnostico?.insights?.map((item, index) => {
              const iconObj = getIconeInsight(item.tipo);
              return (
                <Pressable
                  key={index}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  style={styles.insightOuter}
                >
                  <GlassSurface style={styles.insightCard} intensity={18}>
                    <View style={styles.insightHeader}>
                      <View style={[styles.insightIconeBg, { backgroundColor: `${iconObj.color}15` }]}>
                        <Feather name={iconObj.name} size={16} color={iconObj.color} />
                      </View>
                      <Text style={styles.insightTitulo}>{item.titulo}</Text>
                    </View>
                    <Text style={styles.insightMensagem}>{item.mensagem}</Text>
                  </GlassSurface>
                </Pressable>
              );
            })}

            {/* PLANO DE AÇÃO */}
            {!!diagnostico?.plano_acao && (
              <GlassSurface style={styles.planoCard} intensity={25}>
                <View style={styles.planoHeader}>
                  <Feather name="compass" size={16} color="#00F5D4" />
                  <Text style={styles.planoTitulo}>PLANO DE AÇÃO IMEDIATO</Text>
                </View>
                <Text style={styles.planoTexto}>{diagnostico.plano_acao}</Text>
              </GlassSurface>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05070A' },
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },
  ambientTop: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    top: -100, right: -60, backgroundColor: 'rgba(124,58,237,0.08)',
  },
  ambientBottom: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    bottom: -150, left: -100, backgroundColor: 'rgba(0,245,212,0.045)',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center' },
  avatarRing: {
    width: 42, height: 42, borderRadius: 21, padding: 2, marginRight: 10,
  },
  avatarGradient: { flex: 1, borderRadius: 20, padding: 2 },
  avatarInner: {
    flex: 1, borderRadius: 18, backgroundColor: '#0B1018',
    justifyContent: 'center', alignItems: 'center',
  },
  kicker: { color: '#69758A', fontSize: 8, fontWeight: '800', letterSpacing: 1.8, marginBottom: 2 },
  tituloApp: { color: '#F6F8FC', fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  btnAtualizar: { borderRadius: 12, overflow: 'hidden' },
  btnGradient: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  glassShell: {
    position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(13,17,27,0.85)',
    borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  glassHighlight: {
    position: 'absolute', top: 0, left: 18, right: 18, height: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#7F8A9D', fontSize: 12, marginTop: 12 },
  scoreCard: { padding: 20, alignItems: 'center', marginBottom: 18 },
  cardRotulo: { color: '#7F8A9D', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  scoreDisplayRow: { flexDirection: 'row', alignItems: 'baseline' },
  scoreNumero: { fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  scoreMax: { color: '#6F7A8E', fontSize: 16, fontWeight: '700', marginLeft: 4 },
  resumoStatus: { color: '#E2E8F0', fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 10 },
  secaoHeader: { marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionPulse: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#00F5D4', marginRight: 7 },
  subtitulo: { color: '#E9EDF5', fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  insightOuter: { marginBottom: 10 },
  insightCard: { padding: 14 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  insightIconeBg: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  insightTitulo: { color: '#F1F5F9', fontSize: 13, fontWeight: '750', flex: 1 },
  insightMensagem: { color: '#94A3B8', fontSize: 11, lineHeight: 16, marginTop: 2 },
  planoCard: { padding: 16, marginTop: 6 },
  planoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  planoTitulo: { color: '#00F5D4', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  planoTexto: { color: '#CBD5E1', fontSize: 11, lineHeight: 17 },
});