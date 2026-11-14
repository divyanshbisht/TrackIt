import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import {
  Calendar,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Trash2,
  Flame,
  CheckCircle2,
} from 'lucide-react-native';

const SET_BADGES = {
  regular: { label: 'R', color: '#94A3B8' },
  warmup: { label: 'W', color: '#F59E0B' },
  drop: { label: 'D', color: '#A78BFA' },
  failure: { label: 'F', color: '#EF4444' },
};

export default function WorkoutHistoryCard({ workout, onRepeat, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = (() => {
    try {
      const d = new Date(workout.date || workout.createdAt);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      if (isToday) return `Today, ${timeStr}`;
      if (isYesterday) return `Yesterday, ${timeStr}`;
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
    } catch (e) {
      return 'Recent';
    }
  })();

  const durationMin = Math.round((workout.durationSeconds || 0) / 60);

  const exercises = workout.exercises || [];
  const totalCompletedSets = exercises.reduce((acc, ex) => {
    return acc + (ex.sets || []).filter((s) => s.isCompleted).length;
  }, 0);

  // Calculate total session volume (kg lifted)
  const totalVolume = exercises.reduce((acc, ex) => {
    return (
      acc +
      (ex.sets || []).reduce((sAcc, s) => {
        if (!s.isCompleted) return sAcc;
        return sAcc + (Number(s.weight) || 0) * (Number(s.reps) || 0);
      }, 0)
    );
  }, 0);

  const handleDelete = () => {
    const workoutId = workout._id || workout.id;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm('Delete this workout from history?')) {
          onDelete(workoutId);
        }
      } else {
        onDelete(workoutId);
      }
    } else {
      Alert.alert('Delete Workout', 'Remove this workout record from your history?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(workoutId) },
      ]);
    }
  };

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.splitBadge}>
            <Text style={styles.splitBadgeText}>{workout.splitName || 'Workout Session'}</Text>
          </View>
          <View style={styles.dateRow}>
            <Calendar size={12} color="#64748B" />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {durationMin > 0 && (
            <View style={styles.durationBadge}>
              <Clock size={12} color="#94A3B8" />
              <Text style={styles.durationText}>{durationMin}m</Text>
            </View>
          )}

          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} activeOpacity={0.7}>
            <Trash2 size={15} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Summary Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{exercises.length}</Text>
          <Text style={styles.statLabel}>EXERCISES</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalCompletedSets}</Text>
          <Text style={styles.statLabel}>SETS LOGGED</Text>
        </View>
        {totalVolume > 0 && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(totalVolume)}</Text>
              <Text style={styles.statLabel}>TOTAL KG</Text>
            </View>
          </>
        )}
      </View>

      {/* Exercises Breakdown */}
      <View style={styles.exercisesList}>
        {exercises.map((ex, exIdx) => {
          const completedSets = (ex.sets || []).filter((s) => s.isCompleted);
          const setsToShow = isExpanded ? ex.sets || [] : completedSets.slice(0, 3);

          return (
            <View key={ex.exerciseId || exIdx} style={styles.exerciseItem}>
              <View style={styles.exTopRow}>
                <View style={styles.exTitleRow}>
                  <Dumbbell size={14} color="#38BDF8" />
                  <Text style={styles.exerciseName} numberOfLines={1}>
                    {ex.name}
                  </Text>
                </View>
                <Text style={styles.exSetCount}>
                  {completedSets.length} {completedSets.length === 1 ? 'set' : 'sets'}
                </Text>
              </View>

              {/* Set chips list */}
              <View style={styles.setsChipsRow}>
                {setsToShow.map((s, sIdx) => {
                  const badge = SET_BADGES[s.type] || SET_BADGES.regular;
                  return (
                    <View
                      key={sIdx}
                      style={[
                        styles.setChip,
                        s.isCompleted ? styles.setChipDone : styles.setChipSkipped,
                      ]}
                    >
                      <Text style={[styles.setChipType, { color: badge.color }]}>{badge.label}</Text>
                      <Text style={styles.setChipWeight}>{s.weight || 0}kg</Text>
                      <Text style={styles.setChipReps}>× {s.reps || 0}</Text>
                    </View>
                  );
                })}
                {!isExpanded && (ex.sets || []).length > 3 && (
                  <Text style={styles.moreSetsText}>+{(ex.sets || []).length - 3} more</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Footer Controls */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.expandToggle}
          activeOpacity={0.7}
        >
          <Text style={styles.expandToggleText}>
            {isExpanded ? 'Hide Details' : 'Show All Sets & Reps'}
          </Text>
          {isExpanded ? (
            <ChevronUp size={14} color="#94A3B8" />
          ) : (
            <ChevronDown size={14} color="#94A3B8" />
          )}
        </TouchableOpacity>

        {/* 1-Click Repeat Button */}
        <TouchableOpacity
          onPress={() => onRepeat(workout)}
          style={styles.repeatBtn}
          activeOpacity={0.85}
        >
          <RotateCcw size={14} color="#0B0F17" strokeWidth={2.5} />
          <Text style={styles.repeatBtnText}>Repeat Workout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    gap: 6,
  },
  splitBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  splitBadgeText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  durationText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 6,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#162032',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 14,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#222F43',
  },
  exercisesList: {
    gap: 10,
  },
  exerciseItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B44',
    paddingBottom: 8,
  },
  exTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  exTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  exerciseName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  exSetCount: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  setsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  setChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162032',
    borderWidth: 1,
    borderColor: '#222F43',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  setChipDone: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  setChipSkipped: {
    opacity: 0.6,
  },
  setChipType: {
    fontSize: 10,
    fontWeight: '700',
  },
  setChipWeight: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  setChipReps: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  moreSetsText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  expandToggleText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  repeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  repeatBtnText: {
    color: '#0B0F17',
    fontSize: 12,
    fontWeight: '700',
  },
});

