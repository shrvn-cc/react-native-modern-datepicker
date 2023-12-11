import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  FlatList,
  Easing,
  TouchableOpacity,
  I18nManager,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

import { useCalendar } from '../DatePicker';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const TimeScroller = ({ title, data, onChange }) => {
  const { options, utils } = useCalendar();
  const [itemSize, setItemSize] = useState(Dimensions.get("screen").height * .09225);
  const style = styles(options);
  const scrollAnimatedValue = useRef(new Animated.Value(0)).current;
  const scrollListener = useRef(null);
  const active = useRef(0);
  data = ['', '', ...data, '', ''];

  useEffect(() => {
    scrollListener.current && clearInterval(scrollListener.current);
    scrollListener.current = scrollAnimatedValue.addListener(({ value }) => (active.current = value));

    return () => {
      clearInterval(scrollListener.current);
    };
  }, [scrollAnimatedValue]);

  const changeItemWidth = ({ nativeEvent }) => {
    const { height } = nativeEvent.layout;
    !itemSize && setItemSize(height / 5);
  };

  const renderItem = ({ item, index }) => {
    const makeAnimated = (a, b, c) => {
      return {
        inputRange: [...data.map((_, i) => i * itemSize)],
        outputRange: [
          ...data.map((_, i) => {
            const center = i + 2;
            if (center === index) {
              return a;
            } else if (center + 1 === index || center - 1 === index) {
              return b;
            } else {
              return c;
            }
          }),
        ],
      };
    };

    return (
      <Animated.View
        style={[
          {
            height: itemSize,
            opacity: scrollAnimatedValue.interpolate(makeAnimated(1, 0.6, 0)),
            transform: [
              {
                scale: scrollAnimatedValue.interpolate(makeAnimated(1.2, 0.9, 0)),
              },
              {
                scaleY: I18nManager.isRTL ? -1 : 1,
              },
            ],
          },
          style.listItem,
        ]}>
        <Text style={style.listItemText}>
          {utils.toPersianNumber(String(item).length === 1 ? '0' + item : item)}
        </Text>
      </Animated.View>
    );
  };

  return (
    <View style={style.row} onLayout={changeItemWidth}>
      {/* <Text style={style.title}>{title}</Text> */}
      <AnimatedFlatList
        pagingEnabled
        showsVerticalScrollIndicator={false}
        // horizontal
        snapToInterval={itemSize}
        decelerationRate={'fast'}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollAnimatedValue } } }], {
          useNativeDriver: true,
        })}
        data={I18nManager.isRTL ? data.reverse() : data}
        onMomentumScrollEnd={() => {
          const index = Math.round(active.current / itemSize);
          onChange(data[index + 2]);
        }}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        inverted={I18nManager.isRTL}
        contentContainerStyle={
          I18nManager.isRTL && {
            transform: [
              {
                scaleX: -1,
              },
            ],
          }
        }
      />
    </View>
  );
};

const SelectTime = () => {
  const { options, state, utils, minuteInterval, mode, onTimeChange, loading } = useCalendar();
  const [mainState, setMainState] = state;
  const [show, setShow] = useState(false);
  const [time, setTime] = useState({
    minute: 0,
    hour: 1,
    ampm: 'AM',
  });
  const style = styles(options);
  const openAnimation = useRef(new Animated.Value(0)).current;
  console.log({ loading })
  useEffect(() => {
    show &&
      setTime({
        minute: 0,
        hour: 1,
        ampm: 'AM',
      });
  }, [show]);

  useEffect(() => {
    mainState.timeOpen && setShow(true);
    Animated.timing(openAnimation, {
      toValue: mainState.timeOpen ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
      easing: Easing.bezier(0.17, 0.67, 0.46, 1),
    }).start(() => {
      !mainState.timeOpen && setShow(false);
    });
  }, [mainState.timeOpen, openAnimation]);

  const selectTime = () => {
    const newTime = utils.getDate(mainState.activeDate);
    newTime.hour(((time.ampm === "AM" && time.hour !== 12) || (time.ampm === "PM" && time.hour === 12)) ? time.hour : time.hour + 12).minute(time.minute);
    setMainState({
      type: 'set',
      activeDate: utils.getFormated(newTime),
      selectedDate: mainState.selectedDate
        ? utils.getFormated(
          utils
            .getDate(mainState.selectedDate)
            .hour(time.hour)
            .minute(time.minute),
        )
        : '',
    });
    onTimeChange(utils.getFormated(newTime, 'timeFormat'));
    mode !== 'time' &&
      setMainState({
        type: 'toggleTime',
      });
  };

  const containerStyle = [
    style.container,
    {
      opacity: openAnimation,
      transform: [
        {
          scale: openAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [1.1, 1],
          }),
        },
      ],
    },
  ];

  return show ? (
    <Animated.View style={containerStyle}>
      <View style={style.header}>
        <TimeScroller
          title={utils.config.hour}
          data={Array.from({ length: 12 }, (x, i) => i + 1)}
          onChange={hour => setTime({ ...time, hour: hour })}
        />
        <TimeScroller
          title={utils.config.minute}
          data={Array.from({ length: 60 / minuteInterval }, (x, i) => i * minuteInterval)}
          onChange={minute => setTime({ ...time, minute })}
        />
        <TimeScroller
          title="AM/PM"
          data={["AM", "PM"]}
          onChange={ampm => setTime({ ...time, ampm })}
        />
      </View>
      <View style={style.footer}>
        {
          loading ? <ActivityIndicator style={{ ...style.button, paddingHorizontal: 35}} color="#ffffff" /> :
            <TouchableOpacity style={style.button} activeOpacity={0.8} onPress={selectTime}>
              <Text style={style.btnText}>{utils.config.timeSelect}</Text>
            </TouchableOpacity>}
      </View>
    </Animated.View>
  ) : null;
};

const styles = theme =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      top: 0,
      right: 0,
      backgroundColor: theme.backgroundColor,
      borderRadius: 10,
      flexDirection: 'column',
      justifyContent: 'center',
      zIndex: 999,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 5,
    },
    title: {
      fontSize: theme.textHeaderFontSize,
      color: theme.mainColor,
      fontFamily: theme.headerFont,
    },
    listItem: {
      width: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listItemText: {
      fontSize: theme.textHeaderFontSize,
      color: theme.textDefaultColor,
      fontFamily: theme.defaultFont,
    },
    header: {
      width: '100%',
      height: '100%',
      justifyContent: "center",
      flexDirection: "row"
    },
    footer: {
      position: "absolute",
      flexDirection: 'row',
      bottom: 0,
      right: Dimensions.get("screen").width / 2.9,
      justifyContent: 'center',
      marginTop: 15,
    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: 25,
      borderRadius: 8,
      backgroundColor: theme.mainColor,
      margin: 8,
    },
    btnText: {
      fontSize: theme.textFontSize,
      color: theme.selectedTextColor,
      fontFamily: theme.defaultFont,
    },
    cancelButton: {
      backgroundColor: theme.textSecondaryColor,
    },
  });

export { SelectTime };
