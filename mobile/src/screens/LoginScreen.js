import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#fff0f5' }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: '#d63384', textAlign: 'center', marginBottom: 32 }}>Sign In</Text>

        <Text style={{ fontSize: 13, fontWeight: '600', color: '#2d1b69', marginBottom: 4 }}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
          style={{ backgroundColor: 'white', borderRadius: 10, padding: 14, borderWidth: 1.5, borderColor: '#f0c0d8', marginBottom: 12, fontSize: 15 }} />

        <Text style={{ fontSize: 13, fontWeight: '600', color: '#2d1b69', marginBottom: 4 }}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry
          style={{ backgroundColor: 'white', borderRadius: 10, padding: 14, borderWidth: 1.5, borderColor: '#f0c0d8', marginBottom: 24, fontSize: 15 }} />

        <TouchableOpacity onPress={handleLogin} disabled={loading}
          style={{ backgroundColor: loading ? '#ccc' : '#d63384', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>{loading ? 'Signing In...' : 'Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: '#888' }}>New here? <Text style={{ color: '#d63384', fontWeight: '700' }}>Create Account</Text></Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12, alignItems: 'center' }}>
          <Text style={{ color: '#888', fontSize: 13 }}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
