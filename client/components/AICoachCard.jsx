import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Sparkles,
  AlertTriangle,
  Target,
  Scale,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Dumbbell,
} from 'lucide-react-native';
import { fetchCoachInsights } from '../services/api';
import { useAppModeStore } from '../store/useAppModeStore';

export default function AICoachCard({ activeSplit = 'Push Day', refreshTrigger = 0 }) {
  const { mode } = useAppModeStore();
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadInsights = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchCoachInsights(activeSplit, mode);
      setInsights(data);
    } catch (err) {
      console.warn('Failed to load coach insights:', err);
      setError('Could not update AI coach data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [activeSplit, refreshTrigger, mode]);

  if (!insights && isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#38BDF8" />
          <Text style={styles.loadingText}>AI Coach analyzing your workout history...</Text>
        </View>
      </View>
    );
  }

  if (!insights) {
    return null;
  }

  const getStatusBadge = () => {
    switch (insights.status) {
      case 'plateau_warning':
        return { label: 'PLATEAU DETECTED', bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'volume_imbalance':
        return { label: 'VOLUME IMBALANCE', bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' };
      case 'getting_started':
        return { label: 'NEW ATHLETE', bg: 'rgba(56, 189, 248, 0.15)', text: '#38BDF8', border: 'rgba(56, 189, 248, 0.3)' };
      case 'optimal':
      default:
        return { label: 'OVERLOAD ON TRACK', bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' };
    }
  };

  const badge = getStatusBadge();
  const volume = insights.volumeBalance || { pushSets: 0, pullSets: 0, legsSets: 0, summary: '' };
  const plateaus = insights.plateauAlerts || [];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Sparkles size={16} color="#38BDF8" />
          </View>
          <View>
            <Text style={styles.titleLabel}>AI STRENGTH COACH</Text>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
              <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={loadInsights}
          style={styles.refreshBtn}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#38BDF8" />
          ) : (
            <RefreshCw size={14} color="#64748B" />
          )}
        </TouchableOpacity>
      </View>

      {/* Main Headline & Overview */}
      <Text style={styles.headlineText}>{insights.headline}</Text>
      <Text style={styles.overviewText}>{insights.overview}</Text>

      {/* Plateau Alert Box (When Lifts are Stalled) */}
      {plateaus.length > 0 && (
        <View style={styles.plateauContainer}>
          <View style={styles.plateauHeaderRow}>
            <AlertTriangle size={15} color="#EF4444" />
            <Text style={styles.plateauHeaderTitle}>Stagnation Alert & Micro-Load Advice</Text>
          </View>

          {plateaus.map((p, idx) => (
            <View key={idx} style={styles.plateauItem}>
              <View style={styles.plateauExerciseRow}>
                <Text style={styles.plateauExName}>{p.exerciseName}</Text>
                <Text style={styles.plateauMetric}>{p.currentMetric}</Text>
              </View>
              <Text style={styles.plateauObservation}>{p.observation}</Text>
              <View style={styles.prescriptionBox}>
                <Text style={styles.prescriptionLabel}>🎯 PRESCRIPTION:</Text>
                <Text style={styles.prescriptionText}>{p.prescription}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Muscle Volume Balance Bar */}
      {(volume.pushSets > 0 || volume.pullSets > 0 || volume.legsSets > 0) && (
        <View style={styles.volumeBox}>
          <View style={styles.volumeHeaderRow}>
            <Scale size={14} color="#38BDF8" />
            <Text style={styles.volumeHeaderTitle}>Volume Balance (Recent Sets)</Text>
          </View>

          <View style={styles.volumePillsRow}>
            <View style={styles.volumePill}>
              <Text style={styles.volumePillLabel}>PUSH</Text>
              <Text style={styles.volumePillValue}>{volume.pushSets} sets</Text>
            </View>
            <View style={styles.volumePill}>
              <Text style={styles.volumePillLabel}>PULL</Text>
              <Text style={styles.volumePillValue}>{volume.pullSets} sets</Text>
            </View>
            <View style={styles.volumePill}>
              <Text style={styles.volumePillLabel}>LEGS</Text>
              <Text style={styles.volumePillValue}>{volume.legsSets} sets</Text>
            </View>
          </View>

          {volume.summary ? (
            <Text style={styles.volumeSummaryText}>{volume.summary}</Text>
          ) : null}
        </View>
      )}

      {/* Today's Tactical Focus */}
      {insights.todayTarget && (
        <View style={styles.targetCard}>
          <View style={styles.targetHeader}>
            <Target size={14} color="#F59E0B" />
            <Text style={styles.targetHeaderTitle}>
              Today's Focus: {insights.todayTarget.splitFocus || activeSplit}
            </Text>
          </View>

          <View style={styles.targetContent}>
            {insights.todayTarget.keyExercise ? (
              <Text style={styles.targetKeyEx}>
                Key Lift: <Text style={styles.targetKeyExBold}>{insights.todayTarget.keyExercise}</Text>
              </Text>
            ) : null}
            <Text style={styles.targetActionText}>
              {insights.todayTarget.recommendedAction}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  refreshBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#162032',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222F43',
  },
  headlineText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 4,
  },
  overviewText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  plateauContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  plateauHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  plateauHeaderTitle: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  plateauItem: {
    marginTop: 4,
  },
  plateauExerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  plateauExName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  plateauMetric: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '600',
  },
  plateauObservation: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 6,
    lineHeight: 15,
  },
  prescriptionBox: {
    backgroundColor: '#162032',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  prescriptionLabel: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  prescriptionText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  volumeBox: {
    backgroundColor: '#162032',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  volumeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  volumeHeaderTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  volumePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  volumePill: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  volumePillLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
  },
  volumePillValue: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  volumeSummaryText: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
  },
  targetCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 12,
    padding: 12,
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  targetHeaderTitle: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  targetContent: {
    gap: 4,
  },
  targetKeyEx: {
    color: '#94A3B8',
    fontSize: 11,
  },
  targetKeyExBold: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  targetActionText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
