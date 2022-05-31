import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "react-native";

import { Colors } from "react-native/Libraries/NewAppScreen";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingsScreen from "./screens/SettingsScreen";
import CheckoutScreen from "./screens/CheckoutScreen";
import ResultScreen from "./screens/ResultScreen";

import { LogBox } from "react-native";
LogBox.ignoreLogs(["new NativeEventEmitter"]); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notificationsß

const Stack = createNativeStackNavigator();

const App = () => {
  const isDarkMode = useColorScheme() === "dark";

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
