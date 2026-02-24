// src/screens/ReportsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { vehicles, monthlyStats, weeklyFuelData } from '../data/mockData';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#0A0F1E',
  card: '#0D1428',
  cardBorder: '#1E2A45',
  accent: '#00D4FF',
  accent2: '#00FF88',
  warning: '#FFB800',
  danger: '#FF4757',
  purple: '#9B59B6',
  text: '#E8EAF0',
  textMuted: '#5A6580',
  textSecondary: '#8892A4',
};

const BarChart = ({ data, title }: { data: typeof weeklyFuelData; title: string }) => {
  const maxVal = Math.max(...data.map(d => Math.max(d.consumed, d.target)));
  const chartW = width - 64;
  const chartH = 100;
  const barAreaW = chartW - 36;
  const barW = (barAreaW / data.length) - 8;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartArea}>
        {/* Y axis labels */}
        <View style={styles.yAxis}>
          {[maxVal, Math.round(maxVal / 2), 0].map((v, i) => (
            <Text key={i} style={styles.yLabel}>{v}</Text>
          ))}
        </View>
        {/* Bars */}
        <View style={[styles.barsContainer, { height: chartH }]}>
          {/* Grid lines */}
          {[1, 0.5, 0].map((pct, i) => (
            <View key={i} style={[styles.gridLine, { bottom: pct * chartH }]} />
          ))}
          {/* Bar pairs */}
          {data.map((item, i) => {
            const consumedH = (item.consumed / maxVal) * chartH;
            const targetH = (item.target / maxVal) * chartH;
            const isOver = item.consumed > item.target;
            return (
              <View key={i} style={[styles.barGroup, { width: barAreaW / data.length }]}>
                <View style={[styles.barPair, { height: chartH }]}>
                  <View style={[styles.barTarget, { height: targetH, width: barW * 0.45, backgroundColor: COLORS.accent + '40' }]} />
                  <View style={[styles.barConsumed, { height: consumedH, width: barW * 0.45, backgroundColor: isOver ? COLORS.danger : COLORS.accent2 }]} />
                </View>
                <Text style={styles.barXLabel}>{item.day}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: COLORS.accent2 }]} />
          <Text style={styles.legendLabel}>Consommé</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: COLORS.accent + '40', borderWidth: 1, borderColor: COLORS.accent }]} />
          <Text style={styles.legendLabel}>Objectif</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: COLORS.danger }]} />
          <Text style={styles.legendLabel}>Dépassement</Text>
        </View>
      </View>
    </View>
  );
};

