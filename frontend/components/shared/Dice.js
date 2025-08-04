import React from 'react';
import { View, StyleSheet } from 'react-native';

const Dot = () => <View style={styles.dot} />;

const Dice = ({ number }) => {
  const renderDots = () => {
    switch (number) {
      case 1:
        return (
          <View style={[styles.face, styles.face1]}>
            <Dot />
          </View>
        );
      case 2:
        return (
          <View style={[styles.face, styles.face2]}>
            <Dot />
            <Dot />
          </View>
        );
      case 3:
        return (
          <View style={[styles.face, styles.face3]}>
            <Dot />
            <Dot />
            <Dot />
          </View>
        );
      case 4:
        return (
          <View style={[styles.face, styles.face4]}>
            <View style={styles.column}>
              <Dot />
              <Dot />
            </View>
            <View style={styles.column}>
              <Dot />
              <Dot />
            </View>
          </View>
        );
      case 5:
        return (
          <View style={[styles.face, styles.face5]}>
            <View style={styles.column}>
              <Dot />
              <Dot />
            </View>
            <View style={styles.column_center}>
                <Dot />
            </View>
            <View style={styles.column}>
              <Dot />
              <Dot />
            </View>
          </View>
        );
      case 6:
        return (
          <View style={[styles.face, styles.face6]}>
            <View style={styles.column}>
              <Dot />
              <Dot />
              <Dot />
            </View>
            <View style={styles.column}>
              <Dot />
              <Dot />
              <Dot />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return <View style={styles.dice}>{renderDots()}</View>;
};

const styles = StyleSheet.create({
  dice: {
    width: 60,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
  face: {
    width: '100%',
    height: '100%',
    padding: 8,
  },
  face1: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  face2: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  face3: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  face4: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  face5: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  face6: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    justifyContent: 'space-between',
  },
   column_center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    backgroundColor: 'black',
    borderRadius: 6,
    margin: 2,
  },
});

export default Dice;
