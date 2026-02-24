import React, { useState, useEffect, useContext } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  TextInput,
  Dimensions,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Keyboard,
  FlatList
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import MapComponent from "./MapComponent";
import { PassengerContext } from "./PassengerContext";
import axios from 'axios';
import * as Location from 'expo-location';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function Home() {
  const navigation = useNavigation();
  const { passenger } = useContext(PassengerContext);
  const [peopleCount, setPeopleCount] = useState(1);
  const [destination, setDestination] = useState("");
  const [isSearchingDriver, setIsSearchingDriver] = useState(false);
  const [mapHeight, setMapHeight] = useState(screenHeight * 0.4);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  // New state for location search
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Keyboard handling for better UX
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        // Reduce map height when keyboard is visible to show search results
        setMapHeight(screenHeight * 0.25);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setMapHeight(screenHeight * 0.4);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Get current location on component mount
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required for better search results.');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCurrentLocation(location);
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    getCurrentLocation();
  }, []);

  // Enhanced geocoding function with proximity-based sorting
  const searchLocation = async (query) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    
    try {
      // Enhanced search URL with better parameters for proximity
      let searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&extratags=1`;
      
      // Add viewbox for proximity search if current location is available
      if (currentLocation) {
        const lat = currentLocation.coords.latitude;
        const lon = currentLocation.coords.longitude;
        // Create a bounding box around user location (roughly 50km radius)
        const delta = 0.5; // approximately 50km
        const viewbox = `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`;
        searchUrl += `&viewbox=${viewbox}&bounded=1`;
      }
      
      const response = await axios.get(searchUrl, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'VacanciaApp/1.0'
        }
      });
      
      if (response.data && response.data.length > 0) {
        const formattedResults = response.data.map((item, index) => ({
          id: `${item.place_id}_${index}`,
          place_id: item.place_id,
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type,
          address_components: item.address || {},
          distance: currentLocation ? calculateDistance(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude,
            parseFloat(item.lat),
            parseFloat(item.lon)
          ) : 999999 // Large number for items without location
        }));

        // Sort results by distance (proximity-based sorting)
        formattedResults.sort((a, b) => a.distance - b.distance);
        
        setSearchResults(formattedResults);
        setShowSearchResults(formattedResults.length > 0);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      Alert.alert('Search Error', 'Unable to search for locations. Please try again.');
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

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
    return R * c; // Distance in kilometers
  };

  // Handle destination input change with improved debouncing
  const handleDestinationChange = (text) => {
    setDestination(text);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for search with shorter delay for better responsiveness
    const newTimeout = setTimeout(() => {
      searchLocation(text);
    }, 300);
    
    setSearchTimeout(newTimeout);
  };

  // Handle search result selection
  const handleSearchResultSelect = (result) => {
    setDestination(result.display_name);
    setSelectedDestination({
      latitude: result.lat,
      longitude: result.lon,
      address: result.display_name
    });
    setShowSearchResults(false);
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const increasePeople = () => {
    if (peopleCount < 6) {
      setPeopleCount(peopleCount + 1);
    }
  };

  const decreasePeople = () => {
    if (peopleCount > 1) {
      setPeopleCount(peopleCount - 1);
    }
  };

  const handleFindDriver = async () => {
    if (!destination.trim()) {
      Alert.alert("Destination Required", "Please enter your destination before searching for a driver.");
      return;
    }

    if (!selectedDestination) {
      Alert.alert("Please Select Destination", "Please select a destination from the search results.");
      return;
    }

    setIsSearchingDriver(true);
    
    // Simulate driver search
    setTimeout(() => {
      setIsSearchingDriver(false);
      Alert.alert(
        "Drivers Found", 
        `Found ${Math.floor(Math.random() * 5) + 1} available drivers near you!`,
        [
          {
            text: "View on Map",
            onPress: () => {
              console.log("Focusing on map with drivers and destination:", selectedDestination);
            }
          },
          { text: "OK" }
        ]
      );
    }, 2000);
  };

  const clearDestination = () => {
    setDestination("");
    setSelectedDestination(null);
    setSearchResults([]);
    setShowSearchResults(false);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  };

  const handleProfilePress = () => {
    navigation.navigate("Profile");
  };

  const handleRatePress = () => {
    Alert.alert("Rate Us", "Thank you for using Vacancia! Please rate us on the app store.");
  };

  // Render search result item with improved formatting and distance display
  const renderSearchResult = ({ item }) => {
    // Extract main place name and secondary info
    const addressParts = item.display_name.split(",");
    const mainName = addressParts[0];
    const secondaryInfo = addressParts.slice(1, 3).join(",").trim();
    
    return (
      <TouchableOpacity
        style={styles.searchResultItem}
        onPress={() => handleSearchResultSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.searchResultIcon}>
          <Ionicons name="location-outline" size={18} color="#0B80A5" />
        </View>
        <View style={styles.searchResultText}>
          <Text style={styles.searchResultTitle} numberOfLines={1}>
            {mainName}
          </Text>
          <Text style={styles.searchResultSubtitle} numberOfLines={1}>
            {secondaryInfo}
          </Text>
          {item.distance < 999999 && (
            <Text style={styles.searchResultDistance}>
              {item.distance.toFixed(1)} km away
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Data for FlatList - combining all sections
  const flatListData = [
    { type: 'map', id: 'map' },
    { type: 'destination', id: 'destination' },
    { type: 'config', id: 'config' },
    { type: 'button', id: 'button' },
    { type: 'info', id: 'info' }
  ];

  // Render different components based on item type
  const renderFlatListItem = ({ item }) => {
    switch (item.type) {
      case 'map':
        return (
          <View style={[styles.mapContainer, { height: mapHeight }]}>
            <MapComponent selectedDestination={selectedDestination} />
          </View>
        );
      
      case 'destination':
        return (
          <View style={styles.destinationCard}>
            <View style={styles.destinationHeader}>
              <View style={styles.destinationIconContainer}>
                <Ionicons name="navigate" size={20} color="#FBAC3F" />
              </View>
              <Text style={styles.destinationTitle}>Where to go?</Text>
            </View>
            
            <View style={styles.destinationInputContainer}>
              <TextInput
                placeholder="Enter your destination"
                style={styles.destinationInput}
                placeholderTextColor="#999"
                value={destination}
                onChangeText={handleDestinationChange}
                multiline={false}
                returnKeyType="done"
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowSearchResults(true);
                  }
                }}
              />
              {isSearching && (
                <ActivityIndicator size="small" color="#0B80A5" style={styles.searchingIndicator} />
              )}
              {destination.length > 0 && !isSearching && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={clearDestination}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <View style={styles.searchResultsContainer}>
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item) => item.id}
                  style={styles.searchResultsList}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                  maxToRenderPerBatch={5}
                  windowSize={5}
                />
              </View>
            )}
            
            {/* Quick destination suggestions */}
            {!showSearchResults && (
              <View style={styles.quickDestinations}>
                <Text style={styles.quickDestinationsTitle}>Quick destinations:</Text>
                <View style={styles.quickDestinationButtons}>
                  {["Airport", "Train Station", "Mall", "Hospital"].map((place) => (
                    <TouchableOpacity
                      key={place}
                      style={styles.quickDestinationButton}
                      onPress={() => {
                        setDestination(place);
                        searchLocation(place);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.quickDestinationText}>{place}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        );
      
      case 'config':
        return (
          <View style={styles.configCard}>
            <Text style={styles.configTitle}>Ride Configuration</Text>
            
            {/* People Counter */}
            <View style={styles.peopleCounter}>
              <View style={styles.peopleCounterLeft}>
                <Ionicons name="people" size={18} color="#0B80A5" />
                <Text style={styles.peopleText}>Passengers</Text>
              </View>
              
              <View style={styles.counterContainer}>
                <TouchableOpacity 
                  onPress={decreasePeople} 
                  style={[styles.counterButton, peopleCount <= 1 && styles.counterButtonDisabled]}
                  disabled={peopleCount <= 1}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.counterText, peopleCount <= 1 && styles.counterTextDisabled]}>-</Text>
                </TouchableOpacity>
                
                <View style={styles.countContainer}>
                  <Text style={styles.countText}>{peopleCount}</Text>
                </View>
                
                <TouchableOpacity 
                  onPress={increasePeople} 
                  style={[styles.counterButton, peopleCount >= 6 && styles.counterButtonDisabled]}
                  disabled={peopleCount >= 6}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.counterText, peopleCount >= 6 && styles.counterTextDisabled]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Estimated fare */}
            <View style={styles.fareEstimate}>
              <Text style={styles.fareLabel}>Estimated fare for {peopleCount} passenger{peopleCount > 1 ? "s" : ""}</Text>
              <Text style={styles.fareAmount}>
                {selectedDestination ? "Calculate after driver selection" : "Calculate after destination"}
              </Text>
            </View>
          </View>
        );
      
      case 'button':
        return (
          <TouchableOpacity 
            style={[styles.findDriverButton, (!destination.trim() || !selectedDestination || isSearchingDriver) && styles.findDriverButtonDisabled]} 
            onPress={handleFindDriver}
            disabled={!destination.trim() || !selectedDestination || isSearchingDriver}
            activeOpacity={0.8}
          >
            {isSearchingDriver ? (
              <View style={styles.searchingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.findDriverText}>Searching...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="car" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.findDriverText}>Find Driver</Text>
              </>
            )}
          </TouchableOpacity>
        );
      
      case 'info':
        return (
          <View style={styles.additionalInfo}>
            <Text style={styles.additionalInfoTitle}>Recent Activity</Text>
            <Text style={styles.additionalInfoText}>
              No recent trips. Start your first journey with Vacancia!
            </Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B80A5" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          <Ionicons name="person-circle" size={28} color="#0B80A5" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Vacancia</Text>
          <Text style={styles.headerSubtitle}>Travel with ease</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleRatePress}
          activeOpacity={0.7}
        >
          <FontAwesome name="star" size={24} color="#FBAC3F" />
        </TouchableOpacity>
      </View>

      {/* Main Content using FlatList to fix VirtualizedList warning */}
      <FlatList
        data={flatListData}
        renderItem={renderFlatListItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.flatListContent}
        bounces={false}
      />

      {/* Bottom Navigation */}
      {!keyboardVisible && (
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={[styles.navItem, styles.activeNavItem]} 
            onPress={() => navigation.navigate("Home")}
            activeOpacity={0.7}
          >
            <Ionicons name="home" size={20} color="#0B80A5" />
            <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => Alert.alert("Coming Soon", "Request feature coming soon!")}
            activeOpacity={0.7}
          >
            <MaterialIcons name="directions-car" size={20} color="#999" />
            <Text style={styles.navText}>Request</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.7}
          >
            <Ionicons name="person" size={20} color="#999" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 45 : 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerButton: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0B80A5",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#666",
    marginTop: 1,
  },
  flatListContent: {
    paddingBottom: 100,
  },
  mapContainer: {
    width: "100%",
    position: "relative",
  },
  destinationCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 15,
    padding: 18,
    margin: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  destinationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  destinationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  destinationTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },
  destinationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 12,
  },
  destinationInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: "#333",
  },
  searchingIndicator: {
    marginRight: 12,
  },
  clearButton: {
    padding: 12,
  },
  searchResultsContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 12,
    maxHeight: 180,
  },
  searchResultsList: {
    maxHeight: 180,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  searchResultIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  searchResultText: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 1,
  },
  searchResultSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 1,
  },
  searchResultDistance: {
    fontSize: 11,
    color: '#0B80A5',
    fontWeight: '500',
  },
  quickDestinations: {
    marginTop: 4,
  },
  quickDestinationsTitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  quickDestinationButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickDestinationButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  quickDestinationText: {
    fontSize: 11,
    color: "#666",
  },
  configCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 18,
    margin: 15,
    marginTop: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  configTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  peopleCounter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  peopleCounterLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  peopleText: {
    fontSize: 15,
    color: "#333",
    marginLeft: 6,
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  counterButton: {
    backgroundColor: "#0B80A5",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  counterButtonDisabled: {
    backgroundColor: "#ccc",
  },
  counterText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  counterTextDisabled: {
    color: "#999",
  },
  countContainer: {
    marginHorizontal: 16,
    minWidth: 25,
    alignItems: "center",
  },
  countText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  fareEstimate: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  fareLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 3,
  },
  fareAmount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0B80A5",
  },
  findDriverButton: {
    backgroundColor: "#FBAC3F",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 15,
    marginVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  findDriverButtonDisabled: {
    backgroundColor: "#ccc",
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonIcon: {
    marginRight: 6,
  },
  findDriverText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  searchingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  additionalInfo: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 14,
    margin: 15,
    marginTop: 5,
    alignItems: "center",
  },
  additionalInfoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  additionalInfoText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: "#0B80A5",
  },
  navText: {
    fontSize: 11,
    color: "#999",
    marginTop: 3,
  },
  activeNavText: {
    color: "#0B80A5",
    fontWeight: "600",
  },
});
