import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Check,
  Plus,
  Trash2,
  Dumbbell,
  Pencil,
  GripVertical,
  ChevronUp,
  ChevronDown,
  MoreVertical,
} from 'lucide-react-native';
import { useWorkoutStore } from '../store/useWorkoutStore';

const TYPE_CONFIG = {
  regular: { label: 'R', bg: '#334155', text: '#F8FAFC', name: 'Regular' },
  warmup: { label: 'W', bg: '#F59E0B', text: '#0B0F17', name: 'Warmup' },
  drop: { label: 'D', bg: '#8B5CF6', text: '#FFFFFF', name: 'Drop Set' },
  failure: { label: 'F', bg: '#EF4444', text: '#FFFFFF', name: 'Failure' },
};

export default function ExerciseTrackerCard({
  exercise,
  exerciseIndex,
  totalExercises = 1,
  onEdit,
}) {
  const {
    cycleSetType,
    updateSetField,
    copyLastSet,
    removeSet,
    toggleCompleteSet,
    removeExercise,
    moveExerciseUp,
    moveExerciseDown,
    reorderExercise,
  } = useWorkoutStore();

  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <View
      style={[
        styles.card,
        isDragOver && styles.cardDragOver,
      ]}
      {...(Platform.OS === 'web'
        ? {
            onDragOver: (e) => {
              e.preventDefault();
              if (!isDragOver) setIsDragOver(true);
            },
            onDragLeave: () => {
              setIsDragOver(false);
            },
            onDrop: (e) => {
              e.preventDefault();
              setIsDragOver(false);
              const fromIndex = Number(e.dataTransfer.getData('text/plain'));
              if (!isNaN(fromIndex) && fromIndex !== exerciseIndex) {
                reorderExercise(fromIndex, exerciseIndex);
              }
            },
          }
        : {})}
    >
      {/* Exercise Card Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {Platform.OS === 'web' && totalExercises > 1 ? (
            <View
              // @ts-ignore
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(exerciseIndex));
                e.dataTransfer.effectAllowed = 'move';
              }}
              style={styles.dragGrip}
              accessibilityLabel="Drag to reorder exercise"
            >
              <GripVertical size={16} color="#64748B" />
            </View>
          ) : null}

          <View style={styles.iconCircle}>
            <Dumbbell size={16} color="#38BDF8" />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.exerciseName} numberOfLines={1}>
              {exercise.name}
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.muscleBadge}>
                <Text style={styles.muscleBadgeText}>{exercise.muscleGroup || 'Full Body'}</Text>
              </View>
              {exercise.isCompound && (
                <View style={styles.compoundBadge}>
                  <Text style={styles.compoundBadgeText}>Compound</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {totalExercises > 1 && (
            <View style={styles.arrowGroup}>
              <TouchableOpacity
                onPress={() => moveExerciseUp(exerciseIndex)}
                disabled={exerciseIndex === 0}
                style={[styles.arrowBtn, exerciseIndex === 0 && styles.arrowBtnDisabled]}
                accessibilityLabel="Move exercise up"
                activeOpacity={0.7}
              >
                <ChevronUp size={15} color={exerciseIndex === 0 ? '#334155' : '#94A3B8'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => moveExerciseDown(exerciseIndex)}
                disabled={exerciseIndex === totalExercises - 1}
                style={[
                  styles.arrowBtn,
                  exerciseIndex === totalExercises - 1 && styles.arrowBtnDisabled,
                ]}
                accessibilityLabel="Move exercise down"
                activeOpacity={0.7}
              >
                <ChevronDown
                  size={15}
                  color={exerciseIndex === totalExercises - 1 ? '#334155' : '#94A3B8'}
                />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={() => onEdit?.(exerciseIndex)}
            style={styles.editExBtn}
            accessibilityLabel="Edit exercise"
            activeOpacity={0.7}
          >
            <Pencil size={15} color="#38BDF8" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => removeExercise(exerciseIndex)}
            style={styles.deleteExBtn}
            accessibilityLabel="Remove exercise"
            activeOpacity={0.7}
          >
            <Trash2 size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Column Headers */}
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.columnLabel, styles.colSet]}>SET</Text>
        <Text style={[styles.columnLabel, styles.colType]}>TYPE</Text>
        <Text style={[styles.columnLabel, styles.colPrev]}>PREVIOUS</Text>
        <Text style={[styles.columnLabel, styles.colInput]}>KG</Text>
        <Text style={[styles.columnLabel, styles.colInput]}>REPS</Text>
        <Text style={[styles.columnLabel, styles.colDone]}>DONE</Text>
      </View>

      {/* Sets Rows */}
      {exercise.sets.map((set, setIndex) => {
        const typeInfo = TYPE_CONFIG[set.type] || TYPE_CONFIG.regular;
        const prevText =
          set.previousWeight || set.previousReps
            ? `${set.previousWeight || 0}kg × ${set.previousReps || 0}`
            : '—';

        return (
          <View
            key={setIndex}
            style={[
              styles.setRow,
              set.isCompleted && styles.completedSetRow,
            ]}
          >
            {/* Set Number */}
            <View style={styles.colSet}>
              <Text style={styles.setNumberText}>{set.setNumber}</Text>
            </View>

            {/* Set Type Badge */}
            <View style={styles.colType}>
              <TouchableOpacity
                onPress={() => cycleSetType(exerciseIndex, setIndex)}
                style={[styles.typeBadge, { backgroundColor: typeInfo.bg }]}
                accessibilityLabel={`Set type: ${typeInfo.name}. Tap to cycle.`}
              >
                <Text style={[styles.typeBadgeText, { color: typeInfo.text }]}>
                  {typeInfo.label}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Previous Ghost Performance */}
            <View style={styles.colPrev}>
              <Text style={styles.prevText} numberOfLines={1}>
                {prevText}
              </Text>
            </View>

            {/* Weight Input (Kg) */}
            <View style={styles.colInput}>
              <TextInput
                style={[
                  styles.input,
                  set.isCompleted && styles.inputCompleted,
                ]}
                keyboardType="numeric"
                value={set.weight !== undefined && set.weight !== null ? String(set.weight) : ''}
                placeholder={set.previousWeight ? String(set.previousWeight) : '0'}
                placeholderTextColor="#475569"
                onChangeText={(val) => updateSetField(exerciseIndex, setIndex, 'weight', val)}
                editable={!set.isCompleted}
                selectTextOnFocus
              />
            </View>

            {/* Reps Input */}
            <View style={styles.colInput}>
              <TextInput
                style={[
                  styles.input,
                  set.isCompleted && styles.inputCompleted,
                ]}
                keyboardType="numeric"
                value={set.reps !== undefined && set.reps !== null ? String(set.reps) : ''}
                placeholder={set.previousReps ? String(set.previousReps) : '10'}
                placeholderTextColor="#475569"
                onChangeText={(val) => updateSetField(exerciseIndex, setIndex, 'reps', val)}
                editable={!set.isCompleted}
                selectTextOnFocus
              />
            </View>

            {/* Completion Checkmark */}
            <View style={styles.colDone}>
              <TouchableOpacity
                onPress={() => toggleCompleteSet(exerciseIndex, setIndex)}
                style={[
                  styles.checkButton,
                  set.isCompleted ? styles.checkButtonActive : styles.checkButtonInactive,
                ]}
                activeOpacity={0.7}
              >
                <Check
                  size={16}
                  color={set.isCompleted ? '#0B0F17' : '#475569'}
                  strokeWidth={3}
                />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* Card Actions: + Copy / Add Set & Set controls */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          onPress={() => copyLastSet(exerciseIndex)}
          style={styles.addSetButton}
          activeOpacity={0.7}
        >
          <Plus size={14} color="#38BDF8" />
          <Text style={styles.addSetButtonText}>Add / Copy Set</Text>
        </TouchableOpacity>

        {exercise.sets.length > 1 && (
          <TouchableOpacity
            onPress={() => removeSet(exerciseIndex, exercise.sets.length - 1)}
            style={styles.removeSetButton}
            activeOpacity={0.7}
          >
            <Text style={styles.removeSetButtonText}>Delete Last Set</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#151D2A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222F43',
    padding: 14,
    marginBottom: 14,
  },
  cardDragOver: {
    borderColor: '#38BDF8',
    backgroundColor: '#1E293B',
    transform: [{ scale: 1.01 }],
  },
  dragGrip: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    cursor: 'grab',
    marginRight: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222F43',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#222F43',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  muscleBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  muscleBadgeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compoundBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  compoundBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowGroup: {
    flexDirection: 'row',
    backgroundColor: '#0B0F17',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#222F43',
    marginRight: 4,
  },
  arrowBtn: {
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  arrowBtnDisabled: {
    opacity: 0.4,
  },
  editExBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  deleteExBtn: {
    padding: 6,
    borderRadius: 6,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 47, 67, 0.5)',
  },
  columnLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  colSet: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colType: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colPrev: {
    flex: 1.2,
    paddingHorizontal: 4,
  },
  colInput: {
    flex: 1,
    paddingHorizontal: 4,
  },
  colDone: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    marginVertical: 2,
  },
  completedSetRow: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  setNumberText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  typeBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  prevText: {
    color: '#64748B',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  input: {
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 6,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: Platform.OS === 'ios' ? 6 : 4,
    paddingHorizontal: 4,
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputCompleted: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    color: '#10B981',
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonInactive: {
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#222F43',
  },
  checkButtonActive: {
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 47, 67, 0.4)',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    gap: 6,
  },
  addSetButtonText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  removeSetButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  removeSetButtonText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
});
