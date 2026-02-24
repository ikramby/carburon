// src/screens/RoutesScreen.tsx
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
import { routes, vehicles, Route } from '../data/mockData';

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

const RouteMap = ({ route }: { route: Route }) => {
  const stops = [route.from, ...Array.from({ length: route.stops - 2 }, (_, i) => `Arrêt ${i + 1}`), route.to];
  return (
    <View style={styles.routeMap}>
      {stops.map((stop, i) => (
        <View key={i} style={styles.stopRow}>
          <View style={styles.stopLine}>
            <View style={[styles.stopDot, i === 0 || i === stops.length - 1 ? styles.stopDotMain : styles.stopDotSub]} />
            {i < stops.length - 1 && <View style={styles.stopConnector} />}
          </View>
          <Text style={[styles.stopLabel, i === 0 || i === stops.length - 1 ? styles.stopLabelMain : styles.stopLabelSub]}>
            {stop}
          </Text>
        </View>
      ))}
    </View>
  );
};

const SavingBar = ({ saving }: { saving: number }) => (
  <View style={styles.savingContainer}>
    <View style={styles.savingBg}>
      <View style={[styles.savingFill, { width: `${saving}%` as any }]} />
    </View>
    <Text style={styles.savingPct}>-{saving}% ⛽</Text>
  </View>
);

