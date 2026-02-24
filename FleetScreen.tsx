// src/screens/FleetScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { vehicles, Vehicle } from '../data/mockData';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#0A0F1E',
  card: '#0D1428',
  cardBorder: '#1E2A45',
  accent: '#00D4FF',
  accent2: '#00FF88',
  warning: '#FFB800',
  danger: '#FF4757',
  text: '#E8EAF0',
  textMuted: '#5A6580',
  textSecondary: '#8892A4',
};

const getStatusLabel = (status: Vehicle['status']) => {
  switch (status) {
    case 'active': return { label: 'En service', color: COLORS.accent2 };
    case 'idle': return { label: 'En attente', color: COLORS.warning };
    case 'maintenance': return { label: 'Maintenance', color: COLORS.danger };
  }
};

const ConsumptionGauge = ({ value, target, max = 30 }: { value: number; target: number; max?: number }) => {
  const pct = Math.min(value / max, 1);
  const targetPct = Math.min(target / max, 1);
  const isOver = value > target;
  const barW = width - 120;

  return (
    <View style={{ marginTop: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={styles.gaugeLabel}>Consommation moyenne</Text>
        <Text style={[styles.gaugeValue, { color: isOver ? COLORS.danger : COLORS.accent2 }]}>
          {value} L/100km
          {isOver ? ' ▲' : ' ▼'}
        </Text>
      </View>
      <View style={[styles.gaugeBg, { width: barW }]}>
        <View
          style={[
            styles.gaugeFill,
            { width: barW * pct, backgroundColor: isOver ? COLORS.danger : COLORS.accent2 },
          ]}
        />
        <View style={[styles.gaugeTarget, { left: barW * targetPct - 1 }]} />
      </View>
      <Text style={styles.gaugeTarget2}>Objectif : {target} L/100km</Text>
    </View>
  );
};

const FuelLevelIndicator = ({ level }: { level: number }) => {
  const color = level > 50 ? COLORS.accent2 : level > 20 ? COLORS.warning : COLORS.danger;
  const segments = 10;
  return (
    <View>
      <View style={styles.fuelLevelRow}>
        {Array.from({ length: segments }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.fuelSegment,
              { backgroundColor: i < Math.round((level / 100) * segments) ? color : '#1E2A45' },
            ]}
          />
        ))}
        <Text style={[styles.fuelLevelText, { color }]}>{level}%</Text>
      </View>
    </View>
  );
};

const EfficiencyRing = ({ score }: { score: number }) => {
  const color = score >= 80 ? COLORS.accent2 : score >= 60 ? COLORS.warning : COLORS.danger;
  return (
    <View style={styles.efficiencyRing}>
      <View style={[styles.efficiencyOuter, { borderColor: color + '40' }]}>
        <View style={[styles.efficiencyInner, { borderColor: color }]}>
          <Text style={[styles.efficiencyScore, { color }]}>{score}</Text>
          <Text style={styles.efficiencyLabel}>/ 100</Text>
        </View>
      </View>
      <Text style={[styles.efficiencyTag, { color }]}>
        {score >= 80 ? 'Excellent' : score >= 60 ? 'Moyen' : 'Mauvais'}
      </Text>
    </View>
  );
};

