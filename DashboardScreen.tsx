// src/screens/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { vehicles, weeklyFuelData, monthlyStats } from '../data/mockData';

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

const FuelBar = ({ value, target, max = 100 }: { value: number; target: number; max?: number }) => {
  const barWidth = width - 80;
  const fillPct = Math.min(value / max, 1);
  const targetPct = Math.min(target / max, 1);
  const isOverTarget = value > target;

  return (
    <View style={{ marginTop: 6 }}>
      <View style={[styles.barBg, { width: barWidth }]}>
        <View
          style={[
            styles.barFill,
            {
              width: barWidth * fillPct,
              backgroundColor: isOverTarget ? COLORS.danger : COLORS.accent2,
            },
          ]}
        />
        <View style={[styles.barTarget, { left: barWidth * targetPct - 1 }]} />
      </View>
    </View>
  );
};

const MiniChart = ({ data }: { data: typeof weeklyFuelData }) => {
  const maxVal = Math.max(...data.map(d => d.consumed));
  const chartH = 60;
  const barW = (width - 80) / data.length - 6;

  return (
    <View style={styles.miniChart}>
      {data.map((item, i) => {
        const h = (item.consumed / maxVal) * chartH;
        const targetH = (item.target / maxVal) * chartH;
        const isGood = item.consumed <= item.target;
        return (
          <View key={i} style={styles.miniChartBar}>
            <View style={[styles.miniChartBg, { height: chartH, width: barW }]}>
              <View
                style={[
                  styles.miniChartFill,
                  {
                    height: h,
                    width: barW,
                    backgroundColor: isGood ? COLORS.accent2 : COLORS.warning,
                    opacity: 0.85,
                  },
                ]}
              />
              <View
                style={[
                  styles.miniChartTarget,
                  { bottom: targetH, width: barW },
                ]}
              />
            </View>
            <Text style={styles.miniChartLabel}>{item.day}</Text>
          </View>
        );
      })}
    </View>
  );
};

