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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '@env';
import { useContext } from "react";
import { PassengerContext } from "./PassengerContext";

const SignIn = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const { setPassenger } = useContext(PassengerContext);

  // Test connection to backend when component mounts
  React.useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('checking');
      console.log(`Testing connection to: ${API_URL}`);
      
      // Try to connect to the health endpoint
      const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
      console.log('Connection test successful:', response.data);
      setConnectionStatus('connected');
      return true;
    } catch (error) {
      console.log('Connection test failed:', error.message);
      if (error.response) {
        // The server responded with a status code outside of 2xx
        console.log('Server responded with error:', error.response.status, error.response.data);
        setConnectionStatus('error');
      } else if (error.request) {
        // The request was made but no response was received
        console.log('No response received from server');
        setConnectionStatus('disconnected');
      } else {
        // Something happened in setting up the request
        console.log('Error setting up request:', error.message);
        setConnectionStatus('error');
      }
      return false;
    }
  };

  const handleSignIn = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both username and password");
      return;
    }

    setLoading(true);
    try {
      console.log(`Attempting to sign in at: ${API_URL}/api/passengers/signin`);
      
      const res = await axios.post(`${API_URL}/api/passengers/signin`, { 
        username, 
        password 
      }, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Login API response:", res.data);
      const passengerData = res.data.passenger;
      setPassenger(passengerData);
      Alert.alert("Success", `Welcome ${passengerData.name} to Vacancia transfert`);
      navigation.navigate("Home");
    } catch (err) {
      console.log("Login error type:", err.name);
      
      if (err.response) {
        // The server responded with an error
        console.log("Server error:", err.response.status, err.response.data);
        Alert.alert("Error", err.response.data.message || "Sign in failed");
      } else if (err.request) {
        // The request was made but no response was received
        console.log("Network error - no response:", err.request);
        Alert.alert(
          "Connection Error", 
          `Cannot connect to server at ${API_URL}. Please check your network connection and server status.`
        );
      } else {
        // Something happened in setting up the request
        console.log("Request setup error:", err.message);
        Alert.alert("Error", "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const renderConnectionStatus = () => {
    if (!connectionStatus) return null;
    
    let statusText = '';
    let statusColor = '#000';
    
    switch(connectionStatus) {
      case 'checking':
        return (
          <View style={styles.connectionStatus}>
            <ActivityIndicator size="small" color="#0B80A5" />
            <Text style={[styles.statusText, {color: '#666'}]}> Checking server connection...</Text>
          </View>
        );
      case 'connected':
        statusText = 'Connected to server';
        statusColor = 'green';
        break;
      case 'disconnected':
        statusText = 'Cannot connect to server';
        statusColor = 'red';
        break;
      case 'error':
        statusText = 'Server error';
        statusColor = 'orange';
        break;
    }
    
    return (
      <View style={styles.connectionStatus}>
        <Text style={[styles.statusText, {color: statusColor}]}>{statusText}</Text>
        {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
          <TouchableOpacity style={styles.retryButton} onPress={testConnection}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
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
            
            {renderConnectionStatus()}
            
            {connectionStatus === 'disconnected' && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  Server connection failed. Make sure:
                </Text>
                <Text style={styles.errorDetail}>• Backend is running on port 5000</Text>
                <Text style={styles.errorDetail}>• Your device and server are on the same network</Text>
                <Text style={styles.errorDetail}>• API_URL is set to {API_URL}</Text>
              </View>
            )}

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

            <TouchableOpacity 
              style={[
                styles.signInButton, 
                (loading || connectionStatus === 'disconnected') && styles.disabledButton
              ]} 
              onPress={handleSignIn}
              disabled={loading || connectionStatus === 'disconnected'}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signInButtonText}>SIGN IN</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("SignUp")} style={styles.signUpContainer}>
              <Text style={styles.signUpText}>
                Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.apiUrlText}>API URL: {API_URL}</Text>
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
    marginBottom: 20,
    color: "#ffffff",
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  retryButton: {
    marginLeft: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  retryText: {
    color: '#0B80A5',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    fontWeight: '500',
    marginBottom: 5,
  },
  errorDetail: {
    color: '#333',
    marginLeft: 5,
    marginBottom: 3,
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
  disabledButton: {
    backgroundColor: "#7ab7c9",
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
  apiUrlText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 20,
  },
});

export default SignIn;