export default function FleetScreen() {
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'idle' | 'maintenance'>('all');

  const filtered = filter === 'all' ? vehicles : vehicles.filter(v => v.status === filter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚌 Gestion de la Flotte</Text>
        <Text style={styles.headerSub}>{vehicles.length} véhicules enregistrés</Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {(['all', 'active', 'idle', 'maintenance'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : f === 'idle' ? 'En attente' : 'Maintenance'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {filtered.map(vehicle => {
          const status = getStatusLabel(vehicle.status);
          const isOver = vehicle.consumption_avg > vehicle.consumption_target;
          return (
            <TouchableOpacity
              key={vehicle.id}
              style={styles.vehicleCard}
              onPress={() => setSelected(vehicle)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.vehicleName}>{vehicle.name}</Text>
                  <Text style={styles.vehiclePlate}>{vehicle.plate} • {vehicle.type}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.color + '20', borderColor: status.color + '60' }]}>
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardRow}>
                <View style={styles.cardStat}>
                  <Text style={styles.cardStatLabel}>Chauffeur</Text>
                  <Text style={styles.cardStatValue}>👤 {vehicle.driver}</Text>
                </View>
                <View style={styles.cardStat}>
                  <Text style={styles.cardStatLabel}>KM aujourd'hui</Text>
                  <Text style={styles.cardStatValue}>{vehicle.km_today} km</Text>
                </View>
                <View style={styles.cardStat}>
                  <Text style={styles.cardStatLabel}>Passagers moy.</Text>
                  <Text style={styles.cardStatValue}>{vehicle.passengers_avg} pers.</Text>
                </View>
              </View>

              <ConsumptionGauge
                value={vehicle.consumption_avg}
                target={vehicle.consumption_target}
              />

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardStatLabel}>Niveau carburant</Text>
                  <FuelLevelIndicator level={vehicle.fuel_level} />
                </View>
                <View style={[styles.efficiencyBadge, {
                  backgroundColor: vehicle.efficiency_score >= 80
                    ? '#00FF8815'
                    : vehicle.efficiency_score >= 60
                    ? '#FFB80015'
                    : '#FF475715',
                }]}>
                  <Text style={styles.efficiencyBadgeLabel}>Efficacité</Text>
                  <Text style={[styles.efficiencyBadgeValue, {
                    color: vehicle.efficiency_score >= 80 ? COLORS.accent2
                      : vehicle.efficiency_score >= 60 ? COLORS.warning : COLORS.danger,
                  }]}>
                    {vehicle.efficiency_score}%
                  </Text>
                </View>
              </View>

              {isOver && (
                <View style={styles.overBudgetBanner}>
                  <Text style={styles.overBudgetText}>
                    ⚠️ Dépasse l'objectif de {(vehicle.consumption_avg - vehicle.consumption_target).toFixed(1)} L/100km
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setSelected(null)} activeOpacity={1}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            {selected && (
              <ScrollView>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>{selected.name}</Text>
                <Text style={styles.modalSubtitle}>{selected.plate} • {selected.type}</Text>

                <View style={styles.modalGrid}>
                  <View style={styles.modalGridItem}>
                    <Text style={styles.modalGridLabel}>Localisation</Text>
                    <Text style={styles.modalGridValue}>📍 {selected.last_location}</Text>
                  </View>
                  <View style={styles.modalGridItem}>
                    <Text style={styles.modalGridLabel}>Carburant utilisé auj.</Text>
                    <Text style={styles.modalGridValue}>{selected.fuel_used_today} L</Text>
                  </View>
                  <View style={styles.modalGridItem}>
                    <Text style={styles.modalGridLabel}>KM parcourus</Text>
                    <Text style={styles.modalGridValue}>{selected.km_today} km</Text>
                  </View>
                  <View style={styles.modalGridItem}>
                    <Text style={styles.modalGridLabel}>Passagers moyens</Text>
                    <Text style={styles.modalGridValue}>{selected.passengers_avg} / voyage</Text>
                  </View>
                </View>

                <EfficiencyRing score={selected.efficiency_score} />

                <TouchableOpacity style={styles.modalBtn}>
                  <Text style={styles.modalBtnText}>📊 Voir rapport complet</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnOutline]}>
                  <Text style={styles.modalBtnOutlineText}>🗺️ Optimiser itinéraire</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  headerSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterBtnActive: { backgroundColor: COLORS.accent + '20', borderColor: COLORS.accent + '60' },
  filterText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '500' },
  filterTextActive: { color: COLORS.accent },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },

  vehicleCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vehicleName: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  vehiclePlate: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardDivider: { height: 1, backgroundColor: COLORS.cardBorder, marginVertical: 12 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardStat: {},
  cardStatLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  cardStatValue: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 },

  gaugeLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  gaugeValue: { fontSize: 12, fontWeight: '700' },
  gaugeBg: { height: 6, backgroundColor: '#1E2A45', borderRadius: 3, overflow: 'hidden', position: 'relative' },
  gaugeFill: { height: '100%', borderRadius: 3 },
  gaugeTarget: { position: 'absolute', top: 0, width: 2, height: '100%', backgroundColor: '#ffffff66' },
  gaugeTarget2: { color: COLORS.textMuted, fontSize: 10, marginTop: 3 },

  fuelLevelRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 },
  fuelSegment: { width: 12, height: 8, borderRadius: 2 },
  fuelLevelText: { fontSize: 11, fontWeight: '700', marginLeft: 4 },

  efficiencyBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  efficiencyBadgeLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: '600' },
  efficiencyBadgeValue: { fontSize: 18, fontWeight: '800', marginTop: 2 },

  overBudgetBanner: {
    backgroundColor: '#FF475715',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FF475730',
  },
  overBudgetText: { color: COLORS.danger, fontSize: 12, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#0F1829',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: COLORS.cardBorder,
    maxHeight: '80%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.cardBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  modalSubtitle: { color: COLORS.textMuted, fontSize: 13, marginTop: 4, marginBottom: 16 },
  modalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  modalGridItem: {
    width: (width - 60) / 2,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalGridLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600' },
  modalGridValue: { color: COLORS.text, fontSize: 13, fontWeight: '700', marginTop: 4 },
  efficiencyRing: { alignItems: 'center', paddingVertical: 20 },
  efficiencyOuter: { width: 100, height: 100, borderRadius: 50, borderWidth: 8, justifyContent: 'center', alignItems: 'center' },
  efficiencyInner: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  efficiencyScore: { fontSize: 22, fontWeight: '900' },
  efficiencyLabel: { color: COLORS.textMuted, fontSize: 10 },
  efficiencyTag: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  modalBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBtnText: { color: COLORS.bg, fontSize: 14, fontWeight: '700' },
  modalBtnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.accent },
  modalBtnOutlineText: { color: COLORS.accent, fontSize: 14, fontWeight: '700' },
});