export default function DashboardScreen() {
  const [time, setTime] = useState(new Date());
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const totalFuelToday = vehicles.reduce((sum, v) => sum + v.fuel_used_today, 0);
  const avgEfficiency =
    Math.round(vehicles.reduce((sum, v) => sum + v.efficiency_score, 0) / vehicles.length);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>⚡ FuelTrack</Text>
          <Text style={styles.headerSub}>
            {time.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <View style={styles.liveIndicator} />
          <Text style={styles.liveText}>EN DIRECT</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { flex: 1.2 }]}>
            <Text style={styles.kpiLabel}>Véhicules actifs</Text>
            <Text style={styles.kpiValue}>
              {activeVehicles}
              <Text style={styles.kpiSub}>/{vehicles.length}</Text>
            </Text>
            <Text style={styles.kpiBadge}>🚌 Flotte</Text>
          </View>
          <View style={[styles.kpiCard, { flex: 1 }]}>
            <Text style={styles.kpiLabel}>Carburant aujourd'hui</Text>
            <Text style={[styles.kpiValue, { color: COLORS.accent }]}>
              {totalFuelToday.toFixed(0)}L
            </Text>
            <Text style={styles.kpiBadge}>⛽ Conso</Text>
          </View>
          <View style={[styles.kpiCard, { flex: 1 }]}>
            <Text style={styles.kpiLabel}>Efficacité moy.</Text>
            <Text style={[styles.kpiValue, { color: avgEfficiency >= 70 ? COLORS.accent2 : COLORS.warning }]}>
              {avgEfficiency}%
            </Text>
            <Text style={styles.kpiBadge}>🎯 Score</Text>
          </View>
        </View>

        {/* Savings Banner */}
        <View style={styles.savingsBanner}>
          <View>
            <Text style={styles.savingsLabel}>ÉCONOMIES CE MOIS</Text>
            <Text style={styles.savingsValue}>↓ {monthlyStats.savings_vs_last_month}%</Text>
            <Text style={styles.savingsSubtxt}>vs mois précédent</Text>
          </View>
          <View style={styles.savingsDivider} />
          <View>
            <Text style={styles.savingsLabel}>CO₂ ÉVITÉ</Text>
            <Text style={styles.savingsValue}>{monthlyStats.co2_saved} kg</Text>
            <Text style={styles.savingsSubtxt}>ce mois-ci</Text>
          </View>
          <View style={styles.savingsDivider} />
          <View>
            <Text style={styles.savingsLabel}>COÛT TOTAL</Text>
            <Text style={styles.savingsValue}>{monthlyStats.total_cost.toLocaleString('fr-FR')} DT</Text>
            <Text style={styles.savingsSubtxt}>carburant</Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Consommation hebdomadaire</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.accent2 }]} />
              <Text style={styles.legendText}>Conso réelle</Text>
              <View style={[styles.legendDot, { backgroundColor: COLORS.warning, marginLeft: 8 }]} />
              <Text style={styles.legendText}>Dépassement</Text>
            </View>
          </View>
          <MiniChart data={weeklyFuelData} />
          <View style={styles.targetHint}>
            <Text style={styles.targetHintText}>— Objectif cible</Text>
          </View>
        </View>

        {/* Alert Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alertes & Actions</Text>
          <View style={styles.alertCard}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Bus Urbain C2 — Surconsommation</Text>
              <Text style={styles.alertText}>
                Consommation 25% au-dessus de l'objectif. Itinéraire non optimisé.
              </Text>
            </View>
            <TouchableOpacity style={styles.alertAction}>
              <Text style={styles.alertActionText}>Voir</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.alertCard}>
            <Text style={styles.alertIcon}>🔧</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Navette D7 — En maintenance</Text>
              <Text style={styles.alertText}>
                Retour prévu demain. Réaffectation requise.
              </Text>
            </View>
            <TouchableOpacity style={styles.alertAction}>
              <Text style={styles.alertActionText}>Gérer</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.alertCard, { borderColor: '#00FF8822' }]}>
            <Text style={styles.alertIcon}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: COLORS.accent2 }]}>
                Minibus B3 — Performance optimale
              </Text>
              <Text style={styles.alertText}>Score d'efficacité 85/100. Continuez ainsi !</Text>
            </View>
          </View>
        </View>

        {/* Vehicles Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>État de la flotte</Text>
          {vehicles.map(v => (
            <View key={v.id} style={styles.vehicleRow}>
              <View style={styles.vehicleInfo}>
                <View style={[styles.statusDot, {
                  backgroundColor:
                    v.status === 'active' ? COLORS.accent2
                    : v.status === 'idle' ? COLORS.warning
                    : COLORS.danger,
                }]} />
                <View>
                  <Text style={styles.vehicleName}>{v.name}</Text>
                  <Text style={styles.vehicleDriver}>{v.driver}</Text>
                </View>
              </View>
              <View style={styles.vehicleStats}>
                <Text style={styles.vehicleStat}>{v.consumption_avg} L/100km</Text>
                <Text style={[styles.vehicleEfficiency, {
                  color: v.efficiency_score >= 80 ? COLORS.accent2
                    : v.efficiency_score >= 60 ? COLORS.warning
                    : COLORS.danger,
                }]}>
                  {v.efficiency_score}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  headerSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00FF8812',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00FF8833',
    gap: 5,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent2,
  },
  liveText: { color: COLORS.accent2, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  kpiCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 14,
    padding: 12,
  },
  kpiLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  kpiValue: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginTop: 4 },
  kpiSub: { fontSize: 14, color: COLORS.textMuted },
  kpiBadge: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },

  savingsBanner: {
    backgroundColor: '#00D4FF0A',
    borderWidth: 1,
    borderColor: '#00D4FF22',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginBottom: 16,
  },
  savingsLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  savingsValue: { color: COLORS.accent, fontSize: 18, fontWeight: '800', textAlign: 'center', marginTop: 2 },
  savingsSubtxt: { color: COLORS.textMuted, fontSize: 10, textAlign: 'center', marginTop: 1 },
  savingsDivider: { width: 1, backgroundColor: '#00D4FF22' },

  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.textMuted, fontSize: 10 },

  miniChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  miniChartBar: { alignItems: 'center', gap: 4 },
  miniChartBg: { justifyContent: 'flex-end', position: 'relative', overflow: 'hidden', borderRadius: 4, backgroundColor: '#1E2A45' },
  miniChartFill: { position: 'absolute', bottom: 0, borderRadius: 4 },
  miniChartTarget: { position: 'absolute', height: 1.5, backgroundColor: '#ffffff44' },
  miniChartLabel: { color: COLORS.textMuted, fontSize: 10 },
  targetHint: { alignItems: 'flex-end', marginTop: 4 },
  targetHintText: { color: COLORS.textMuted, fontSize: 10, fontStyle: 'italic' },

  barBg: { height: 6, backgroundColor: '#1E2A45', borderRadius: 3, overflow: 'hidden', position: 'relative' },
  barFill: { height: '100%', borderRadius: 3 },
  barTarget: { position: 'absolute', top: 0, width: 2, height: '100%', backgroundColor: '#ffffff66' },

  alertCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: '#FFB80022',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  alertIcon: { fontSize: 20 },
  alertTitle: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  alertText: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  alertAction: {
    backgroundColor: COLORS.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  alertActionText: { color: COLORS.accent, fontSize: 12, fontWeight: '600' },

  vehicleRow: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  vehicleName: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  vehicleDriver: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  vehicleStats: { alignItems: 'flex-end' },
  vehicleStat: { color: COLORS.textSecondary, fontSize: 12 },
  vehicleEfficiency: { fontSize: 14, fontWeight: '800', marginTop: 2 },
});
