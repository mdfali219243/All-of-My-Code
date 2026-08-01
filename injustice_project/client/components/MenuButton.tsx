import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { useMenu } from '../contexts/MenuContext';
import { useTheme } from '../contexts/ThemeContext';

type Props = {
  size?: number;
  color?: string;
};

export function MenuButton({ size = 24, color }: Props) {
  const { openMenu } = useMenu();
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={openMenu}
      style={styles.btn}
      accessibilityLabel="Open menu"
      accessibilityRole="button"
    >
      <Ionicons name="menu" size={size} color={color ?? colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
});
