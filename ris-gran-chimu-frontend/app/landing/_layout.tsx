import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Building2, FileText, Home, Phone, Target } from 'lucide-react-native';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LandingTabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />

      <Tabs
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            // Altura dinámica: base 70 + padding superior + el espacio de seguridad inferior
            height: (Platform.OS === 'ios' ? 60 : 70) + insets.bottom,
            paddingTop: 8,
            // El padding inferior se ajusta según el sistema para no quedar tapado
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : (insets.bottom > 0 ? insets.bottom + 5 : 10),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 5,
            color: '#6B7280',
          },
          tabBarIconStyle: {
            marginTop: 8,
          },
        }}
      >
        {/* Estrategias */}
        <Tabs.Screen
          name="estrategias"
          options={{
            title: 'Estrategias',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                <View style={[styles.iconBackground, focused && styles.activeCircle]}>
                  <Target size={24} color={focused ? '#FFFFFF' : '#6B7280'} />
                </View>
              </View>
            ),
          }}
        />

        {/* Establecimientos */}
        <Tabs.Screen
          name="establecimientos"
          options={{
            title: 'Centros',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                <View style={[styles.iconBackground, focused && styles.activeCircle]}>
                  <Building2 size={24} color={focused ? '#FFFFFF' : '#6B7280'} />
                </View>
              </View>
            ),
          }}
        />

        {/* Inicio */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                <View style={[styles.iconBackground, focused && styles.activeCircle]}>
                  <Home size={24} color={focused ? '#FFFFFF' : '#6B7280'} />
                </View>
              </View>
            ),
          }}
        />

        {/* Transparencia */}
        <Tabs.Screen
          name="transparencia"
          options={{
            title: 'Portal',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                <View style={[styles.iconBackground, focused && styles.activeCircle]}>
                  <FileText size={24} color={focused ? '#FFFFFF' : '#6B7280'} />
                </View>
              </View>
            ),
          }}
        />

        {/* Contacto */}
        <Tabs.Screen
          name="contacto"
          options={{
            title: 'Contacto',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                <View style={[styles.iconBackground, focused && styles.activeCircle]}>
                  <Phone size={24} color={focused ? '#FFFFFF' : '#6B7280'} />
                </View>
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCircle: {
    backgroundColor: '#0066CC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});