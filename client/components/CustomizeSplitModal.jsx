import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Dumbbell, Plus, Trash2, X, Check, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react-native';
import ExerciseSearchModal from './ExerciseSearchModal';

export default function CustomizeSplitModal({
  visible,
  splitName,
  initialExercises = [],
  onClose,
  onSave,
}) {
  const [exercises, setExercises] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setExercises(
        (initialExercises || []).map((ex) => ({
          exerciseId: ex.exerciseId || ex.id,
          name: ex.name,
          muscleGroup: ex.muscleGroup || 'Full Body',
          isCompound: ex.isCompound || false,
          defaultSets: ex.defaultSets || 3,
          defaultReps: ex.defaultReps || 10,
        }))
      );
    }
  }, [visible, initialExercises]);

  if (!visible) return null;

  const handleAddExercise = (selected) => {
    const newEx = {
      exerciseId: selected.id || selected.exerciseId,
      name: selected.name,
      muscleGroup: selected.muscleGroup || 'Full Body',
      isCompound: selected.isCompound || false,
      defaultSets: 3,
      defaultReps: 10,
    };
    setExercises((prev) => [...prev, newEx]);
    setIsSearchOpen(false);
  };

  const handleRemoveExercise = (index) => {
    setExercises((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveExercise = (fromIdx, toIdx) => {
    if (fromIdx < 0 || fromIdx >= exercises.length || toIdx < 0 || toIdx >= exercises.length) return;
    setExercises((prev) => {
      const updated = [...prev];
      const [item] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, item);
      return updated;
    });
  };

  const handleAdjustSets = (index, delta) => {
    setExercises((prev) => {
      const updated = [...prev];
      const current = updated[index].defaultSets || 3;
      const next = Math.max(1, Math.min(10, current + delta));
      updated[index] = { ...updated[index], defaultSets: next };
      return updated;
    });
  };

  const handleSave = () => {
    onSave(splitName, exercises);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconBox}>
                <Dumbbell size={18} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.title}>Customize Split</Text>
                <Text style={styles.subtitle}>{splitName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHelp}>
              Configure the default exercises that load automatically when you start this split.
            </Text>

            {exercises.length > 0 ? (
              exercises.map((ex, idx) => (
                <View key={`${ex.exerciseId}-${idx}`} style={styles.exCard}>
                  <View style={styles.exInfo}>
                    <Text style={styles.exName} numberOfLines={1}>
                      {ex.name}
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{ex.muscleGroup}</Text>
                      </View>
                      {ex.isCompound && (
                        <View style={styles.compoundBadge}>
                          <Text style={styles.compoundText}>Compound</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.setsControl}>
                    <TouchableOpacity
                      onPress={() => handleAdjustSets(idx, -1)}
                      style={styles.adjustBtn}
                    >
                      <Text style={styles.adjustBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.setsText}>{ex.defaultSets} sets</Text>
                    <TouchableOpacity
                      onPress={() => handleAdjustSets(idx, 1)}
                      style={styles.adjustBtn}
                    >
                      <Text style={styles.adjustBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {exercises.length > 1 && (
                    <View style={styles.arrowGroup}>
                      <TouchableOpacity
                        onPress={() => handleMoveExercise(idx, idx - 1)}
                        disabled={idx === 0}
                        style={[styles.arrowBtn, idx === 0 && styles.arrowBtnDisabled]}
                        activeOpacity={0.7}
                      >
                        <ChevronUp size={14} color={idx === 0 ? '#334155' : '#94A3B8'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleMoveExercise(idx, idx + 1)}
                        disabled={idx === exercises.length - 1}
                        style={[
                          styles.arrowBtn,
                          idx === exercises.length - 1 && styles.arrowBtnDisabled,
                        ]}
                        activeOpacity={0.7}
                      >
                        <ChevronDown
                          size={14}
                          color={idx === exercises.length - 1 ? '#334155' : '#94A3B8'}
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => handleRemoveExercise(idx)}
                    style={styles.trashBtn}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No exercises in this split yet.</Text>
                <Text style={styles.emptySub}>Tap below to add movements.</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setIsSearchOpen(true)}
              style={styles.addBtn}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#38BDF8" />
              <Text style={styles.addBtnText}>+ Add Exercise to Split</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.85}>
              <Check size={18} color="#0B0F17" strokeWidth={2.5} />
              <Text style={styles.saveBtnText}>Save Routine</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ExerciseSearchModal
        visible={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectExercise={handleAddExercise}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0369A122',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHelp: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 16,
  },
  exCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162032',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  exInfo: {
    flex: 1,
  },
  exName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  badge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  compoundBadge: {
    backgroundColor: '#0284C722',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compoundText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '600',
  },
  setsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F17',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#222F43',
    paddingHorizontal: 4,
  },
  adjustBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  adjustBtnText: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '700',
  },
  setsText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  trashBtn: {
    padding: 6,
  },
  arrowGroup: {
    flexDirection: 'row',
    backgroundColor: '#0B0F17',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#222F43',
  },
  arrowBtn: {
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  arrowBtnDisabled: {
    opacity: 0.3,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#38BDF844',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 16,
    gap: 6,
  },
  addBtnText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    gap: 6,
  },
  saveBtnText: {
    color: '#0B0F17',
    fontSize: 14,
    fontWeight: '700',
  },
});

