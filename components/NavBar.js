import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NavBar = () => {
  return (
    <View style={styles.navBar}>
      <Text style={styles.title}>Vacancia</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    backgroundColor: '#FBAC3F',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default NavBar;