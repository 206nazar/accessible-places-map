import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";

import HomeScreen from "./screens/HomeScreen";
import CompanyHomeScreen from "./screens/CompanyHomeScreen";
import CompanyReviewsScreen from "./screens/CompanyReviewsScreen";
import AccountScreen from "./screens/AccountScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import RoleSelectScreen from "./screens/RoleSelectScreen";
import AddPlaceScreen from "./screens/AddPlaceScreen";
import PlaceDetailsScreen from "./screens/PlaceDetailsScreen";
import EditPlaceScreen from "./screens/EditPlaceScreen";
import PickLocationScreen from "./screens/PickLocationScreen";
import FeedbackScreen from "./screens/FeedbackScreen";
import MyProfileScreen from "./screens/MyProfileScreen";
import MyReviewsScreen from "./screens/MyReviewsScreen";

import AdminHomeScreen from "./screens/AdminHomeScreen";
import AdminPlacesScreen from "./screens/AdminPlacesScreen";
import AdminReviewsScreen from "./screens/AdminReviewsScreen";
import ReviewEditScreen from "./screens/ReviewEditScreen";

import { ThemeProvider, useTheme } from "./theme/ThemeContext";
import { UserProvider, useUser } from "./context/UserContext";

const Stack = createNativeStackNavigator();

function AppInner() {
  const { theme, ready: readyTheme } = useTheme();
  const { ready: readyUser, user } = useUser();

  if (!readyTheme || !readyUser) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme?.colors?.bg || "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme?.colors?.primary || "#00bcd4"} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <Stack.Screen name="Home" options={{ headerShown: false }}>
          {(props) => <HomeScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="CompanyHome" options={{ title: "Кабінет компанії" }}>
          {(props) => <CompanyHomeScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="CompanyReviews" options={{ title: "Відгуки компанії" }}>
          {(props) => <CompanyReviewsScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="AdminHome" options={{ title: "Адмін" }}>
          {(props) => <AdminHomeScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="AdminPlaces" options={{ title: "Адмін: точки" }}>
          {(props) => <AdminPlacesScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="AdminReviews" options={{ title: "Адмін: відгуки" }}>
          {(props) => <AdminReviewsScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="Account" options={{ title: "Акаунт" }}>
          {(props) => <AccountScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="MyProfile" options={{ title: "Мій профіль" }}>
          {(props) => <MyProfileScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="MyReviews" options={{ title: "Мої відгуки" }}>
          {(props) => <MyReviewsScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="Login" options={{ title: "Вхід" }}>
          {(props) => <LoginScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="Register" options={{ title: "Реєстрація" }}>
          {(props) => <RegisterScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="RoleSelect" options={{ title: "Хто ви?" }}>
          {(props) => <RoleSelectScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="Feedback" options={{ title: "Зворотній звʼязок" }}>
          {(props) => <FeedbackScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="ReviewEdit" options={{ title: "Відгук" }}>
          {(props) => <ReviewEditScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="PlaceDetails" options={{ title: "Місце" }}>
          {(props) => <PlaceDetailsScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="PickLocation" options={{ title: "Вибір локації" }}>
          {(props) => <PickLocationScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="AddPlace" options={{ title: "Додати місце" }}>
          {(props) => <AddPlaceScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="EditPlace" options={{ title: "Редагувати місце" }}>
          {(props) => <EditPlaceScreen {...props} user={user} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppInner />
      </UserProvider>
    </ThemeProvider>
  );
}