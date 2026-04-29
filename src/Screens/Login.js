import { StyleSheet, Text, View, ImageBackground, TextInput, Image, ActivityIndicator, Dimensions, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import React, { useEffect, useState, useContext } from 'react';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { vh, vw } from '../utils/ScreenSize';
import axios from 'axios';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { URL } from '../utils/Constant';
import Toast from 'react-native-toast-message';
import { ContextProvider } from '../Global/Context';
const Login = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { TokenSetter, setLOGINSTATE, } = useContext(ContextProvider);

  useEffect(() => {
    (async () => {
      const authToken = await AsyncStorage.getItem("token");
      if (authToken && authToken !== "") {
        setLOGINSTATE(true);
      }
    })()
  }, []);

  const Login = () => {
    setLoading(true);
    axios.post(URL + "/login", {}, {
      params: {
        email: email,
        password: password,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }
    )
      .then((res) => {
        const token = res.data.token
        if (token) {
          (async function () {
            await AsyncStorage.setItem("token", res.data.token);
            const userDetail = {
              fname: res.data.user.first_name,
              lname: res.data.user.last_name,
              phone: res.data.user.phone,
              email: res.data.user.email,
            };
            const userDetailString = JSON.stringify(userDetail);
            await AsyncStorage.setItem("userDetail", userDetailString);
            Toast.show({
              type: 'success',
              text1: 'Login Successfully!',
              text2: 'we are moving you toward dashboard',
              visibilityTime: 1200
            });
            setTimeout(() => {
              setLOGINSTATE(true);
              setEmail('');
              setPassword('');
            }, 1400);
            TokenSetter(token)
          })();
        }
        else {
          Toast.show({
            type: 'error',
            text1: 'Error while Login',
            text2: 'Might be due to invalid Credentials',
            visibilityTime: 2000
          });
        }

      })
      .catch((err) => {
        console.log(err);
        console.log(err.response.data.message);
        Toast.show({
          type: 'error',
          text1: 'Error while Login',
          text2: 'Might be due to invalid Credentials',
          visibilityTime: 2000
        });
      }).finally(() => {
        setLoading(false)
      })
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      style={{ flex: 1 }}
    >
      <ImageBackground source={require('../../assets/imgs/Bg.png')} style={styles.backgroundImage}>
        <StatusBar translucent backgroundColor="transparent" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <Image source={require('../../assets/imgs/logoLogin.png')} style={styles.Image} />
          <Text style={styles.text1}>Welcome back!</Text>
          <Text style={styles.text2}>Sign in to view your projects</Text>
          <View style={styles.inputMainContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={18} color="black" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="black"
                value={email}
                onChangeText={(text) => setEmail(text)}
              />
            </View>
            <View style={styles.inputContainer}>
              <FontAwesome name="lock" size={20} color="black" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="black"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => setPassword(text)}
              />
              <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIconContainer}>
                <FontAwesome
                  name={showPassword ? 'eye' : 'eye-slash'}
                  size={20}
                  color="black"
                  style={styles.eyeIcon}
                />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={() => Login()} activeOpacity={0.6} style={styles.signInButton} disabled={loading}>
            {loading ? (
              <View style={styles.loaderContainer}>
                <Text style={styles.textSignIn}>Signing In</Text>
                <ActivityIndicator size="small" color="white" />
              </View>
            ) : (
              <Text style={styles.textSignIn}>Sign In</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
        <Toast />
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    alignItems: "center",
    justifyContent: "center",
    alignContent: "center",
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  Image: {
    height: 250,
    width: 250,
    marginTop: -50,
    marginBottom: 20
  },
  text1: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: -20,
  },
  text2: {
    fontSize: 16,
  },
  inputMainContainer: {
    marginVertical: 25,
    width: vw * 100,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    width: vw * 80,
    backgroundColor: "white",
    borderRadius: 100,
    paddingHorizontal: 20,
    alignSelf: "center",
    height: 45,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "black",
    fontSize: 16,
    paddingVertical: 5,
  },
  signInButton: {
    backgroundColor: "black",
    marginHorizontal: 40,
    width: vw * 80,
    height: 45,
    borderRadius: 100,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  textSignIn: {
    color: "white",
    fontSize: 18,
  },
  loaderContainer: {
    display: "flex",
    flexDirection: "row",
    gap: 5
  }
});
