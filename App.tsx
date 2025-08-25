/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { BleManager, Device, Characteristic } from 'react-native-ble-plx';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [deviceName, setDeviceName] = useState('DNSMRA030003473');
  const [temperature, setTemperature] = useState('1');
  const [status, setStatus] = useState('待機中');
  const [bleManager] = useState(new BleManager());

  const appendStatus = (newText: string) => {
    setStatus(prev => prev + '\n' + newText);
  };

  const write16BitValueToCharacteristic = async (characteristic: Characteristic) => {
    const temperatureValue = parseInt(temperature, 10);
    const tempOffset = -30;
    const tempByte = temperatureValue - tempOffset + 1;

    const byte0 = 0x02;
    const byte1 = tempByte;

    const valueToWrite = (byte0 << 8) | byte1;

    const buffer = new ArrayBuffer(2);
    const dataView = new DataView(buffer);
    dataView.setUint16(0, valueToWrite, false);

    appendStatus('温度設定');
    appendStatus(`　→　0x${valueToWrite.toString(16).padStart(4, '0')}`);
    
    try {
      await characteristic.writeWithoutResponse(
        Buffer.from(buffer).toString('base64')
      );
      appendStatus('値の書き込みに成功');
    } catch (error: any) {
      appendStatus('');
      appendStatus(`エラー - ${error.message}`);
    }
  };

  const connectToDevice = async () => {
    try {
      setStatus('');
      appendStatus('デバイスを選択中...');

      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          return;
        }

        if (device?.name === deviceName) {
          bleManager.stopDeviceScan();
          connectToFoundDevice(device);
        }
      });

      setTimeout(() => {
        bleManager.stopDeviceScan();
        appendStatus('デバイスが見つかりませんでした');
      }, 10000);

    } catch (error: any) {
      appendStatus('');
      appendStatus(`エラー - ${error.message}`);
      console.error('Bluetooth error:', error);
    }
  };

  const connectToFoundDevice = async (device: Device) => {
    try {
      appendStatus('端末に接続');
      appendStatus(`　→　${device.name}`);
      const connectedDevice = await device.connect();

      await connectedDevice.discoverAllServicesAndCharacteristics();

      const primaryServiceUuid = '442f1570-8a00-9a28-cbe1-e1d4212d53eb';
      appendStatus('サービスを取得');
      appendStatus(`　→　${primaryServiceUuid}`);

      const characteristicUuid = '442f1572-8a00-9a28-cbe1-e1d4212d53eb';
      appendStatus('キャラクタリスティックを取得');
      appendStatus(`　→　${characteristicUuid}`);

      const characteristic = await connectedDevice.readCharacteristicForService(
        primaryServiceUuid,
        characteristicUuid
      );

      await write16BitValueToCharacteristic(characteristic);

      appendStatus('端末から切断...');
      await connectedDevice.cancelConnection();

    } catch (error: any) {
      appendStatus('');
      appendStatus(`エラー - ${error.message}`);
      console.error('Connection error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <Text style={styles.title}>Bluetooth温度設定</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>端末名</Text>
          <TextInput
            style={styles.input}
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="端末名を入力"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>設定温度</Text>
          <TextInput
            style={styles.input}
            value={temperature}
            onChangeText={setTemperature}
            placeholder="温度を入力"
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={connectToDevice}>
          <Text style={styles.buttonText}>温度を変更</Text>
        </TouchableOpacity>

        <Text style={styles.status}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  formGroup: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    width: 100,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  button: {
    width: '100%',
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    width: '100%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    fontSize: 14,
    color: '#333',
    textAlign: 'left',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default App;
