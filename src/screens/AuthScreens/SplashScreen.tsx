import React from 'react';
import { View, StyleSheet, Image, StatusBar } from 'react-native';
import { Loader } from '../../components/common';
import { useTheme } from '../../contexts/ThemeContext';

const SplashScreen = () => {
  const { isDark } = useTheme();
  const bg = isDark ? '#0f172a' : '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <Image
        source={require('../../assets/logo.png')}
        style={[styles.logo, isDark && { opacity: 0.9 }]}
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
