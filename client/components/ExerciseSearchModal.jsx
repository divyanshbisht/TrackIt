import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Search, X, Dumbbell, Filter } from 'lucide-react-native';
import exercisesData from '../assets/exercises.json';

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];

export default function ExerciseSearchModal({ visible, onClose, onSelectExercise }) {
  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');

  const filteredExercises = useMemo(() => {
    return exercisesData.filter((ex) => {
      const matchesQuery =
        ex.name.toLowerCase().includes(query.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(query.toLowerCase());

      const matchesMuscle =
        selectedMuscle === 'All' ||
        ex.muscleGroup.toLowerCase() === selectedMuscle.toLowerCase();

      return matchesQuery && matchesMuscle;
    });
  }, [query, selectedMuscle]);

  const handleSelect = (exercise) => {
    onSelectExercise(exercise);
    setQuery('');
    setSelectedMuscle('All');
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
              <Text style={styles.title}>Exercise Library</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercise or muscle..."
              placeholderTextColor="#64748B"
              value={query}
              onChangeText={setQuery}
              autoFocus={true}
              clearButtonMode="while-editing"
            />
            {query.length > 0 && Platform.OS !== 'ios' && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          {/* Muscle Group Chips */}
          <View style={styles.muscleListWrapper}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={MUSCLE_GROUPS}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.muscleChipsList}
              renderItem={({ item }) => {
                const isActive = selectedMuscle === item;
                return (
                  <TouchableOpacity
                    onPress={() => setSelectedMuscle(item)}
                    style={[
                      styles.muscleChip,
                      isActive && styles.muscleChipActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.muscleChipText,
                        isActive && styles.muscleChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Exercise List */}
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.exerciseList}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                style={styles.exerciseRow}
                activeOpacity={0.7}
              >
                <View style={styles.exerciseRowLeft}>
                  <Text style={styles.exerciseRowName}>{item.name}</Text>
                  <View style={styles.tagRow}>
                    <View style={styles.muscleTag}>
                      <Text style={styles.muscleTagText}>{item.muscleGroup}</Text>
                    </View>
                    {item.isCompound ? (
                      <View style={styles.compoundTag}>
                        <Text style={styles.compoundTagText}>Compound</Text>
                      </View>
                    ) : (
                      <View style={styles.isolationTag}>
                        <Text style={styles.isolationTagText}>Isolation</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.addPill}>
                  <Text style={styles.addPillText}>+ Add</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No exercises found matching "{query}"</Text>
              </View>
            }
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 13, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0B0F17',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#222F43',
    maxHeight: '85%',
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#151D2A',
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
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
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
    backgroundColor: '#151D2A',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
  },
  muscleListWrapper: {
    marginTop: 10,
    marginBottom: 6,
  },
  muscleChipsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  muscleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
  },
  muscleChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  muscleChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  muscleChipTextActive: {
    color: '#0B0F17',
    fontWeight: '800',
  },
  exerciseList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  exerciseRowLeft: {
    flex: 1,
    marginRight: 10,
  },
  exerciseRowName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  muscleTag: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  muscleTagText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  compoundTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compoundTagText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '600',
  },
  isolationTag: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  isolationTagText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  addPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  addPillText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
});
