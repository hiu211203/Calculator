import React, { useState, useEffect } from 'react';
import {ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useOrientation from './hooks/useOrientation';

function factorialize(num) {
  if (num == 0 || num == 1) 
      return 1;
  else {
      return (num * factorialize(num - 1));
  }
}

function transfer(chuoi){
  const result = chuoi.replace(/√(\d+)/g, 'Math.sqrt($1)')
                      .replace(/(\d*)Π/g, function(match, so) {
                          return so ? `(${so} * Math.PI)` : 'Math.PI';
                      })
                      .replace(/(\d+)²/g, 'Math.pow($1, 2)')
                      .replace(/%/g, '*0.01')
                      .replace(/(\d+)!/g,  function(match, so) {
                                                const giaiThua = factorialize(parseInt(so));
                                                return giaiThua;
                                            })
                      .replace(/sin(\d+|\([^)]+\))/g, function(match, soHoacBieuThuc) {
                                              const sinExpression = soHoacBieuThuc.includes('(') ? soHoacBieuThuc : `(${soHoacBieuThuc})`;
                                              return `Math.sin${sinExpression}`;
                                          })
                        .replace(/cos(\d+|\([^)]+\))/g, function(match, soHoacBieuThuc) {
                                            const cosExpression = soHoacBieuThuc.includes('(') ? soHoacBieuThuc : `(${soHoacBieuThuc})`;
                                            return `Math.cos${cosExpression}`;
                                        })
                        .replace(/tan(\d+|\([^)]+\))/g, function(match, soHoacBieuThuc) {
                                          const tanExpression = soHoacBieuThuc.includes('(') ? soHoacBieuThuc : `(${soHoacBieuThuc})`;
                                          return `Math.tan${tanExpression}`;
                                      });
  return result
}

const CalculatorApp = () => {
  const orientation = useOrientation();
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState([]);
  const [clearAll, setClearAll] = useState(false);
  //const [swiperIndex, setSwiperIndex] = useState(0);
  useEffect(() => {
    // Load history from AsyncStorage when the component mounts
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem('history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const saveHistory = async () => {
    try {
      await AsyncStorage.setItem('history', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const handlePress = (value) => {
    if (value === '=') {
      // Evaluate expression and update history
      try {
        const result = eval(transfer(expression));
        const newHistoryItem = { expression, result };
        setHistory([newHistoryItem, ...history]);
        setExpression('');
        setClearAll(true);
        saveHistory();
      }
      catch (error) {
        console.error("Định dạng đã dùng không phù hợp", error);
      }
      // Scroll to the first slide (latest history) when a new calculation is added
      //setSwiperIndex(0);
    } else if (value === 'AC') {
      setExpression('');
    } else if (value === '⌫') {
      setExpression((prevExpression) => prevExpression.slice(0, -1));
    } else {
      setExpression((prevExpression) => {
        if (clearAll) {
          setClearAll(false);
          return value;
        }
        return prevExpression + value;
      });
    }
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory();
  };

  const handleHistoryPress = (item) => {
    setExpression(item.expression);
  };
  

  return (
    <View style={styles.container}>
      <View style={[styles.screencontainer, {flexDirection: orientation.isPortrait ? 'column':'row'},{height: orientation.isPortrait ? '50%':'40%'}]}>
          <Text style={[styles.historyTitle,{height: orientation.isPortrait ? '10%':'100%'}]}>History</Text>
          
          <ScrollView style={[styles.history, {height: orientation.isPortrait ? '70%':'100%'}]}>
            {history.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItemContainer}
                onPress={() => handleHistoryPress(item)}
              >
                <Text style={styles.historyItem}>{`${item.expression} = ${item.result}`}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ height: 5 }} />
          </ScrollView>

          <TouchableOpacity style={[styles.clearButton, {height: orientation.isPortrait ? '15%':'100%'}, {width: orientation.isPortrait ? '100%':'15%'}]} onPress={clearHistory}>
            <Text style={styles.clearButtonText}>Clear History</Text>
          </TouchableOpacity>
      </View>

      <View style={[styles.display, {height: orientation.isPortrait ? '10%':'15%'}]}>
        <Text style={styles.expression}>{expression}</Text>
      </View>

      <View style={styles.buttons}>
        {orientation.isPortrait ? (
          ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '(', ')', '0', '+', 'AC', '⌫', '.', '='].map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.button,{height:'21.3%'}, {width:'25%'}]}
              onPress={() => handlePress(value)}
            >
              <Text style={styles.buttonText}>{value}</Text>
            </TouchableOpacity>
        )))
        :(
          ['sin', 'cos', 'tan','7', '8', '9', '/', '!', '%', 'Π','4', '5', '6', '*', '√', '²','.','1', '2', '3', '-', '(', ')','AC','0','⌫', '=', '+'].map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.button,{height: '25.5%'}, {width:'14.285%'}]}
              onPress={() => handlePress(value)}
            >
              <Text style={styles.buttonText}>{value}</Text>
            </TouchableOpacity>
        )))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  expression: {
    fontSize: 24,
  },
  history: {
    marginLeft: 20,
    marginRight: 20,
    marginTop: 25,
  },
  historyTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 30,
    marginLeft: 10,
  },
  historyItem: {
    fontSize: 16,
  },
  clearButton: {
    marginTop: 25,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  screencontainer: {
  },
  display: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    alignItems: 'flex-end'
  },
  buttons: {
    Height: '50%',
    width: '100%',
    maxHeight: '50%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#ccc', 
  },
  buttonText: {
    fontSize: 24,
  }
});

export default CalculatorApp;