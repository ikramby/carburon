// src/data/mockData.ts

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  type: string;
  driver: string;
  status: 'active' | 'idle' | 'maintenance';
  fuel_level: number; // 0-100%
  consumption_avg: number; // L/100km
  consumption_target: number;
  km_today: number;
  fuel_used_today: number;
  passengers_avg: number;
  last_location: string;
  efficiency_score: number; // 0-100
}

export interface Route {
  id: string;
  name: string;
  from: string;
  to: string;
  distance: number; // km
  duration: number; // minutes
  stops: number;
  optimized: boolean;
  fuel_saving: number; // % économisé vs non optimisé
  vehicles_assigned: string[];
  departure_times: string[];
  daily_trips: number;
  passengers_capacity: number;
}

export interface FuelRecord {
  date: string;
  vehicle_id: string;
  liters: number;
  cost: number;
  km: number;
  consumption: number;
}

export const vehicles: Vehicle[] = [
  {
    id: 'v1',
    name: 'Bus Express A1',
    plate: 'TN 1234-RS',
    type: 'Bus 50 places',
    driver: 'Mohamed Ben Ali',
    status: 'active',
    fuel_level: 72,
    consumption_avg: 18.5,
    consumption_target: 17.0,
    km_today: 145,
    fuel_used_today: 27.1,
    passengers_avg: 38,
    last_location: 'Avenue Habib Bourguiba',
    efficiency_score: 78,
  },
  {
    id: 'v2',
    name: 'Minibus B3',
    plate: 'TN 5678-RS',
    type: 'Minibus 25 places',
    driver: 'Karim Trabelsi',
    status: 'active',
    fuel_level: 45,
    consumption_avg: 11.2,
    consumption_target: 10.5,
    km_today: 210,
    fuel_used_today: 23.5,
    passengers_avg: 19,
    last_location: 'Bab Souika',
    efficiency_score: 85,
  },
  {
    id: 'v3',
    name: 'Bus Urbain C2',
    plate: 'TN 9012-RS',
    type: 'Bus 40 places',
    driver: 'Sami Hamdi',
    status: 'idle',
    fuel_level: 88,
    consumption_avg: 21.3,
    consumption_target: 17.0,
    km_today: 0,
    fuel_used_today: 0,
    passengers_avg: 12,
    last_location: 'Dépôt Central',
    efficiency_score: 42,
  },
  {
    id: 'v4',
    name: 'Navette D7',
    plate: 'TN 3456-RS',
    type: 'Navette 16 places',
    driver: 'Fares Mansouri',
    status: 'maintenance',
    fuel_level: 30,
    consumption_avg: 9.8,
    consumption_target: 9.0,
    km_today: 0,
    fuel_used_today: 0,
    passengers_avg: 14,
    last_location: 'Garage Nord',
    efficiency_score: 65,
  },
];

export const routes: Route[] = [
  {
    id: 'r1',
    name: 'Ligne Centre-Ville → Aéroport',
    from: 'Place de la Kasbah',
    to: 'Aéroport Tunis-Carthage',
    distance: 12.5,
    duration: 35,
    stops: 6,
    optimized: true,
    fuel_saving: 18,
    vehicles_assigned: ['v1', 'v2'],
    departure_times: ['06:00', '07:30', '09:00', '14:00', '17:00', '19:30'],
    daily_trips: 6,
    passengers_capacity: 75,
  },
  {
    id: 'r2',
    name: 'Ligne Banlieue → Centre',
    from: 'La Marsa',
    to: 'Avenue Bourguiba',
    distance: 18.2,
    duration: 50,
    stops: 10,
    optimized: true,
    fuel_saving: 22,
    vehicles_assigned: ['v1'],
    departure_times: ['05:30', '06:15', '07:00', '07:45', '16:30', '17:15', '18:00'],
    daily_trips: 7,
    passengers_capacity: 50,
  },
  {
    id: 'r3',
    name: 'Ligne Industrielle',
    from: 'Centre Ville',
    to: 'Zone Industrielle Ben Arous',
    distance: 24.0,
    duration: 65,
    stops: 5,
    optimized: false,
    fuel_saving: 0,
    vehicles_assigned: ['v3'],
    departure_times: ['06:00', '14:00', '22:00'],
    daily_trips: 3,
    passengers_capacity: 40,
  },
];

export const weeklyFuelData = [
  { day: 'Lun', consumed: 145, target: 130, savings: 0 },
  { day: 'Mar', consumed: 132, target: 130, savings: 13 },
  { day: 'Mer', consumed: 128, target: 130, savings: 17 },
  { day: 'Jeu', consumed: 141, target: 130, savings: 4 },
  { day: 'Ven', consumed: 119, target: 130, savings: 26 },
  { day: 'Sam', consumed: 95, target: 100, savings: 5 },
  { day: 'Dim', consumed: 88, target: 100, savings: 12 },
];

export const monthlyStats = {
  total_km: 24580,
  total_fuel: 3842,
  total_cost: 6734.5, // DT
  avg_consumption: 15.6,
  target_consumption: 14.0,
  savings_vs_last_month: 8.4, // %
  co2_saved: 124, // kg
  optimized_routes_pct: 68,
};