export default function RoutesScreen() {
  const [selected, setSelected] = useState<Route | null>(null);

  const optimizedCount = routes.filter(r => r.optimized).length;
  const totalSaving = routes.filter(r => r.optimized).reduce((s, r) => s + r.fuel_saving, 0) / optimizedCount;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Optimisation des Itinéraires</Text>
        <Text style={styles.headerSub}>{routes.length} lignes • {optimizedCount} optimisées</Text>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{optimizedCount}/{routes.length}</Text>
          <Text style={styles.summaryLabel}>Lignes optimisées</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.accent2 }]}>
            -{totalSaving.toFixed(0)}%
          </Text>
          <Text style={styles.summaryLabel}>Économie moy. carburant</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{routes.reduce((s, r) => s + r.daily_trips, 0)}</Text>
          <Text style={styles.summaryLabel}>Trajets/jour</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Not optimized alert */}
        {routes.filter(r => !r.optimized).length > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertBannerIcon}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertBannerTitle}>
                {routes.filter(r => !r.optimized).length} ligne(s) non optimisée(s)
              </Text>
              <Text style={styles.alertBannerText}>
                L'optimisation peut réduire la consommation jusqu'à 25%
              </Text>
            </View>
            <TouchableOpacity style={styles.alertBannerBtn}>
              <Text style={styles.alertBannerBtnText}>Optimiser</Text>
            </TouchableOpacity>
          </View>
        )}

        {routes.map(route => (
          <TouchableOpacity
            key={route.id}
            style={styles.routeCard}
            onPress={() => setSelected(route)}
            activeOpacity={0.8}
          >
            <View style={styles.routeCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.routeName}>{route.name}</Text>
                <Text style={styles.routeMeta}>
                  {route.distance} km • {route.duration} min • {route.stops} arrêts
                </Text>
              </View>
              {route.optimized ? (
                <View style={styles.optimizedBadge}>
                  <Text style={styles.optimizedBadgeText}>✓ Optimisée</Text>
                </View>
              ) : (
                <View style={styles.notOptimizedBadge}>
                  <Text style={styles.notOptimizedBadgeText}>⚡ À optimiser</Text>
                </View>
              )}
            </View>

            <View style={styles.routeRoute}>
              <View style={styles.routePoint}>
                <View style={[styles.routePointDot, { backgroundColor: COLORS.accent2 }]} />
                <Text style={styles.routePointText}>{route.from}</Text>
              </View>
              <View style={styles.routeArrow}>
                <View style={styles.routeLine} />
                <Text style={styles.routeArrowIcon}>›</Text>
              </View>
              <View style={styles.routePoint}>
                <View style={[styles.routePointDot, { backgroundColor: COLORS.accent }]} />
                <Text style={styles.routePointText}>{route.to}</Text>
              </View>
            </View>

            {route.optimized && (
              <View style={styles.savingRow}>
                <Text style={styles.savingLabel}>Économie carburant</Text>
                <SavingBar saving={route.fuel_saving} />
              </View>
            )}

            <View style={styles.routeStats}>
              <View style={styles.routeStat}>
                <Text style={styles.routeStatValue}>{route.daily_trips}</Text>
                <Text style={styles.routeStatLabel}>trajets/jour</Text>
              </View>
              <View style={styles.routeStat}>
                <Text style={styles.routeStatValue}>{route.vehicles_assigned.length}</Text>
                <Text style={styles.routeStatLabel}>véhicule(s)</Text>
              </View>
              <View style={styles.routeStat}>
                <Text style={styles.routeStatValue}>{route.passengers_capacity}</Text>
                <Text style={styles.routeStatLabel}>places total</Text>
              </View>
              <View style={styles.routeStat}>
                <Text style={[styles.routeStatValue, route.optimized ? { color: COLORS.accent2 } : { color: COLORS.textMuted }]}>
                  {route.optimized ? `-${route.fuel_saving}%` : '--'}
                </Text>
                <Text style={styles.routeStatLabel}>éco. carburant</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Optimization Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsSectionTitle}>💡 Conseils d'optimisation</Text>
          {[
            { icon: '🚦', tip: 'Éviter les axes saturés aux heures de pointe (07h-09h, 17h-19h)' },
            { icon: '🌡️', tip: 'Réduire la climatisation de 5°C peut économiser jusqu\'à 8% de carburant' },
            { icon: '👥', tip: 'Consolider les trajets à faible taux de remplissage (<30% de capacité)' },
            { icon: '⚡', tip: 'Maintenir une vitesse constante entre 50-70 km/h en zone urbaine' },
          ].map((item, i) => (
            <View key={i} style={styles.tipCard}>
              <Text style={styles.tipIcon}>{item.icon}</Text>
              <Text style={styles.tipText}>{item.tip}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Route Detail Modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setSelected(null)} activeOpacity={1}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            {selected && (
              <ScrollView>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>{selected.name}</Text>

                <RouteMap route={selected} />

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Horaires de départ</Text>
                  <View style={styles.timesGrid}>
                    {selected.departure_times.map((time, i) => (
                      <View key={i} style={styles.timeChip}>
                        <Text style={styles.timeText}>{time}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Véhicules assignés</Text>
                  {selected.vehicles_assigned.map(vId => {
                    const v = vehicles.find(v => v.id === vId);
                    if (!v) return null;
                    return (
                      <View key={vId} style={styles.assignedVehicle}>
                        <Text style={styles.assignedVehicleName}>{v.name}</Text>
                        <Text style={styles.assignedVehiclePlate}>{v.plate}</Text>
                      </View>
                    );
                  })}
                </View>

                {!selected.optimized && (
                  <TouchableOpacity style={styles.optimizeBtn}>
                    <Text style={styles.optimizeBtnText}>⚡ Optimiser cet itinéraire</Text>
                  </TouchableOpacity>
                )}
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
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingVertical: 14,
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  summaryLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' },
  summaryDivider: { width: 1, backgroundColor: COLORS.cardBorder },
  scroll: { paddingHorizontal: 16, paddingTop: 12 },

  alertBanner: {
    backgroundColor: '#00D4FF0A',
    borderWidth: 1,
    borderColor: '#00D4FF25',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  alertBannerIcon: { fontSize: 22 },
  alertBannerTitle: { color: COLORS.accent, fontSize: 13, fontWeight: '700' },
  alertBannerText: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  alertBannerBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  alertBannerBtnText: { color: COLORS.bg, fontSize: 12, fontWeight: '700' },

  routeCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  routeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  routeName: { color: COLORS.text, fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  routeMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 3 },
  optimizedBadge: {
    backgroundColor: '#00FF8820',
    borderWidth: 1,
    borderColor: '#00FF8850',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  optimizedBadgeText: { color: COLORS.accent2, fontSize: 11, fontWeight: '700' },
  notOptimizedBadge: {
    backgroundColor: '#FFB80020',
    borderWidth: 1,
    borderColor: '#FFB80050',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  notOptimizedBadgeText: { color: COLORS.warning, fontSize: 11, fontWeight: '700' },

  routeRoute: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routePointDot: { width: 8, height: 8, borderRadius: 4 },
  routePointText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  routeArrow: { flex: 1, flexDirection: 'row', alignItems: 'center', marginHorizontal: 6 },
  routeLine: { flex: 1, height: 1, backgroundColor: COLORS.cardBorder },
  routeArrowIcon: { color: COLORS.textMuted, fontSize: 16 },

  savingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  savingLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', width: 110 },
  savingContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  savingBg: { flex: 1, height: 6, backgroundColor: '#1E2A45', borderRadius: 3, overflow: 'hidden' },
  savingFill: { height: '100%', backgroundColor: COLORS.accent2, borderRadius: 3 },
  savingPct: { color: COLORS.accent2, fontSize: 11, fontWeight: '700', width: 50 },

  routeStats: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  routeStat: { alignItems: 'center' },
  routeStatValue: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  routeStatLabel: { color: COLORS.textMuted, fontSize: 9, marginTop: 2, textAlign: 'center' },

  tipsSection: { marginTop: 4 },
  tipsSectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  tipCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  tipIcon: { fontSize: 18, width: 24 },
  tipText: { color: COLORS.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#0F1829',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: COLORS.cardBorder,
    maxHeight: '85%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.cardBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginBottom: 16 },
  routeMap: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 16 },
  stopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  stopLine: { width: 20, alignItems: 'center' },
  stopDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  stopDotMain: { backgroundColor: COLORS.accent, width: 12, height: 12, borderRadius: 6 },
  stopDotSub: { backgroundColor: COLORS.textMuted, width: 6, height: 6, borderRadius: 3 },
  stopConnector: { width: 2, height: 20, backgroundColor: COLORS.cardBorder },
  stopLabel: { flex: 1, paddingLeft: 8, paddingBottom: 10 },
  stopLabelMain: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  stopLabelSub: { color: COLORS.textMuted, fontSize: 12 },
  modalSection: { marginBottom: 16 },
  modalSectionTitle: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { backgroundColor: COLORS.cardBorder, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  timeText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  assignedVehicle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  assignedVehicleName: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  assignedVehiclePlate: { color: COLORS.textMuted, fontSize: 12 },
  optimizeBtn: {
    backgroundColor: COLORS.warning,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  optimizeBtnText: { color: '#000', fontSize: 14, fontWeight: '700' },
});
