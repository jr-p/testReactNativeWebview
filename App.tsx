/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const getWebViewUri = () => {
  if (__DEV__) {
    // 開発環境
    return Platform.OS === 'android' 
      ? 'http://10.0.2.2:3000'
      : 'http://localhost:3000';
  } else {
    // 本番環境
    return '';
  }
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const handleWebViewError = (error: any) => {
    console.error('WebView Error:', error);
    Alert.alert('WebView Error', 'Failed to load content');
  };

  const handleHttpError = (error: any) => {
    console.error('HTTP Error:', error);
    Alert.alert('Connection Error', 'Failed to connect to server');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <WebView
        source={{ uri: getWebViewUri() }}
        style={styles.webview}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onError={handleWebViewError}
        onHttpError={handleHttpError}
        onLoadStart={() => console.log('WebView loading started')}
        onLoadEnd={() => console.log('WebView loading ended')}
        renderError={(_errorName) => (
          <View style={styles.errorContainer}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
});

export default App;
