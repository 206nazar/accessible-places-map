import { Text, StyleSheet, View } from 'react-native';

export default function Footer({ text }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  text: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
  },
});
