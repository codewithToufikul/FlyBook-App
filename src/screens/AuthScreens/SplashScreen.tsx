import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Loader } from '../../components/common';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Loader
        message="Loading FlyBook..."
        size="large"
        variant="inline"
        showLogo={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 40,
  },
});

export default SplashScreen;
