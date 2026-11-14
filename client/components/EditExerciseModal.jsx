import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
  Platform,
} from 'react-native';
import { Pencil, X, Search, Check, Dumbbell } from 'lucide-react-native';

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core', 'Full Body'];

export default function EditExerciseModal({
  visible,
  exercise,
  onClose,
  onSave,
  onOpenLibraryReplace,
}) {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('Full Body');
  const [isCompound, setIsCompound] = useState(false);

  useEffect(() => {
    if (exercise) {
      setName(exercise.name || '');
      setMuscleGroup(exercise.muscleGroup || 'Full Body');
      setIsCompound(Boolean(exercise.isCompound));
    }
  }, [exercise, visible]);

  if (!visible || !exercise) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      muscleGroup,
      isCompound,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconBox}>
                <Pencil size={18} color="#38BDF8" />
              </View>
              <Text style={styles.title}>Edit Exercise</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Quick Replace Button */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                onOpenLibraryReplace();
              }}
              style={styles.replaceBtn}
              activeOpacity={0.8}
            >
              <Search size={16} color="#38BDF8" />
              <View style={styles.replaceBtnContent}>
                <Text style={styles.replaceBtnTitle}>Swap with Library Exercise</Text>
                <Text style={styles.replaceBtnSub}>Search across 800+ built-in exercises</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR EDIT DETAILS</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Exercise Name Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EXERCISE NAME</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Dumbbell Shoulder Press"
                placeholderTextColor="#64748B"
                autoCapitalize="words"
              />
            </View>

            {/* Muscle Group Chips */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>MUSCLE GROUP</Text>
              <View style={styles.chipsContainer}>
                {MUSCLE_GROUPS.map((mg) => {
                  const isSelected = muscleGroup.toLowerCase() === mg.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={mg}
                      onPress={() => setMuscleGroup(mg)}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {mg}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Compound Movement Toggle */}
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Compound Movement</Text>
                <Text style={styles.switchSub}>Multi-joint heavy exercise (e.g. presses, squats)</Text>
              </View>
              <Switch
                value={isCompound}
                onValueChange={setIsCompound}
                trackColor={{ false: '#1E293B', true: '#0284C7' }}
                thumbColor={isCompound ? '#38BDF8' : '#64748B'}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
              disabled={!name.trim()}
              activeOpacity={0.85}
            >
              <Check size={18} color="#0B0F17" strokeWidth={2.5} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
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
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
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
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0369A122',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  replaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#38BDF844',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  replaceBtnContent: {
    flex: 1,
  },
  replaceBtnTitle: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
  replaceBtnSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#162032',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#162032',
    borderWidth: 1,
    borderColor: '#222F43',
  },
  chipSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#162032',
    borderRadius: 10,
    padding: 14,
    marginTop: 4,
    marginBottom: 10,
  },
  switchInfo: {
    flex: 1,
    paddingRight: 10,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  switchSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
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
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#0B0F17',
    fontSize: 14,
    fontWeight: '700',
  },
});