const VehicleRanking = () => {
  const sorted = [...vehicles].sort((a, b) => b.efficiency_score - a.efficiency_score);
  return (
    <View style={styles.rankingCard}>
      <Text style={styles.sectionTitle}>🏆 Classement Efficacité</Text>
      {sorted.map((v, i) => (
        <View key={v.id} style={styles.rankRow}>
          <Text style={[styles.rankPosition, i === 0 ? styles.gold : i === 1 ? styles.silver : i === 2 ? styles.bronze : styles.rankDefault]}>
            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rankName}>{v.name}</Text>
            <View style={styles.rankBarRow}>
              <View style={[styles.rankBarBg, { flex: 1 }]}>
                <View style={[styles.rankBarFill, {
                  width: `${v.efficiency_score}%` as any,
                  backgroundColor: v.efficiency_score >= 80 ? COLORS.accent2 : v.efficiency_score >= 60 ? COLORS.warning : COLORS.danger,
                }]} />
              </View>
              <Text style={[styles.rankScore, {
                color: v.efficiency_score >= 80 ? COLORS.accent2 : v.efficiency_score >= 60 ? COLORS.warning : COLORS.danger,
              }]}>
                {v.efficiency_score}%
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.rankConsumption}>{v.consumption_avg} L/100</Text>
            <Text style={[styles.rankVsTarget, {
              color: v.consumption_avg <= v.consumption_target ? COLORS.accent2 : COLORS.danger,
            }]}>
              {v.consumption_avg <= v.consumption_target
                ? `↓ ${(v.consumption_target - v.consumption_avg).toFixed(1)} sous objectif`
                : `↑ ${(v.consumption_avg - v.consumption_target).toFixed(1)} au-dessus`}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default function ReportsScreen() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const totalSavingsLiters = weeklyFuelData.reduce((s, d) => s + Math.max(d.target - d.consumed, 0), 0);
  const overBudgetDays = weeklyFuelData.filter(d => d.consumed > d.target).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Rapports & Analyses</Text>
        <Text style={styles.headerSub}>Optimisation de la consommation</Text>
      </View>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {(['week', 'month', 'year'] as const).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Monthly KPIs */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>{monthlyStats.total_km.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Km parcourus</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={[styles.kpiValue, { color: COLORS.accent }]}>
              {monthlyStats.total_fuel.toLocaleString()} L
            </Text>
            <Text style={styles.kpiLabel}>Carburant total</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={[styles.kpiValue, { color: COLORS.accent2 }]}>
              ↓{monthlyStats.savings_vs_last_month}%
            </Text>
            <Text style={styles.kpiLabel}>vs mois préc.</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={[styles.kpiValue, { color: COLORS.purple }]}>
              {monthlyStats.co2_saved} kg
            </Text>
            <Text style={styles.kpiLabel}>CO₂ évité</Text>
          </View>
        </View>

        {/* Consumption summary cards */}
        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, { borderColor: '#00FF8830' }]}>
            <Text style={styles.summaryCardIcon}>⛽</Text>
            <Text style={[styles.summaryCardValue, { color: COLORS.accent2 }]}>
              +{totalSavingsLiters.toFixed(0)}L
            </Text>
            <Text style={styles.summaryCardLabel}>économisés cette semaine</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: '#FF475730' }]}>
            <Text style={styles.summaryCardIcon}>⚠️</Text>
            <Text style={[styles.summaryCardValue, { color: COLORS.danger }]}>
              {overBudgetDays} jours
            </Text>
            <Text style={styles.summaryCardLabel}>au-dessus de l'objectif</Text>
          </View>
        </View>

        {/* Bar Chart */}
        <BarChart data={weeklyFuelData} title="Consommation vs Objectif (semaine)" />

        {/* Consumption breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>📈 Indicateurs clés</Text>
          {[
            {
              label: 'Conso. moyenne flotte',
              value: `${monthlyStats.avg_consumption} L/100km`,
              target: `Objectif: ${monthlyStats.target_consumption} L/100km`,
              ok: monthlyStats.avg_consumption <= monthlyStats.target_consumption + 2,
              pct: (monthlyStats.avg_consumption / (monthlyStats.target_consumption + 5)) * 100,
            },
            {
              label: 'Lignes optimisées',
              value: `${monthlyStats.optimized_routes_pct}%`,
              target: 'Objectif: 100%',
              ok: monthlyStats.optimized_routes_pct >= 80,
              pct: monthlyStats.optimized_routes_pct,
            },
            {
              label: 'Coût total carburant',
              value: `${monthlyStats.total_cost.toLocaleString('fr-FR')} DT`,
              target: 'Budget mensuel: 7 000 DT',
              ok: monthlyStats.total_cost <= 7000,
              pct: (monthlyStats.total_cost / 7000) * 100,
            },
          ].map((item, i) => (
            <View key={i} style={styles.kpiRow}>
              <View style={styles.kpiRowHeader}>
                <Text style={styles.kpiRowLabel}>{item.label}</Text>
                <Text style={[styles.kpiRowValue, { color: item.ok ? COLORS.accent2 : COLORS.warning }]}>
                  {item.value}
                </Text>
              </View>
              <View style={styles.kpiBarBg}>
                <View style={[styles.kpiBarFill, {
                  width: `${Math.min(item.pct, 100)}%` as any,
                  backgroundColor: item.ok ? COLORS.accent2 : COLORS.warning,
                }]} />
              </View>
              <Text style={styles.kpiRowTarget}>{item.target}</Text>
            </View>
          ))}
        </View>

        {/* Vehicle Ranking */}
        <VehicleRanking />

        {/* Export Section */}
        <View style={styles.exportSection}>
          <Text style={styles.exportTitle}>Exporter les rapports</Text>
          <View style={styles.exportBtns}>
            <TouchableOpacity style={styles.exportBtn}>
              <Text style={styles.exportBtnIcon}>📄</Text>
              <Text style={styles.exportBtnText}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn}>
              <Text style={styles.exportBtnIcon}>📊</Text>
              <Text style={styles.exportBtnText}>Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn}>
              <Text style={styles.exportBtnIcon}>📧</Text>
              <Text style={styles.exportBtnText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: COLORS.accent + '20', borderColor: COLORS.accent + '60' },
  periodText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  periodTextActive: { color: COLORS.accent },
  scroll: { paddingHorizontal: 16, paddingTop: 12 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  kpiItem: {
    width: (width - 56) / 2,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 14,
  },
  kpiValue: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  kpiLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },

  summaryCards: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  summaryCardIcon: { fontSize: 22, marginBottom: 4 },
  summaryCardValue: { fontSize: 18, fontWeight: '800' },
  summaryCardLabel: { color: COLORS.textMuted, fontSize: 10, textAlign: 'center', marginTop: 4 },

  chartCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  chartTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  chartArea: { flexDirection: 'row' },
  yAxis: { width: 36, justifyContent: 'space-between', paddingVertical: 0 },
  yLabel: { color: COLORS.textMuted, fontSize: 9 },
  barsContainer: { flex: 1, flexDirection: 'row', position: 'relative' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.cardBorder + '80' },
  barGroup: { justifyContent: 'flex-end', alignItems: 'center' },
  barPair: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 2 },
  barTarget: { borderRadius: 3 },
  barConsumed: { borderRadius: 3 },
  barXLabel: { color: COLORS.textMuted, fontSize: 9, marginTop: 4 },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  legendLabel: { color: COLORS.textMuted, fontSize: 11 },

  breakdownCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  kpiRow: { marginBottom: 14 },
  kpiRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  kpiRowLabel: { color: COLORS.textSecondary, fontSize: 12 },
  kpiRowValue: { fontSize: 13, fontWeight: '700' },
  kpiBarBg: { height: 6, backgroundColor: '#1E2A45', borderRadius: 3, overflow: 'hidden' },
  kpiBarFill: { height: '100%', borderRadius: 3 },
  kpiRowTarget: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },

  rankingCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  rankPosition: { fontSize: 16, width: 30, textAlign: 'center' },
  gold: { color: '#FFD700' },
  silver: { color: '#C0C0C0' },
  bronze: { color: '#CD7F32' },
  rankDefault: { color: COLORS.textMuted, fontSize: 12 },
  rankName: { color: COLORS.text, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  rankBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankBarBg: { height: 6, backgroundColor: '#1E2A45', borderRadius: 3, overflow: 'hidden' },
  rankBarFill: { height: '100%', borderRadius: 3 },
  rankScore: { fontSize: 12, fontWeight: '700', width: 40, textAlign: 'right' },
  rankConsumption: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  rankVsTarget: { fontSize: 10, marginTop: 2 },

  exportSection: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  exportTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  exportBtns: { flexDirection: 'row', gap: 10 },
  exportBtn: {
    flex: 1,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  exportBtnIcon: { fontSize: 22 },
  exportBtnText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
});
