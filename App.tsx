import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import {
  ACTIVITY_TYPES,
  ActivityType,
  Entry,
  GOALS,
  METRIC_LABEL,
  Metric,
  sampleEntries,
  toDateKey,
  totalForDate,
  validateForm,
  weekSeries,
} from './utils';

const STORAGE_KEY = 'codealpha.fitness.entries.v1';
type Tab = 'dashboard' | 'log' | 'history';
const METRICS: Metric[] = ['steps', 'calories', 'minutes'];

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [metric, setMetric] = useState<Metric>('calories');

  // Log form
  const [type, setType] = useState<ActivityType>('Walking');
  const [minutes, setMinutes] = useState('');
  const [calories, setCalories] = useState('');
  const [steps, setSteps] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setEntries(JSON.parse(raw) as Entry[]);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Entry[]) => {
    setEntries(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      Alert.alert('Could not save', 'Your data is shown now but may not be kept after closing the app.');
    }
  }, []);

  const today = new Date();
  const todayKey = toDateKey(today);
  const week = useMemo(() => weekSeries(entries, new Date(), metric), [entries, metric]);
  const weekTotal = week.reduce((s, d) => s + d.value, 0);
  const weekMax = Math.max(...week.map((d) => d.value), GOALS[metric] / 2, 1);

  const addEntry = async () => {
    const result = validateForm({ minutes, calories, steps });
    if (!result.ok) {
      setError(result.error);
      setSaved(false);
      return;
    }
    const entry: Entry = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      date: toDateKey(new Date()),
      type,
      minutes: result.minutes,
      calories: result.calories,
      steps: result.steps,
    };
    await persist([entry, ...entries]);
    setMinutes('');
    setCalories('');
    setSteps('');
    setError('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const deleteEntry = (entry: Entry) => {
    const run = () => void persist(entries.filter((e) => e.id !== entry.id));
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Delete this activity?')) run();
      return;
    }
    Alert.alert('Delete activity?', `${entry.type} on ${entry.date}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: run },
    ]);
  };

  const loadSample = () => void persist([...sampleEntries(new Date()), ...entries]);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1)),
    [entries],
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={C.green} />
        <Text style={styles.muted}>Loading your activity…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Fitness Tracker</Text>
        <Text style={styles.muted}>
          {today.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {tab === 'dashboard' && (
          <>
            <Text style={styles.section}>Today</Text>
            <View style={styles.panel}>
              {METRICS.map((m) => {
                const value = totalForDate(entries, todayKey, m);
                const pct = Math.min(value / GOALS[m], 1);
                return (
                  <View key={m} style={styles.goalRow}>
                    <View style={styles.goalHead}>
                      <Text style={styles.goalName}>{METRIC_LABEL[m]}</Text>
                      <Text style={styles.goalVal}>
                        {value.toLocaleString()} / {GOALS[m].toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: pct >= 1 ? C.green : C.blue }]} />
                    </View>
                    {pct >= 1 && <Text style={styles.goalDone}>Goal reached</Text>}
                  </View>
                );
              })}
            </View>

            <Text style={styles.section}>Last 7 days</Text>
            <View style={styles.seg}>
              {METRICS.map((m) => (
                <Pressable key={m} onPress={() => setMetric(m)} style={[styles.segBtn, metric === m && styles.segActive]}>
                  <Text style={[styles.segText, metric === m && styles.segTextActive]}>{METRIC_LABEL[m]}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.panel}>
              <View style={styles.chart}>
                {week.map((d) => (
                  <View key={d.key} style={styles.barCol}>
                    <Text style={styles.barVal}>{d.value > 0 ? d.value.toLocaleString() : ''}</Text>
                    <View style={styles.barSlot}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${(d.value / weekMax) * 100}%`,
                            backgroundColor: d.key === todayKey ? C.green : C.blue,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{d.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.summary}>
                Total {weekTotal.toLocaleString()} · Daily average {Math.round(weekTotal / 7).toLocaleString()}
              </Text>
            </View>

            {entries.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No activity logged yet</Text>
                <Text style={[styles.muted, { textAlign: 'center' }]}>
                  Log your first activity, or load a sample week to see how the dashboard works.
                </Text>
                <View style={styles.rowGap}>
                  <Pressable style={styles.primary} onPress={() => setTab('log')}>
                    <Text style={styles.primaryText}>Log activity</Text>
                  </Pressable>
                  <Pressable style={styles.secondary} onPress={loadSample}>
                    <Text style={styles.secondaryText}>Load sample week</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </>
        )}

        {tab === 'log' && (
          <View style={styles.panel}>
            <Text style={styles.label}>Activity</Text>
            <View style={styles.chips}>
              {ACTIVITY_TYPES.map((t) => (
                <Pressable key={t} onPress={() => setType(t)} style={[styles.chip, type === t && styles.chipActive]}>
                  <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
            <Field label="Duration (minutes)" value={minutes} onChange={setMinutes} placeholder="e.g. 30" />
            <Field label="Calories burned" value={calories} onChange={setCalories} placeholder="e.g. 250" />
            <Field label="Steps (optional)" value={steps} onChange={setSteps} placeholder="e.g. 4000" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {saved ? <Text style={styles.success}>Activity saved. See it on the dashboard.</Text> : null}
            <Pressable style={styles.primary} onPress={() => void addEntry()}>
              <Text style={styles.primaryText}>Save activity</Text>
            </Pressable>
          </View>
        )}

        {tab === 'history' &&
          (sorted.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing to show yet</Text>
              <Text style={styles.muted}>Activities you log will appear here.</Text>
            </View>
          ) : (
            sorted.map((e) => (
              <View key={e.id} style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{e.type}</Text>
                  <Text style={styles.muted}>
                    {e.date === todayKey ? 'Today' : e.date} · {e.minutes} min · {e.calories} kcal
                    {e.steps > 0 ? ` · ${e.steps.toLocaleString()} steps` : ''}
                  </Text>
                </View>
                <Pressable onPress={() => deleteEntry(e)} accessibilityLabel={`Delete ${e.type} on ${e.date}`}>
                  <Text style={styles.delete}>Delete</Text>
                </Pressable>
              </View>
            ))
          ))}
      </ScrollView>

      <View style={styles.tabBar}>
        {([['dashboard', 'Dashboard'], ['log', 'Log'], ['history', 'History']] as [Tab, string][]).map(([t, label]) => (
          <Pressable key={t} style={styles.tabItem} onPress={() => setTab(t)} accessibilityRole="tab" accessibilityState={{ selected: tab === t }}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{label}</Text>
            {tab === t && <View style={styles.tabDot} />}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChange}
        placeholder={props.placeholder}
        keyboardType="number-pad"
        inputMode="numeric"
      />
    </>
  );
}

const C = { bg: '#F2F5F1', ink: '#16241B', muted: '#5F6F64', green: '#1F9D55', blue: '#3B82C4', paper: '#FFFFFF', line: '#DCE4DC', danger: '#C62828' };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, width: '100%', maxWidth: 640, alignSelf: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  title: { fontSize: 28, fontWeight: '800', color: C.ink },
  muted: { color: C.muted, fontSize: 14 },
  content: { padding: 20, paddingBottom: 30 },
  section: { fontSize: 18, fontWeight: '800', color: C.ink, marginTop: 6, marginBottom: 10 },
  panel: { backgroundColor: C.paper, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.line, marginBottom: 16 },
  goalRow: { marginBottom: 14 },
  goalHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  goalName: { fontWeight: '700', color: C.ink },
  goalVal: { color: C.muted },
  goalDone: { color: C.green, fontWeight: '700', marginTop: 4, fontSize: 13 },
  track: { height: 12, backgroundColor: '#E6ECE6', borderRadius: 6, overflow: 'hidden' },
  fill: { height: 12, borderRadius: 6 },
  seg: { flexDirection: 'row', backgroundColor: '#E1E8E1', borderRadius: 12, padding: 4, marginBottom: 12 },
  segBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  segActive: { backgroundColor: C.paper },
  segText: { color: C.muted, fontWeight: '600', fontSize: 13 },
  segTextActive: { color: C.ink },
  chart: { flexDirection: 'row', height: 190, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', height: '100%' },
  barVal: { fontSize: 10, color: C.muted, height: 14 },
  barSlot: { flex: 1, width: '60%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, minHeight: 2 },
  barLabel: { marginTop: 6, fontSize: 12, color: C.muted },
  summary: { marginTop: 12, color: C.ink, fontWeight: '600', textAlign: 'center' },
  empty: { alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.ink, marginBottom: 6 },
  rowGap: { flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  primary: { backgroundColor: C.green, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondary: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, borderWidth: 1, borderColor: C.green, marginTop: 8 },
  secondaryText: { color: C.green, fontWeight: '800', fontSize: 16 },
  label: { marginTop: 12, marginBottom: 6, color: C.muted, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: C.line, backgroundColor: '#F7FAF7' },
  chipActive: { backgroundColor: C.green, borderColor: C.green },
  chipText: { color: C.ink, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, fontSize: 16, color: C.ink, backgroundColor: '#F7FAF7' },
  error: { color: C.danger, marginTop: 12, fontWeight: '600' },
  success: { color: C.green, marginTop: 12, fontWeight: '700' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.paper, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.line },
  itemTitle: { fontWeight: '800', color: C.ink, fontSize: 16, marginBottom: 2 },
  delete: { color: C.danger, fontWeight: '700', padding: 6 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.paper },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { color: C.muted, fontWeight: '700' },
  tabTextActive: { color: C.green },
  tabDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green, marginTop: 4 },
});
