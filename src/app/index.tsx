import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';

const { height } = Dimensions.get('window');

export default function GatewayScreen() {
  const router = useRouter();
  const { sysConfig } = useAppContext();

  // Animation values
  const logoScale = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withSpring(1);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }]
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.header, logoStyle]}>
          <Animated.View
            entering={FadeInUp.duration(800)}
            style={styles.iconContainer}
          >
            <BookOpen size={32} color="#fff" />
          </Animated.View>
          <Animated.Text
            entering={FadeInDown.delay(200).duration(800)}
            style={styles.title}
          >
            {sysConfig.textCustoms['lbl-gate-title']}
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(400).duration(800)}
            style={styles.subtitle}
          >
            {sysConfig.textCustoms['lbl-gate-subtitle']}
          </Animated.Text>
        </Animated.View>

        <View style={styles.buttonGrid}>
          <Animated.View entering={FadeInDown.delay(600).springify()}>
            <TouchableOpacity
              style={[styles.card, styles.studentCard]}
              onPress={() => router.push('/kiosk')}
              activeOpacity={0.7}
            >
              <Text style={styles.cardEmoji}>🎓</Text>
              <Text style={styles.cardTitle}>{sysConfig.textCustoms['lbl-gate-student-card-title']}</Text>
              <Text style={styles.cardText}>Log daily lecture attendance terminal securely.</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(800).springify()}>
            <TouchableOpacity
              style={[styles.card, styles.adminCard]}
              onPress={() => router.push('/admin-auth')}
              activeOpacity={0.7}
            >
              <View style={styles.adminIconWrapper}>
                <Text style={styles.cardEmoji}>🛡️</Text>
              </View>
              <Text style={styles.cardTitle}>{sysConfig.textCustoms['lbl-gate-admin-card-title']}</Text>
              <Text style={styles.cardText}>Access registries, configure parameters, and extract logs.</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      <Animated.View
        entering={FadeInUp.delay(1000).duration(1000)}
        style={styles.footer}
      >
        <Text style={styles.footerText}>Rhema Class Registry System v10.0</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: height * 0.12, // Brought down from the top
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  iconContainer: {
    width: 72,
    height: 72,
    backgroundColor: Colors.primary,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
    fontWeight: '500',
  },
  buttonGrid: {
    width: '100%',
    gap: 20,
  },
  card: {
    backgroundColor: Colors.white,
    padding: 30,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  studentCard: {
    backgroundColor: '#fff',
  },
  adminCard: {
    backgroundColor: '#fff',
  },
  cardEmoji: {
    fontSize: 42,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: Spacing.xs,
  },
  cardText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
  adminIconWrapper: {
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  }
});
