/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar, StyleSheet, View, Text, TextInput, TouchableOpacity, PermissionsAndroid, Platform, Alert, ScrollView, Clipboard } from 'react-native';
import { BleManager, Device, Characteristic } from 'react-native-ble-plx';

function App() {
  const [deviceName, setDeviceName] = useState('DNSMRA030003473');
  const [temperature, setTemperature] = useState('1');
  const [status, setStatus] = useState('待機中');
  const [bleManager] = useState(new BleManager());
  const [logs, setLogs] = useState<string[]>([]);

  const appendStatus = (newText: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${newText}`;
    setStatus(prev => prev + '\n' + newText);
    setLogs(prev => [...prev, logEntry]);
  };

  const copyLogs = async () => {
    try {
      const allLogs = logs.join('\n');
      await Clipboard.setString(allLogs);
      Alert.alert('コピー完了', 'ログがクリップボードにコピーされました');
    } catch (error) {
      Alert.alert('エラー', 'ログのコピーに失敗しました');
    }
  };


  const clearLogs = () => {
    setStatus('ログをクリア');
    setLogs([]);
  };

  const write16BitValueToCharacteristic = async (characteristic: Characteristic, charUuid: string) => {
    const temperatureValue = parseInt(temperature, 10);
    const tempOffset = -30;
    const tempByte = temperatureValue - tempOffset + 1;

    appendStatus(`温度設定 (${charUuid})`);
    appendStatus('温度計算情報');
    appendStatus(`　温度文字列: "${temperature}"`);
    appendStatus(`　温度数値: ${temperatureValue}`);
    appendStatus(`　tempByte: ${tempByte}`);
    appendStatus(`　NaN判定: ${isNaN(temperatureValue)}`);

    if (isNaN(temperatureValue)) {
      appendStatus('エラー: 温度値が無効です');
      return;
    }

    const byte0 = 0x02;
    const byte1 = tempByte;

    const valueToWrite = (byte0 << 8) | byte1;

    const buffer = new ArrayBuffer(2);
    const dataView = new DataView(buffer);
    dataView.setUint16(0, valueToWrite, false);

    appendStatus(`　→　0x${valueToWrite.toString(16).padStart(4, '0')}`);
    
    try {
      // Uint8Arrayに変換してからBase64エンコード
      const uint8Array = new Uint8Array(buffer);
      const base64String = btoa(String.fromCharCode(...uint8Array));
      
      appendStatus(`書き込みデータ: ${base64String}`);
      
      // writeWithResponseを使用してレスポンスを確認
      const response = await characteristic.writeWithResponse(base64String);
      appendStatus(`書き込み成功 - レスポンス: ${JSON.stringify(response)}`);
    } catch (error: any) {
      appendStatus(`書き込みエラー (${charUuid}) - ${error.message}`);
    }
  };

  const requestBluetoothPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return true;
    }

    try {
      // Android APIレベルを取得（Android 10-16対応）
      const apiLevel = Platform.constants && 'Version' in Platform.constants 
        ? Platform.constants.Version 
        : parseInt(Platform.Version as string, 10) || 0;
      appendStatus(`Android API Level: ${apiLevel}`);

      const permissionsToRequest: string[] = [];

      // Android 10-11 (API 29-30): 位置情報権限が必須
      if (apiLevel >= 29 && apiLevel <= 30) {
        permissionsToRequest.push(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );
        appendStatus('Android 10-11: 位置情報権限をリクエスト');
      }
      
      // Android 12+ (API 31+): 新しいBluetooth権限
      else if (apiLevel >= 31) {
        // Android 12+では位置情報権限は不要（neverForLocationフラグ使用）
        permissionsToRequest.push(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE
        );   
        appendStatus('Android 12+: 新しいBluetooth権限をリクエスト');
      }
      
      // Android 9以下: 位置情報権限が必要
      else {
        permissionsToRequest.push(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );
        appendStatus('Android 9以下: 位置情報権限をリクエスト');
      }

      if (permissionsToRequest.length === 0) {
        appendStatus('権限リクエストは不要です');
        return true;
      }

      appendStatus(`権限をリクエスト中... (${permissionsToRequest.length}個)`);
      const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest as any);

      // 結果を詳細に表示
      for (const [permission, result] of Object.entries(granted)) {
        const permissionName = permission.split('.').pop();
        appendStatus(`${permissionName}: ${result}`);
      }

      const allPermissionsGranted = Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allPermissionsGranted) {
        const deniedPermissions = Object.entries(granted)
          .filter(([_, result]) => result !== PermissionsAndroid.RESULTS.GRANTED)
          .map(([permission, _]) => permission.split('.').pop());
        
        appendStatus(`拒否された権限: ${deniedPermissions.join(', ')}`);
        Alert.alert('権限エラー', 'Bluetooth使用に必要な権限が許可されていません。設定から権限を許可してください。');
        return false;
      }
      
      appendStatus('すべての権限が許可されました');
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      appendStatus(`権限リクエストエラー: ${error}`);
      return false;
    }
  };

  const connectToDevice = async () => {
    try {
      setStatus('');
      appendStatus('権限を確認中...');

      const hasPermission = await requestBluetoothPermission();
      if (!hasPermission) {
        appendStatus('権限が許可されていません');
        return;
      }

      // Bluetoothの状態を確認
      appendStatus('Bluetoothの状態を確認中...');
      const bluetoothState = await bleManager.state();
      appendStatus(`Bluetooth状態: ${bluetoothState}`);
      
      if (bluetoothState !== 'PoweredOn') {
        appendStatus('Bluetoothが無効です。Bluetoothを有効にしてください。');
        Alert.alert('Bluetoothエラー', 'Bluetoothが無効です。設定でBluetoothを有効にしてください。');
        return;
      }

      appendStatus('デバイスを選択中...');
      appendStatus(`対象デバイス: ${deviceName}`);

      // Android 10-16向けのスキャンオプション（API別最適化）
      const apiLevel = Platform.constants && 'Version' in Platform.constants 
        ? Platform.constants.Version 
        : parseInt(Platform.Version as string, 10) || 0;
      
      let scanOptions = {};
      
      if (apiLevel >= 29) {
        // Android 10+ (API 29+): より詳細なオプション
        scanOptions = {
          allowDuplicates: false,
          scanMode: 1, // SCAN_MODE_LOW_LATENCY
          callbackType: 1, // CALLBACK_TYPE_ALL_MATCHES
          matchMode: 1, // MATCH_MODE_AGGRESSIVE
          numOfMatches: 1, // MATCH_NUM_ONE_ADVERTISEMENT
          reportDelay: 0,
        };
        appendStatus('Android 10+向けスキャンオプション適用');
      } else {
        // Android 9以下: 基本的なオプション
        scanOptions = {
          allowDuplicates: false,
        };
        appendStatus('Android 9以下向けスキャンオプション適用');
      }

      let deviceFound = false;

      bleManager.startDeviceScan(null, scanOptions, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          appendStatus(`スキャンエラー: ${error.message}`);
          bleManager.stopDeviceScan();
          return;
        }

        if (device) {
          console.log('Found device:', device.name, device.id, 'RSSI:', device.rssi);
          appendStatus(`発見: ${device.name || 'Unknown'} (${device.id.substring(0, 8)}...)`);
          
          if (device.name === deviceName) {
            deviceFound = true;
            bleManager.stopDeviceScan();
            connectToFoundDevice(device);
          }
        }
      });

      setTimeout(() => {
        if (!deviceFound) {
          bleManager.stopDeviceScan();
          appendStatus('デバイスが見つかりませんでした');
          appendStatus('以下を確認してください:');
          appendStatus('• デバイスの電源が入っているか');
          appendStatus('• デバイス名が正しいか');
          appendStatus('• デバイスがペアリング待機中か');
        }
      }, 15000); // タイムアウトを15秒

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
      appendStatus(`　→　ID: ${device.id}`);
      appendStatus(`　→　RSSI: ${device.rssi}dBm`);
      
      // Android 12+では接続安定性を向上させる
      const apiLevel = Platform.constants && 'Version' in Platform.constants 
        ? Platform.constants.Version 
        : parseInt(Platform.Version as string, 10) || 0;
      
      const connectionOptions = apiLevel >= 31 ? {
        requestMTU: 512,
        refreshGatt: 'OnConnected' as const,
        timeout: 15000 // 15秒に設定
      } : undefined;
      
      appendStatus('接続実行中...');
      const connectedDevice = await device.connect(connectionOptions);

      appendStatus('接続成功');
      
      // Android 16+ではサービス検出の前に少し待機
      if (apiLevel >= 36) {
        appendStatus('Android 16+: 接続安定化待機...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      appendStatus('サービス・キャラクタリスティック検出中...');
      await connectedDevice.discoverAllServicesAndCharacteristics();

      const primaryServiceUuid = '442f1570-8a00-9a28-cbe1-e1d4212d53eb';
      appendStatus('サービスを取得');
      appendStatus(`　→　${primaryServiceUuid}`);

      const characteristicUuid = '442f1574-8a00-9a28-cbe1-e1d4212d53eb';
      appendStatus('キャラクタリスティックを取得中...');
      appendStatus(`　→　${characteristicUuid}`);

      try {
        // サービス情報を取得
        appendStatus('サービス情報を取得中...');
        const services = await connectedDevice.services();
        appendStatus(`サービス数: ${services.length}`);
        
        const targetService = services.find(service => service.uuid.toLowerCase() === primaryServiceUuid.toLowerCase());
        if (!targetService) {
          throw new Error(`サービスが見つかりません: ${primaryServiceUuid}`);
        }
        appendStatus('対象サービス発見');
        
        appendStatus('キャラクタリスティック一覧を取得中...');
        const characteristics = await targetService.characteristics();
        appendStatus(`キャラクタリスティック数: ${characteristics.length}`);
        
        // 全キャラクタリスティックをログ出力
        characteristics.forEach((char, index) => {
          appendStatus(`[${index}] UUID: ${char.uuid}`);
          appendStatus(`    書き込み可能: ${char.isWritableWithoutResponse || char.isWritableWithResponse}`);
        });
        
        // 2つ目のキャラクタリスティック（442f1574）で温度設定
        const targetCharacteristic = characteristics.find(char => char.uuid.toLowerCase() === characteristicUuid.toLowerCase());
        if (targetCharacteristic) {
          appendStatus('対象キャラクタリスティック発見');
          appendStatus('write16BitValueToCharacteristic実行中...');
          await write16BitValueToCharacteristic(targetCharacteristic, characteristicUuid);
          appendStatus('write16BitValueToCharacteristic完了');
        } else {
          appendStatus(`キャラクタリスティックが見つかりません: ${characteristicUuid}`);
        }
        
      } catch (charError: any) {
        appendStatus('');
        appendStatus(`キャラクタリスティック操作エラー: ${charError.message}`);
        throw charError; // 元のcatchブロックで処理される
      }

      appendStatus('端末から切断...');
      await connectedDevice.cancelConnection();

    } catch (error: any) {
      appendStatus('');
      appendStatus(`接続エラー - ${error.message}`);
      appendStatus(`エラーコード: ${error.errorCode || 'N/A'}`);
      appendStatus(`エラー詳細: ${error.reason || 'N/A'}`);
      
      // Android 16+でよくあるエラーの対処法を表示
      const apiLevel = Platform.constants && 'Version' in Platform.constants 
        ? Platform.constants.Version 
        : parseInt(Platform.Version as string, 10) || 0;
        
      if (apiLevel >= 36 && error.message.includes('disconnected')) {
        appendStatus('');
        appendStatus('Android 16のボンドロス問題の可能性があります');
        appendStatus('デバイスのペアリング解除→再ペアリングを試してください');
      }
      
      console.error('Connection error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={'dark-content'} />
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

        <View style={styles.logButtonContainer}>
          <TouchableOpacity style={[styles.logButton, styles.copyButton]} onPress={copyLogs}>
            <Text style={styles.logButtonText}>ログコピー</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.logButton, styles.clearButton]} onPress={clearLogs}>
            <Text style={styles.logButtonText}>クリア</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.statusContainer} contentContainerStyle={styles.statusContent}>
          <Text style={styles.status}>{status}</Text>
        </ScrollView>
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
  statusContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusContent: {
    flexGrow: 1,
  },
  status: {
    padding: 15,
    fontSize: 14,
    color: '#333',
    textAlign: 'left',
    minHeight: 100,
  },
  logButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  logButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  copyButton: {
    backgroundColor: '#28a745',
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  logButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default App;
