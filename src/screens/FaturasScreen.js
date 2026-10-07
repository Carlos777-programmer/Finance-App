import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Animated,
  StatusBar,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const BANCOS_SUPORTADOS = [
  { nome: 'Nubank', icon: 'credit-card-outline', color: '#8A05BE' },
  { nome: 'Itaú', icon: 'bank', color: '#EC7000' },
  { nome: 'Inter', icon: 'lightning-bolt-outline', color: '#FF7A00' },
  { nome: 'Bradesco', icon: 'bank', color: '#CC092F' },
  { nome: 'Santander', icon: 'bank', color: '#EC0000' },
  { nome: 'Outros CSV', icon: 'file-document-outline', color: '#00F5D4' },
];

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

export default function FaturasScreen() {
  const [ficheiro, setFicheiro] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const cardAnim = useRef(new Animated.Value(0)).current;
  const pulseGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseGlow, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseGlow, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleSelecionarCSV = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setFicheiro(file);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Não foi possível selecionar o arquivo CSV.');
    }
  };

  const handleRemoverFicheiro = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFicheiro(null);
  };

  const handleProcessarFatura = async () => {
    if (!ficheiro) return;

    setCarregando(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Simulação de processamento/upload para a API
      await new Promise((resolve) => setTimeout(resolve, 1800));

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Fatura Processada!',
        `O arquivo "${ficheiro.name}" foi lido e as transações foram importadas com sucesso.`,
        [{ text: 'OK', onPress: () => setFicheiro(null) }]
      );
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Falha ao processar o arquivo no servidor.');
    } finally {
      setCarregando(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Tamanho desconhecido';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
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
                  <Feather name="file-text" size={16} color="#E9FFFC" />
                </View>
              </LinearGradient>
            </View>

            <View>
              <Text style={styles.kicker}>FINANCE MATRIX</Text>
              <Text style={styles.tituloApp}>Importar Faturas</Text>
            </View>
          </View>

          <View style={styles.aiBadgeWrap}>
            <View style={styles.aiBadge}>
              <View style={styles.aiDot} />
              <Text style={styles.statusIaTexto}>PARSER CSV</Text>
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          {/* HERO CARD / UPLOAD ZONE */}
          <Animated.View
            style={{
              opacity: cardAnim,
              transform: [
                {
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <GlassSurface style={styles.heroCard} intensity={34}>
              {!ficheiro ? (
                <View style={styles.uploadBoxInner}>
                  <Animated.View
                    style={[
                      styles.iconCircleOuter,
                      {
                        opacity: pulseGlow.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 1],
                        }),
                        transform: [
                          {
                            scale: pulseGlow.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.96, 1.04],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.iconCircle}>
                      <Feather name="upload-cloud" size={28} color="#C084FC" />
                    </View>
                  </Animated.View>

                  <Text style={styles.heroTitle}>Importação por CSV</Text>
                  <Text style={styles.heroSubtext}>
                    Carregue o extrato bancário ou fatura em formato .CSV para categorização e vinculação de despesas.
                  </Text>

                  <Pressable
                    onPress={handleSelecionarCSV}
                    style={({ pressed }) => [
                      styles.btnUpload,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <LinearGradient
                      colors={['#7C3AED', '#6D2ED4']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.btnUploadGradient}
                    >
                      <Feather name="file-plus" size={16} color="#FFFFFF" />
                      <Text style={styles.btnUploadTexto}>Selecionar Arquivo CSV</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.fileSelectedBox}>
                  <View style={styles.fileHeaderRow}>
                    <View style={styles.fileIconBox}>
                      <Feather name="file-check" size={24} color="#00F5D4" />
                    </View>

                    <View style={styles.fileTextWrap}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {ficheiro.name}
                      </Text>
                      <Text style={styles.fileSub}>
                        {formatFileSize(ficheiro.size)} • Pronto para leitura
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={handleRemoverFicheiro}
                      style={styles.btnRemoveFile}
                      hitSlop={8}
                    >
                      <Feather name="x" size={16} color="#FF4A5A" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.heroGlowLine}>
                    <LinearGradient
                      colors={['transparent', '#00F5D4', '#7C3AED', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>

                  <View style={styles.fileActionRow}>
                    <TouchableOpacity
                      style={styles.btnTrocar}
                      onPress={handleSelecionarCSV}
                      disabled={carregando}
                    >
                      <Text style={styles.btnTrocarTexto}>Trocar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnProcessar}
                      onPress={handleProcessarFatura}
                      disabled={carregando}
                    >
                      <LinearGradient
                        colors={['#00F5D4', '#10B981']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.btnProcessarGradient}
                      >
                        {carregando ? (
                          <ActivityIndicator color="#05070A" size="small" />
                        ) : (
                          <>
                            <Feather name="cpu" size={15} color="#05070A" />
                            <Text style={styles.btnProcessarTexto}>Processar Fatura</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </GlassSurface>
          </Animated.View>

          {/* DICAS DE FORMATO */}
          <GlassSurface style={styles.infoCard} intensity={20}>
            <View style={styles.infoRow}>
              <Feather name="info" size={16} color="#00F5D4" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Como exportar do seu banco?</Text>
                <Text style={styles.infoBody}>
                  Acesse o app do seu banco, vá em "Fatura" ou "Extrato", escolha a opção "Exportar" e selecione a extensão .CSV.
                </Text>
              </View>
            </View>
          </GlassSurface>

          {/* BANCOS SUPORTADOS */}
          <View style={styles.secaoHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionPulse} />
              <Text style={styles.subtitulo}>INSTITUIÇÕES RECONHECIDAS</Text>
            </View>
          </View>

          <View style={styles.bancosGrid}>
            {BANCOS_SUPORTADOS.map((item, index) => (
              <GlassSurface key={index} style={styles.bancoTag} intensity={18}>
                <View style={[styles.bancoDot, { backgroundColor: item.color }]} />
                <MaterialCommunityIcons name={item.icon} size={15} color={item.color} />
                <Text style={styles.bancoTagTexto}>{item.nome}</Text>
              </GlassSurface>
            ))}
          </View>
        </ScrollView>
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
    marginBottom: 16,
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
    minWidth: 90,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.32)',
    backgroundColor: 'rgba(38,24,65,0.70)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00F5D4',
    marginRight: 6,
  },

  statusIaTexto: {
    color: '#C084FC',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
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
    padding: 22,
    marginBottom: 14,
  },

  uploadBoxInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconCircleOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(124,58,237,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.22)',
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(124,58,237,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },

  heroSubtext: {
    color: '#7F8A9D',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 20,
    paddingHorizontal: 10,
  },

  btnUpload: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },

  btnUploadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 8,
  },

  btnUploadTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  fileSelectedBox: {
    width: '100%',
  },

  fileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,245,212,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,245,212,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  fileTextWrap: {
    flex: 1,
  },

  fileName: {
    color: '#EEF2F7',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },

  fileSub: {
    color: '#6F7A8E',
    fontSize: 10,
    fontWeight: '500',
  },

  btnRemoveFile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,74,90,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,74,90,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  heroGlowLine: {
    height: 1,
    width: '100%',
    overflow: 'hidden',
    opacity: 0.75,
    marginVertical: 16,
  },

  fileActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  btnTrocar: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  btnTrocarTexto: {
    color: '#7F8A9D',
    fontSize: 12,
    fontWeight: '700',
  },

  btnProcessar: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },

  btnProcessarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },

  btnProcessarTexto: {
    color: '#05070A',
    fontSize: 12,
    fontWeight: '900',
  },

  infoCard: {
    padding: 14,
    marginBottom: 18,
  },

  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },

  infoTitle: {
    color: '#E9EDF5',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
  },

  infoBody: {
    color: '#7F8A9D',
    fontSize: 10,
    lineHeight: 15,
  },

  secaoHeader: {
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

  bancosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  bancoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },

  bancoDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  bancoTagTexto: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
});