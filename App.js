import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Home from "./components/Home";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import Profile from "./components/Profile";  // import Profile screen
import { PassengerProvider } from "./components/PassengerContext";  // <-- import the Provider, not just the context

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PassengerProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="SignIn">
          <Stack.Screen 
            name="Home" 
            component={Home} 
          />
          <Stack.Screen 
            name="SignIn" 
            component={SignIn}
            options={{
              title: "Vacancia travel",
              headerStyle: {
                backgroundColor: "#0B80A5",
              },
              headerTintColor: "#ffffff",
              headerTitleAlign: "center",
            }}
          />
          <Stack.Screen 
            name="SignUp" 
            component={SignUp}
            options={{
              title: "Vacancia travel",
              headerStyle: {
                backgroundColor: "#0B80A5",
              },
              headerTintColor: "#ffffff",
            }}
          />
          <Stack.Screen
            name="Profile"
            component={Profile}   // Add the Profile screen here
            options={{
              title: "Profile",
              headerStyle: {
                backgroundColor: "#0B80A5",
              },
              headerTintColor: "#ffffff",
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PassengerProvider>
  );
}
