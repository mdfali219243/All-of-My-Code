import { Stack } from 'expo-router';
import { View } from 'react-native';

import { AppSidebar } from '../../components/AppSidebar';
import { InboxBadgeProvider } from '../../contexts/InboxBadgeContext';
import { MenuProvider } from '../../contexts/MenuContext';
import { useTheme } from '../../contexts/ThemeContext';

function AppStack() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgSecondary }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgSecondary } }} />
      <AppSidebar />
    </View>
  );
}

export default function AppLayout() {
  return (
    <MenuProvider>
      <InboxBadgeProvider>
        <AppStack />
      </InboxBadgeProvider>
    </MenuProvider>
  );
}
