import { Stack } from 'expo-router';

export default function ToolsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="metrics" />
      <Stack.Screen name="predictor" />
      <Stack.Screen name="fantasy" />
      <Stack.Screen name="draft" />
    </Stack>
  );
}
