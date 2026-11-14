import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import {
  Sliders,
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
  Dumbbell,
  Sparkles,
  Layers,
} from 'lucide-react-native';
import { useSplitStore, PROGRAM_PRESETS } from '../store/useSplitStore';

export default function ManageSplitsModal({ visible, onClose }) {
  const {
    splits,
    applyProgramPreset,
    addSplitDay,
    deleteSplitDay,
    renameSplitDay,
    reorderSplitDays,
  } = useSplitStore();

  const [activeTab, setActiveTab] = useState('days'); // 'days' or 'presets'
  const [newDayName, setNewDayName] = useState('');
  const [startEmpty, setStartEmpty] = useState(true);

  // Rename state
  const [editingKey, setEditingKey] = useState(null);
  const [renamedText, setRenamedText] = useState('');

  if (!visible) return null;

  const splitKeys = Object.keys(splits);

  const handleAddDay = () => {
    if (!newDayName.trim()) return;
    addSplitDay(newDayName.trim());
    setNewDayName('');
  };

  const handleStartRename = (key) => {
    setEditingKey(key);
    setRenamedText(key);
  };

  const handleSaveRename = (oldKey) => {
    if (renamedText.trim()) {
      renameSplitDay(oldKey, renamedText.trim());
    }
    setEditingKey(null);
  };

  const handleDeleteDay = (key) => {
    if (splitKeys.length <= 1) {
      if (Platform.OS === 'web') {
        window.alert('You must have at least one split day.');
      } else {
        Alert.alert('Cannot Delete', 'You must have at least one split day.');
      }
      return;
    }

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${key}" from your split program?`)) {
        deleteSplitDay(key);
      }
    } else {
      Alert.alert('Delete Split Day', `Delete "${key}" from your split program?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteSplitDay(key) },
      ]);
    }
  };

  const handleSelectPreset = (presetKey) => {
    const preset = PROGRAM_PRESETS[presetKey];
    const confirmMsg = `Switch to "${preset.name}"? ${
      startEmpty
        ? 'Your days will start empty so you can add exercises as you train.'
        : 'Sample verified exercises will be pre-loaded.'
    }`;

    const apply = () => {
      applyProgramPreset(presetKey, startEmpty);
      setActiveTab('days');
    };

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        apply();
      }
    } else {
      Alert.alert('Apply Program Preset', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Apply', style: 'default', onPress: apply },
      ]);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconBox}>
                <Sliders size={18} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.title}>Manage Split Program</Text>
                <Text style={styles.subtitle}>Choose program structure or customize days</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Segmented Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => setActiveTab('days')}
              style={[styles.tabBtn, activeTab === 'days' && styles.tabBtnActive]}
              activeOpacity={0.7}
            >
              <Layers size={14} color={activeTab === 'days' ? '#38BDF8' : '#94A3B8'} />
              <Text style={[styles.tabBtnText, activeTab === 'days' && styles.tabBtnTextActive]}>
                My Split Days ({splitKeys.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('presets')}
              style={[styles.tabBtn, activeTab === 'presets' && styles.tabBtnActive]}
              activeOpacity={0.7}
            >
              <Sparkles size={14} color={activeTab === 'presets' ? '#38BDF8' : '#94A3B8'} />
              <Text style={[styles.tabBtnText, activeTab === 'presets' && styles.tabBtnTextActive]}>
                Program Presets
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {activeTab === 'days' ? (
              <>
                <Text style={styles.helpText}>
                  Organize the days of your training program. Exercises and sets are added per day later.
                </Text>

                {/* Days List */}
                {splitKeys.map((key, idx) => {
                  const splitObj = splits[key] || {};
                  const exCount = (splitObj.exercises || []).length;
                  const isEditing = editingKey === key;

                  return (
                    <View key={key} style={styles.dayCard}>
                      <View style={styles.dayCardLeft}>
                        {isEditing ? (
                          <View style={styles.renameRow}>
                            <TextInput
                              style={styles.renameInput}
                              value={renamedText}
                              onChangeText={setRenamedText}
                              autoFocus
                              placeholder="Split Name"
                              placeholderTextColor="#64748B"
                            />
                            <TouchableOpacity
                              onPress={() => handleSaveRename(key)}
                              style={styles.saveRenameBtn}
                            >
                              <Check size={16} color="#10B981" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => handleStartRename(key)}
                            style={styles.dayTitleGroup}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.dayName}>{key}</Text>
                            <View style={styles.exerciseBadge}>
                              <Text style={styles.exerciseBadgeText}>
                                {exCount === 0 ? 'Empty (Ready)' : `${exCount} exercises`}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Controls */}
                      <View style={styles.dayControls}>
                        {splitKeys.length > 1 && (
                          <View style={styles.arrowGroup}>
                            <TouchableOpacity
                              onPress={() => reorderSplitDays(idx, idx - 1)}
                              disabled={idx === 0}
                              style={[styles.arrowBtn, idx === 0 && styles.arrowBtnDisabled]}
                            >
                              <ChevronUp size={14} color={idx === 0 ? '#334155' : '#94A3B8'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => reorderSplitDays(idx, idx + 1)}
                              disabled={idx === splitKeys.length - 1}
                              style={[
                                styles.arrowBtn,
                                idx === splitKeys.length - 1 && styles.arrowBtnDisabled,
                              ]}
                            >
                              <ChevronDown
                                size={14}
                                color={idx === splitKeys.length - 1 ? '#334155' : '#94A3B8'}
                              />
                            </TouchableOpacity>
                          </View>
                        )}

                        <TouchableOpacity
                          onPress={() => handleDeleteDay(key)}
                          style={styles.trashBtn}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {/* Add New Split Day Box */}
                <View style={styles.addDayBox}>
                  <Text style={styles.addDayLabel}>ADD CUSTOM SPLIT DAY</Text>
                  <View style={styles.addDayInputRow}>
                    <TextInput
                      style={styles.addDayInput}
                      value={newDayName}
                      onChangeText={setNewDayName}
                      placeholder="e.g. Chest & Triceps, Cardio & Core"
                      placeholderTextColor="#64748B"
                      onSubmitEditing={handleAddDay}
                    />
                    <TouchableOpacity
                      onPress={handleAddDay}
                      style={[styles.addDayBtn, !newDayName.trim() && styles.addDayBtnDisabled]}
                      disabled={!newDayName.trim()}
                      activeOpacity={0.8}
                    >
                      <Plus size={16} color="#0B0F17" strokeWidth={2.5} />
                      <Text style={styles.addDayBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.helpText}>
                  Choose a standard split structure. You can add your exercises later as you train.
                </Text>

                {/* Empty Days Toggle */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleTitle}>Start with Empty Split Days</Text>
                    <Text style={styles.toggleSub}>
                      Exercises & sets come later — you can add movements as you train at the gym
                    </Text>
                  </View>
                  <Switch
                    value={startEmpty}
                    onValueChange={setStartEmpty}
                    trackColor={{ false: '#1E293B', true: '#0284C7' }}
                    thumbColor={startEmpty ? '#38BDF8' : '#64748B'}
                  />
                </View>

                {/* Preset Cards */}
                {Object.keys(PROGRAM_PRESETS).map((pKey) => {
                  const preset = PROGRAM_PRESETS[pKey];
                  return (
                    <TouchableOpacity
                      key={pKey}
                      onPress={() => handleSelectPreset(pKey)}
                      style={styles.presetCard}
                      activeOpacity={0.7}
                    >
                      <View style={styles.presetHeader}>
                        <View style={styles.presetTitleRow}>
                          <Dumbbell size={16} color="#38BDF8" />
                          <Text style={styles.presetName}>{preset.name}</Text>
                        </View>
                        <View style={styles.dayCountBadge}>
                          <Text style={styles.dayCountText}>{preset.days.length} Days</Text>
                        </View>
                      </View>

                      <Text style={styles.presetDesc}>{preset.desc}</Text>

                      {/* Day tags */}
                      <View style={styles.presetDaysRow}>
                        {preset.days.map((d) => (
                          <View key={d} style={styles.presetDayTag}>
                            <Text style={styles.presetDayTagText}>{d}</Text>
                          </View>
                        ))}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.doneBtn} activeOpacity={0.85}>
              <Check size={16} color="#0B0F17" strokeWidth={2.5} />
              <Text style={styles.doneBtnText}>Done</Text>
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
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#162032',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    padding: 6,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#222F43',
  },
  tabBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  helpText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 16,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#162032',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  dayCardLeft: {
    flex: 1,
  },
  dayTitleGroup: {
    gap: 4,
  },
  dayName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  exerciseBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exerciseBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  renameInput: {
    flex: 1,
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: 6,
    color: '#F8FAFC',
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saveRenameBtn: {
    padding: 6,
  },
  dayControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrowGroup: {
    flexDirection: 'row',
    backgroundColor: '#0B0F17',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#222F43',
  },
  arrowBtn: {
    padding: 6,
  },
  arrowBtnDisabled: {
    opacity: 0.3,
  },
  trashBtn: {
    padding: 6,
  },
  addDayBox: {
    backgroundColor: '#162032',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    marginBottom: 20,
  },
  addDayLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  addDayInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addDayInput: {
    flex: 1,
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 8,
    color: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 4,
  },
  addDayBtnDisabled: {
    opacity: 0.5,
  },
  addDayBtnText: {
    color: '#0B0F17',
    fontWeight: '700',
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#162032',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 10,
  },
  toggleTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  toggleSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  presetCard: {
    backgroundColor: '#162032',
    borderWidth: 1,
    borderColor: '#222F43',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  presetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  presetName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  dayCountBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dayCountText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  presetDesc: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 8,
  },
  presetDaysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetDayTag: {
    backgroundColor: '#0B0F17',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#222F43',
  },
  presetDayTagText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 6,
  },
  doneBtnText: {
    color: '#0B0F17',
    fontSize: 14,
    fontWeight: '700',
  },
});

