import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PassengerContext } from "./PassengerContext";
import { useNavigation } from "@react-navigation/native";

const { width: screenWidth } = Dimensions.get('window');

export default function Profile() {
  const { passenger, setPassenger } = useContext(PassengerContext);
  const navigation = useNavigation();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [userInfo, setUserInfo] = useState({
    name: "",
    username: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    agency: "",
  });

  useEffect(() => {
    if (passenger) {
      setUserInfo({
        name: passenger.name || "",
        username: passenger.username || "",
        phone: passenger.phone || "",
        agency: passenger.agency || "",
        currentPassword: passenger.password || "",
        newPassword: "",
      });
    }
  }, [passenger]);

  const handleUpdate = async () => {
    try {
      // Basic validation
      if (!userInfo.name.trim() || !userInfo.username.trim()) {
        Alert.alert("Validation Error", "Name and username are required.");
        return;
      }

      // Clone the user info
      const updatedData = { ...userInfo };

      // If newPassword is filled, set it as the new password
      if (userInfo.newPassword.trim() !== "") {
        if (userInfo.newPassword.length < 6) {
          Alert.alert("Validation Error", "New password must be at least 6 characters long.");
          return;
        }
        updatedData.password = userInfo.newPassword;
      }

      // Remove newPassword field before sending to backend
      delete updatedData.newPassword;
      delete updatedData.currentPassword;

      // For now, just update the context (since we don't have a real backend connection)
      setPassenger({ ...passenger, ...updatedData });
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
      
      // Clear new password field
      setUserInfo({ ...userInfo, newPassword: "" });
    } catch (error) {
      Alert.alert("Error", error.message || "Something went wrong");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            setPassenger(null);
            navigation.replace("SignIn");
          }
        }
      ]
    );
  };

  const toggleEdit = () => {
    if (isEditing) {
      // Reset to original values if canceling edit
      setUserInfo({
        name: passenger?.name || "",
        username: passenger?.username || "",
        phone: passenger?.phone || "",
        agency: passenger?.agency || "",
        currentPassword: passenger?.password || "",
        newPassword: "",
      });
    }
    setIsEditing(!isEditing);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B80A5" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Profile</Text>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={toggleEdit}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isEditing ? "close" : "create"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color="#0B80A5" />
          </View>
          <Text style={styles.welcomeText}>
            Welcome, {passenger?.name || 'User'}!
          </Text>
        </View>

        {/* Profile Information */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={userInfo.name}
                onChangeText={(text) => setUserInfo({ ...userInfo, name: text })}
                placeholder="Enter your full name"
                editable={isEditing}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="at-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={userInfo.username}
                onChangeText={(text) => setUserInfo({ ...userInfo, username: text })}
                placeholder="Enter your username"
                editable={isEditing}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={userInfo.phone}
                onChangeText={(text) => setUserInfo({ ...userInfo, phone: text })}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                editable={isEditing}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Agency</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={userInfo.agency}
                onChangeText={(text) => setUserInfo({ ...userInfo, agency: text })}
                placeholder="Enter your agency"
                editable={isEditing}
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Password Section - Only show when editing */}
        {isEditing && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Security</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.passwordContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.passwordInput}
                  value={userInfo.currentPassword}
                  onChangeText={(text) =>
                    setUserInfo({
                      ...userInfo,
                      currentPassword: text,
                    })
                  }
                  placeholder="Enter current password"
                  secureTextEntry={!showCurrentPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={styles.passwordToggle}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={showCurrentPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password (Optional)</Text>
              <View style={styles.passwordContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.passwordInput}
                  value={userInfo.newPassword}
                  onChangeText={(text) =>
                    setUserInfo({ ...userInfo, newPassword: text })
                  }
                  placeholder="Enter new password"
                  secureTextEntry={!showNewPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.passwordToggle}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={showNewPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {isEditing ? (
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleUpdate}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Vacancia Travel v1.0.0</Text>
          <Text style={styles.appInfoSubtext}>Your trusted travel companion</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0B80A5",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  editButton: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  inputIcon: {
    marginLeft: 15,
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  inputDisabled: {
    backgroundColor: "#f9f9f9",
    color: "#666",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  passwordToggle: {
    padding: 15,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: "#0B80A5",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#FBAC3F",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 8,
  },
  appInfo: {
    alignItems: "center",
    marginTop: 20,
  },
  appInfoText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  appInfoSubtext: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
});

