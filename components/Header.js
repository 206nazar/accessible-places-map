import { Text, StyleSheet, View } from 'react-native';

export default function Header({ title }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  text: {
    fontSize: 18,       
    fontWeight: 'bold', 
    textAlign: 'center',
  },
});
