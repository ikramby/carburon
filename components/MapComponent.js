import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, Modal, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, UrlTile, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import io from 'socket.io-client';
import { PassengerContext } from './PassengerContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MapComponent = ({ selectedDestination }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showRideRequest, setShowRideRequest] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [destinationRoute, setDestinationRoute] = useState([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [directions, setDirections] = useState([]);
  const [routingMethod, setRoutingMethod] = useState('unknown');
  const [routingError, setRoutingError] = useState(null);
  const { passenger } = useContext(PassengerContext);
  const locationSubscription = useRef(null);
  const socketRef = useRef(null);
  const mapRef = useRef(null);
  
  const [mapRegion, setMapRegion] = useState({
    latitude: 36.8065, // Default to Tunis, Tunisia
    longitude: 10.1815,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Update map region when location changes
  useEffect(() => {
    if (location) {
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005, // Closer zoom for better detail
        longitudeDelta: 0.005,
      };
      setMapRegion(newRegion);
    }
  }, [location]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  // Calculate ETA based on distance (assuming average speed of 30 km/h in city)
  const calculateETA = (distance) => {
    const averageSpeed = 30; // km/h
    const timeInHours = distance / averageSpeed;
    const timeInMinutes = Math.round(timeInHours * 60);
    return Math.max(1, timeInMinutes); // Minimum 1 minute
  };

  // IMPROVED: Enhanced coordinate validation for Tunisia
  const isValidTunisiaCoordinate = (lat, lon) => {
    return (
      typeof lat === 'number' && 
      typeof lon === 'number' && 
      lat >= -90 && lat <= 90 && 
      lon >= -180 && lon <= 180 &&
      !isNaN(lat) && !isNaN(lon) &&
      // Tunisia-specific bounds with buffer
      lat >= 30.0 && lat <= 38.0 && // Tunisia latitude range with buffer
      lon >= 7.0 && lon <= 12.0      // Tunisia longitude range with buffer
    );
  };

  // NEW: Snap coordinates to nearest routable point using OpenRouteService snapping endpoint
  const snapCoordinatesToRoad = async (coordinates, apiKey, profile = 'driving-car') => {
    try {
      const url = `https://api.openrouteservice.org/v2/snap/${profile}/json`;
      
      const requestBody = {
        locations: coordinates.map(coord => [coord.longitude, coord.latitude]),
        radius: 1000, // 1km search radius for snapping
        id: `snap_${Date.now()}`
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': apiKey,
          'User-Agent': 'TunisiaRideApp/1.0',
        },
        body: JSON.stringify(requestBody),
        timeout: 10000,
      });

      if (response.ok) {
        const data = await response.json();
        
        // Process snapped locations
        const snappedCoordinates = data.locations.map((location, index) => {
          if (location && location.location) {
            return {
              latitude: location.location[1],
              longitude: location.location[0],
              snapped: true,
              snappedDistance: location.snapped_distance,
              name: location.name || 'Unknown location'
            };
          } else {
            // Return original coordinate if snapping failed
            return {
              latitude: coordinates[index].latitude,
              longitude: coordinates[index].longitude,
              snapped: false,
              snappedDistance: null,
              name: 'Original coordinate (not snapped)'
            };
          }
        });

        return {
          success: true,
          coordinates: snappedCoordinates,
          allSnapped: snappedCoordinates.every(coord => coord.snapped)
        };
      } else {
        console.error('Snapping API error:', response.status, await response.text());
        return {
          success: false,
          coordinates: coordinates.map(coord => ({ ...coord, snapped: false })),
          allSnapped: false
        };
      }
    } catch (error) {
      console.error('Snapping request failed:', error);
      return {
        success: false,
        coordinates: coordinates.map(coord => ({ ...coord, snapped: false })),
        allSnapped: false
      };
    }
  };

  // IMPROVED: Enhanced fallback route generation with better road simulation
  const getEnhancedFallbackRoute = (startLat, startLon, endLat, endLon) => {
    console.log('Generating enhanced fallback route for Tunisia region...');
    
    const points = [];
    
    // Calculate distance and bearing
    const distance = Math.sqrt(Math.pow(endLat - startLat, 2) + Math.pow(endLon - startLon, 2));
    const bearing = Math.atan2(endLon - startLon, endLat - startLat);
    
    // Determine if we're in urban Tunisia (Tunis area)
    const isUrbanTunis = (startLat > 36.7 && startLat < 36.9 && startLon > 10.1 && startLon < 10.3) ||
                         (endLat > 36.7 && endLat < 36.9 && endLon > 10.1 && endLon < 10.3);
    
    // Determine if we're in coastal area
    const isCoastal = (startLat > 35.0 && startLon > 10.0) || (endLat > 35.0 && endLon > 10.0);
    
    // Create waypoints based on terrain type
    const numWaypoints = Math.max(5, Math.floor(distance * 200)); // More waypoints for smoother routes
    const waypoints = [];
    
    // Generate intermediate waypoints with terrain-aware variations
    for (let i = 0; i <= numWaypoints; i++) {
      const ratio = i / numWaypoints;
      let lat = startLat + (endLat - startLat) * ratio;
      let lon = startLon + (endLon - startLon) * ratio;
      
      // Add realistic road variations based on terrain
      if (i > 0 && i < numWaypoints) {
        let curveFactor;
        let turnFrequency;
        
        if (isUrbanTunis) {
          // Urban areas: frequent small turns, grid-like patterns
          curveFactor = 0.0008;
          turnFrequency = 3;
        } else if (isCoastal) {
          // Coastal areas: moderate curves following coastline
          curveFactor = 0.0015;
          turnFrequency = 4;
        } else {
          // Inland/rural areas: larger curves, less frequent turns
          curveFactor = 0.002;
          turnFrequency = 5;
        }
        
        // Create natural S-curves
        const curvePhase = ratio * Math.PI * 2;
        const curveOffset = Math.sin(curvePhase) * curveFactor;
        const perpendicularBearing = bearing + Math.PI / 2;
        
        lat += Math.cos(perpendicularBearing) * curveOffset;
        lon += Math.sin(perpendicularBearing) * curveOffset;
        
        // Add road-like turns
        if (i % turnFrequency === 0) {
          const turnIntensity = isUrbanTunis ? 0.0005 : 0.001;
          const turnOffset = Math.sin(ratio * Math.PI * (turnFrequency * 2)) * turnIntensity;
          const turnBearing = bearing + (Math.random() - 0.5) * Math.PI / 2;
          
          lat += Math.cos(turnBearing) * turnOffset;
          lon += Math.sin(turnBearing) * turnOffset;
        }
        
        // Add elevation-based variations (simulate mountain roads in western Tunisia)
        if (!isCoastal && !isUrbanTunis) {
          const elevationVariation = Math.sin(ratio * Math.PI * 3) * 0.0005;
          lat += elevationVariation;
        }
      }
      
      waypoints.push({ lat, lon });
    }
    
    // Generate smooth path through waypoints using Catmull-Rom spline approximation
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];
      const segmentPoints = 25; // More points per segment for smoother curves
      
      for (let j = 0; j <= segmentPoints; j++) {
        const t = j / segmentPoints;
        
        // Smooth interpolation with easing
        const easedT = t * t * (3.0 - 2.0 * t); // Smoothstep function
        
        let lat = start.lat + (end.lat - start.lat) * easedT;
        let lon = start.lon + (end.lon - start.lon) * easedT;
        
        // Add micro-variations for road realism
        if (j > 0 && j < segmentPoints) {
          const microVariation = Math.sin(t * Math.PI) * 0.00005;
          lat += microVariation * Math.cos(bearing);
          lon += microVariation * Math.sin(bearing);
        }
        
        points.push({
          latitude: lat,
          longitude: lon
        });
      }
    }
    
    console.log(`Generated enhanced Tunisia fallback route with ${points.length} points`);
    return points;
  };

  // IMPROVED: Enhanced routing function with pre-snapping and multiple strategies
  const getRoute = async (startLat, startLon, endLat, endLon) => {
    setIsLoadingRoute(true);
    setRoutingError(null);
    console.log('Starting enhanced route generation...');
    
    // Validate coordinates
    if (!isValidTunisiaCoordinate(startLat, startLon) || !isValidTunisiaCoordinate(endLat, endLon)) {
      console.error('Invalid coordinates for Tunisia:', { startLat, startLon, endLat, endLon });
      setRoutingMethod('fallback');
      setRoutingError('Invalid coordinates for Tunisia region');
      setIsLoadingRoute(false);
      return getEnhancedFallbackRoute(startLat, startLon, endLat, endLon);
    }

    const apiKey = process.env.EXPO_PUBLIC_ORS_API_KEY || '5b3ce3597851110001cf6248f0006c91241c48bbae74211bfe3590ddrrr';
    
    // Step 1: Try to snap coordinates to nearest routable points
    console.log('Attempting to snap coordinates to road network...');
    const coordinatesToSnap = [
      { latitude: startLat, longitude: startLon },
      { latitude: endLat, longitude: endLon }
    ];
    
    const snappingResult = await snapCoordinatesToRoad(coordinatesToSnap, apiKey);
    
    let routeStartLat, routeStartLon, routeEndLat, routeEndLon;
    
    if (snappingResult.success && snappingResult.allSnapped) {
      // Use snapped coordinates
      routeStartLat = snappingResult.coordinates[0].latitude;
      routeStartLon = snappingResult.coordinates[0].longitude;
      routeEndLat = snappingResult.coordinates[1].latitude;
      routeEndLon = snappingResult.coordinates[1].longitude;
      console.log('Successfully snapped coordinates to road network');
    } else {
      // Use original coordinates but log the issue
      routeStartLat = startLat;
      routeStartLon = startLon;
      routeEndLat = endLat;
      routeEndLon = endLon;
      console.log('Could not snap coordinates, using original coordinates');
    }

    // Step 2: Attempt routing with different strategies
    const routingStrategies = [
      // Strategy 1: Standard routing without radiuses parameter
      {
        name: 'standard',
        url: `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${routeStartLon},${routeStartLat}&end=${routeEndLon},${routeEndLat}&instructions=true&geometry=true`
      },
      // Strategy 2: Routing with large radiuses
      {
        name: 'large_radius',
        url: `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${routeStartLon},${routeStartLat}&end=${routeEndLon},${routeEndLat}&radiuses=5000,5000&instructions=true&geometry=true`
      },
      // Strategy 3: POST request with body (more reliable for complex requests)
      {
        name: 'post_request',
        url: `https://api.openrouteservice.org/v2/directions/driving-car/json`,
        method: 'POST',
        body: {
          coordinates: [[routeStartLon, routeStartLat], [routeEndLon, routeEndLat]],
          instructions: true,
          geometry: true,
          radiuses: [5000, 5000]
        }
      }
    ];

    for (const strategy of routingStrategies) {
      try {
        console.log(`Trying routing strategy: ${strategy.name}`);
        
        let response;
        if (strategy.method === 'POST') {
          response = await fetch(strategy.url, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': apiKey,
              'User-Agent': 'TunisiaRideApp/1.0',
            },
            body: JSON.stringify(strategy.body),
            timeout: 15000,
          });
        } else {
          response = await fetch(strategy.url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json, application/geo+json',
              'User-Agent': 'TunisiaRideApp/1.0',
            },
            timeout: 15000,
          });
        }
        
        console.log(`Strategy ${strategy.name} response status:`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const coordinates = feature.geometry.coordinates;
            const routeCoords = coordinates.map(coord => ({
              latitude: coord[1],
              longitude: coord[0]
            }));

            // Extract turn-by-turn directions
            if (feature.properties && feature.properties.segments) {
              const steps = feature.properties.segments[0].steps;
              const routeDirections = steps.map((step, index) => ({
                id: index,
                instruction: step.instruction,
                distance: step.distance,
                duration: step.duration,
                type: step.type,
                name: step.name || 'Unnamed road',
                coordinate: {
                  latitude: coordinates[step.way_points[0]][1],
                  longitude: coordinates[step.way_points[0]][0]
                }
              }));
              
              setDirections(routeDirections);
              console.log(`Extracted ${routeDirections.length} directions`);
            }
            
            console.log(`Successfully retrieved route using ${strategy.name} with ${routeCoords.length} points`);
            setRoutingMethod(strategy.name);
            setIsLoadingRoute(false);
            return routeCoords;
          }
        } else {
          const errorText = await response.text();
          console.error(`Strategy ${strategy.name} failed:`, errorText);
        }
      } catch (error) {
        console.error(`Strategy ${strategy.name} error:`, error.message);
        continue;
      }
    }
    
    // If all strategies fail, use enhanced fallback
    console.log('All routing strategies failed, using enhanced fallback');
    setRoutingMethod('fallback');
    setRoutingError('All routing strategies failed');
    const fallbackRoute = getEnhancedFallbackRoute(startLat, startLon, endLat, endLon);
    setDirections([]); // Clear directions for fallback
    setIsLoadingRoute(false);
    return fallbackRoute;
  };

  // Update destination route when selectedDestination changes
  useEffect(() => {
    const updateDestinationRoute = async () => {
      if (selectedDestination && location) {
        try {
          const route = await getRoute(
            location.coords.latitude,
            location.coords.longitude,
            selectedDestination.latitude,
            selectedDestination.longitude
          );
          setDestinationRoute(route);
          
          // Update map region to show both current location and destination with better padding
          const minLat = Math.min(location.coords.latitude, selectedDestination.latitude);
          const maxLat = Math.max(location.coords.latitude, selectedDestination.latitude);
          const minLon = Math.min(location.coords.longitude, selectedDestination.longitude);
          const maxLon = Math.max(location.coords.longitude, selectedDestination.longitude);
          
          // Better padding calculation for optimal view
          const latDelta = Math.max((maxLat - minLat) * 1.8, 0.015);
          const lonDelta = Math.max((maxLon - minLon) * 1.8, 0.015);
          
          setMapRegion({
            latitude: (minLat + maxLat) / 2,
            longitude: (minLon + maxLon) / 2,
            latitudeDelta: latDelta,
            longitudeDelta: lonDelta,
          });
        } catch (error) {
          console.error('Error updating destination route:', error);
          setRoutingError(`Route update failed: ${error.message}`);
        }
      } else {
        setDestinationRoute([]);
        setRoutingMethod('none');
        setRoutingError(null);
      }
    };

    updateDestinationRoute();
  }, [selectedDestination, location]);

  // Initialize location services
  const initializeLocationServices = async () => {
    try {
      setIsLoadingLocation(true);
      setErrorMsg(null);

      console.log('Initializing location services...');

      // Check if location services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync();
      setIsLocationEnabled(isEnabled);
      
      if (!isEnabled) {
        setErrorMsg('Location services are disabled. Please enable them in your device settings.');
        setIsLoadingLocation(false);
        return;
      }

      console.log('Location services are enabled');

      // Request permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setIsLoadingLocation(false);
        return;
      }

      console.log('Location permission granted');

      // Get current location with highest accuracy and longer timeout
      console.log('Getting current location with high accuracy...');
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation, // Use highest accuracy
        maximumAge: 5000, // Use cached location if less than 5 seconds old
        timeout: 30000, // 30 second timeout for better accuracy
      });

      console.log('Location obtained:', {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
        timestamp: new Date(currentLocation.timestamp).toLocaleString()
      });

      // Validate location accuracy
      if (currentLocation.coords.accuracy > 100) {
        console.warn('Location accuracy is poor:', currentLocation.coords.accuracy, 'meters');
        setErrorMsg('Poor GPS signal. Please move to an open area for better accuracy.');
      } else if (currentLocation.coords.accuracy > 50) {
        console.warn('Location accuracy is moderate:', currentLocation.coords.accuracy, 'meters');
      } else {
        console.log('Location accuracy is good:', currentLocation.coords.accuracy, 'meters');
      }

      setLocation(currentLocation);
      setLocationAccuracy(currentLocation.coords.accuracy);
      
      // Update map region to user's location with appropriate zoom
      const newRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.005, // Closer zoom for better detail
        longitudeDelta: 0.005,
      };
      setMapRegion(newRegion);

      console.log('Map region updated to user location');

      // Start watching location changes with high accuracy
      await startLocationTracking();
      
      setIsLoadingLocation(false);
      console.log('Location services initialized successfully');
    } catch (error) {
      console.error('Error initializing location services:', error);
      setErrorMsg(`Failed to get location: ${error.message}`);
      setIsLoadingLocation(false);
    }
  };

  // Start continuous location tracking
  const startLocationTracking = async () => {
    try {
      // Stop any existing subscription
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }

      console.log('Starting location tracking with high accuracy...');
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation, // Use highest accuracy
          timeInterval: 5000, // Update every 5 seconds for more frequent updates
          distanceInterval: 5, // Update when moved 5 meters
        },
        (newLocation) => {
          console.log('Location update received:', {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy,
            timestamp: new Date(newLocation.timestamp).toLocaleString()
          });

          setLocation(newLocation);
          setLocationAccuracy(newLocation.coords.accuracy);
          
          // Update socket with new location
          if (socketRef.current && passenger?.id) {
            socketRef.current.emit('passenger-location-update', {
              passengerId: passenger.id,
              lat: newLocation.coords.latitude,
              lng: newLocation.coords.longitude,
              accuracy: newLocation.coords.accuracy,
              timestamp: Date.now()
            });
          }
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  // Initialize socket connection
  useEffect(() => {
    const initializeSocket = () => {
      try {
      // Load backend URL from environment variable
      const backendUrl = process.env.SOCKET_SERVER_URL || 'http://localhost:5000';
      
      const newSocket = io(backendUrl,{
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });
        
        socketRef.current = newSocket;

        newSocket.on('connect', () => {
          console.log('Socket connected');
          if (passenger?.id) {
            newSocket.emit('register-passenger', passenger.id);
          }
        });

        newSocket.on('nearby-drivers', (drivers) => {
          setNearbyDrivers(drivers);
        });

        newSocket.on('ride-request-accepted', (ride) => {
          Alert.alert('Ride Accepted', `Driver ${ride.driverId} accepted your ride!`);
          setSelectedDriver(ride.driverId);
          setShowRideRequest(false);
        });

        newSocket.on('ride-request-declined', (driverId) => {
          Alert.alert('Ride Declined', `Driver ${driverId} declined your ride.`);
          // Optionally, try next driver or inform user
        });

        newSocket.on('disconnect', () => {
          console.log('Socket disconnected');
        });

        newSocket.on('connect_error', (err) => {
          console.error('Socket connection error:', err.message);
        });

      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [passenger]);

  // Initialize location services on component mount
  useEffect(() => {
    initializeLocationServices();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const requestRide = (driverId) => {
    if (socketRef.current && passenger?.id && location && selectedDestination) {
      socketRef.current.emit('request-ride', {
        passengerId: passenger.id,
        driverId: driverId,
        pickupLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        destination: selectedDestination,
        // Add other ride details as needed
      });
      setShowRideRequest(true);
    } else {
      Alert.alert('Error', 'Cannot request ride. Please ensure location and destination are set, and you are connected.');
    }
  };

  // NEW: Add routing status indicator to the UI
  const renderRoutingStatus = () => {
    if (isLoadingRoute) {
      return (
        <View style={styles.routingStatus}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.routingStatusText}>Finding route...</Text>
        </View>
      );
    }
    
    if (routingError) {
      return (
        <View style={[styles.routingStatus, styles.routingError]}>
          <Ionicons name="warning" size={16} color="#FF3B30" />
          <Text style={styles.routingErrorText}>Using approximate route</Text>
        </View>
      );
    }
    
    if (routingMethod && routingMethod !== 'none') {
      const statusText = routingMethod === 'fallback' ? 'Approximate route' : 'Optimized route';
      return (
        <View style={styles.routingStatus}>
          <Ionicons name="checkmark-circle" size={16} color="#34C759" />
          <Text style={styles.routingStatusText}>{statusText}</Text>
        </View>
      );
    }
    
    return null;
  };

  // Function to force refresh current location
  const refreshCurrentLocation = async () => {
    try {
      console.log('Forcing location refresh...');
      setIsLoadingLocation(true);
      
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        maximumAge: 0, // Don't use cached location
        timeout: 30000,
      });

      console.log('Location refreshed:', {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
        timestamp: new Date(currentLocation.timestamp).toLocaleString()
      });

      setLocation(currentLocation);
      setLocationAccuracy(currentLocation.coords.accuracy);
      
      // Update map region to new location
      const newRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setMapRegion(newRegion);
      
      setIsLoadingLocation(false);
    } catch (error) {
      console.error('Error refreshing location:', error);
      setIsLoadingLocation(false);
      Alert.alert('Location Error', 'Failed to refresh location. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={mapRegion}
        showsUserLocation={true}
        followsUserLocation={true}
        loadingEnabled={true}
        loadingIndicatorColor="#666"
        loadingBackgroundColor="#eee"
        onRegionChangeComplete={setMapRegion}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
            description={`Accuracy: ${locationAccuracy ? locationAccuracy.toFixed(2) : 'N/A'}m`}
          />
        )}

        {selectedDestination && (
          <Marker
            coordinate={selectedDestination}
            title="Destination"
            pinColor="blue"
          />
        )}

        {destinationRoute.length > 0 && (
          <Polyline
            coordinates={destinationRoute}
            strokeWidth={4}
            strokeColor="#007AFF"
          />
        )}

        {nearbyDrivers.map((driver) => (
          <Marker
            key={driver.id}
            coordinate={{
              latitude: driver.lat,
              longitude: driver.lng,
            }}
            title={driver.id}
            pinColor="green"
            onPress={() => setSelectedDriver(driver)}
          />
        ))}
      </MapView>

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => {
            setMapRegion(prev => ({
              ...prev,
              latitudeDelta: prev.latitudeDelta * 0.5,
              longitudeDelta: prev.longitudeDelta * 0.5,
            }));
          }}
        >
          <Ionicons name="add" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => {
            setMapRegion(prev => ({
              ...prev,
              latitudeDelta: prev.latitudeDelta * 2,
              longitudeDelta: prev.longitudeDelta * 2,
            }));
          }}
        >
          <Ionicons name="remove" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Location Refresh Button */}
      <TouchableOpacity
        style={styles.locationRefreshButton}
        onPress={refreshCurrentLocation}
        disabled={isLoadingLocation}
      >
        {isLoadingLocation ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="locate" size={24} color="#fff" />
        )}
      </TouchableOpacity>

      {/* Enhanced Routing Status */}
      <View style={styles.routingStatusContainer}>
        {renderRoutingStatus()}
      </View>

      {/* Location Accuracy Indicator */}
      {location && (
        <View style={styles.locationAccuracyContainer}>
          <View style={styles.locationAccuracyContent}>
            <Ionicons 
              name="location" 
              size={16} 
              color={locationAccuracy && locationAccuracy < 10 ? "#34C759" : locationAccuracy && locationAccuracy < 50 ? "#FF9500" : "#FF3B30"} 
            />
            <Text style={styles.locationAccuracyText}>
              {locationAccuracy ? `${locationAccuracy.toFixed(1)}m` : 'Unknown'} accuracy
            </Text>
            {isLoadingLocation && (
              <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 8 }} />
            )}
          </View>
        </View>
      )}

      {selectedDriver && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedDriver}
          onRequestClose={() => setSelectedDriver(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Driver Selected: {selectedDriver.id}</Text>
              <Text>ETA: {calculateETA(calculateDistance(location.coords.latitude, location.coords.longitude, selectedDriver.lat, selectedDriver.lng))} minutes</Text>
              <TouchableOpacity
                style={styles.requestRideButton}
                onPress={() => requestRide(selectedDriver.id)}
              >
                <Text style={styles.requestRideButtonText}>Request Ride</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedDriver(null)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {showRideRequest && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showRideRequest}
          onRequestClose={() => setShowRideRequest(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Ride Request Sent!</Text>
              <Text>Waiting for driver to accept...</Text>
              <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowRideRequest(false)}
              >
                <Text style={styles.closeButtonText}>Cancel Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  requestRideButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  requestRideButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
  },
  closeButtonText: {
    color: '#007AFF',
  },
  zoomControls: {
    position: 'absolute',
    right: 20,
    bottom: 260,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  zoomButton: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  locationRefreshButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routingStatusContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 200,
    backgroundColor: 'transparent',
  },
  routingStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routingError: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  routingStatusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  routingErrorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  locationAccuracyContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationAccuracyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationAccuracyText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default MapComponent;