import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RateUs() {
  const [rating, setRating] = useState(0);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rate Your Ride</Text>
      <Text style={styles.subtitle}>How was your experience?</Text>
      
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Ionicons 
              name={star <= rating ? "star" : "star-outline"} 
              size={40} 
              color="#FBAC3F" 
            />
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity style={styles.submitButton}>
        <Text style={styles.submitButtonText}>Submit Rating</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 30,
  },
  submitButton: {
    backgroundColor: "#0B80A5",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});