import { Tabs } from "expo-router";
import { BarChart, Bell, Calendar, Settings, Users } from "lucide-react-native";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Colors } from "../../constants/Theme";
import { useAppContext } from "../../context/AppContext";

const TabButton = ({
  label,
  isFocused,
  onPress,
  icon: Icon,
  badgeCount,
}: any) => {
  const scale = useSharedValue(isFocused ? 1.1 : 1);
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isFocused ? 1 : 0, { duration: 350 });
    scale.value = withSpring(isFocused ? 1.15 : 1, { damping: 15 });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: interpolate(progress.value, [0, 1], [0, -2]) },
      ],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 1],
      [Colors.textLighter, Colors.primary],
    );
    return {
      color,
      transform: [{ translateY: interpolate(progress.value, [0, 1], [0, -1]) }],
      opacity: interpolate(progress.value, [0, 1], [0.8, 1]),
    };
  });

  const backgroundPillStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(progress.value, [0, 1], [0, 1]),
      transform: [{ scale: interpolate(progress.value, [0, 1], [0.8, 1]) }],
    };
  });

  return (
    <Pressable onPress={onPress} style={styles.tabItem}>
      <Animated.View style={[styles.pillBg, backgroundPillStyle]} />
      <Animated.View style={[styles.iconWrapper, animatedIconStyle]}>
        <Icon
          size={22}
          color={isFocused ? Colors.primary : Colors.textLighter}
          strokeWidth={isFocused ? 2.5 : 2}
        />
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </Animated.View>
      <Animated.Text style={[styles.tabLabel, animatedTextStyle]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
};

export default function AdminLayout() {
  const { paymentAlerts } = useAppContext();
  const unreadCount = paymentAlerts.filter((a) => !a.is_read).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="students"
        options={{
          tabBarButton: (props) => (
            <TabButton
              {...props}
              label="Roster"
              icon={Users}
              isFocused={props.accessibilityState?.selected}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          tabBarButton: (props) => (
            <TabButton
              {...props}
              label="Schedule"
              icon={Calendar}
              isFocused={props.accessibilityState?.selected}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          tabBarButton: (props) => (
            <TabButton
              {...props}
              label="Logs"
              icon={BarChart}
              isFocused={props.accessibilityState?.selected}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarButton: (props) => (
            <TabButton
              {...props}
              label="Alerts"
              icon={Bell}
              badgeCount={unreadCount}
              isFocused={props.accessibilityState?.selected}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="config"
        options={{
          tabBarButton: (props) => (
            <TabButton
              {...props}
              label="Config"
              icon={Settings}
              isFocused={props.accessibilityState?.selected}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 85,
    paddingTop: 12,
    paddingBottom: 12,

    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#fff",

    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.06,
    shadowRadius: 20,

    position: "absolute",
    left: 0,
    right: 0,

    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  pillBg: {
    position: "absolute",
    width: 48,
    height: 48,
    backgroundColor: Colors.blue50,
    borderRadius: 16,
    top: 4,
  },
  iconWrapper: {
    width: 40,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "900",
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  badge: {
    position: "absolute",
    right: -2,
    top: -4,
    backgroundColor: Colors.danger,
    borderRadius: 9,
    minWidth: 15,
    height: 15,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#fff",
    zIndex: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 7,
    fontWeight: "900",
  },
});
