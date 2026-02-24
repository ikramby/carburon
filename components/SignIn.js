import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '@env'; // Change this import
import { useContext } from "react";
import { PassengerContext } from "./PassengerContext";
const SignIn = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
const { setPassenger } = useContext(PassengerContext);

const handleSignIn = async () => {
  const url = `${API_URL}/api/passengers/signin`;
  console.log("Making request to:", url);
  
  try {
    const res = await axios.post(url, { username, password });
    console.log("Login API response:", res.data);
    
    // Check if we have a successful response with passenger data
    if (res.data && res.data.passenger) {
      const passengerData = res.data.passenger;
      
      // Update the passenger context
      setPassenger(passengerData);
      
      // Show success message
      Alert.alert("Success", `Welcome ${passengerData.name} to Vacancia transfert`);
      
      // Navigate to Home screen
      console.log("Navigating to Home screen...");
      navigation.navigate("Home");
      
      // For debugging, log the navigation object
      console.log("Navigation object:", navigation);
    } else {
      // Handle case where response doesn't contain expected data
      console.log("Invalid response format:", res.data);
      Alert.alert("Error", "Invalid response from server");
    }
  } catch (err) {
    console.log("Login error:", err);
    // More detailed error logging
    if (err.response) {
      console.log("Error status:", err.response.status);
      console.log("Error data:", err.response.data);
    } else if (err.request) {
      console.log("No response received:", err.request);
    } else {
      console.log("Error setting up request:", err.message);
    }
    Alert.alert("Error", err.response?.data?.message || "Sign in failed");
  }
};
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign In</Text>

            <TextInput
              placeholder="Username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                style={[styles.input, styles.passwordInput]}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={toggleShowPassword}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
              <Text style={styles.signInButtonText}>SIGN IN</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("SignUp")} style={styles.signUpContainer}>
              <Text style={styles.signUpText}>
                Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBAC3F",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
  },
  formContainer: {
    marginTop: 80,
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    color: "#ffffff",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    color: "#333",
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  passwordInput: {
    paddingRight: 45,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  signInButton: {
    backgroundColor: "#0B80A5",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  signInButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  signUpContainer: {
    alignItems: "center",
  },
  signUpText: {
    fontSize: 14,
    color: "#ffffff",
  },
  signUpLink: {
    color: "#ffffff",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

export default SignIn;