import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as cocossd from '@tensorflow-models/coco-ssd';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';
import * as jpeg from 'jpeg-js';
import * as ImagePicker from 'expo-image-picker';
import { fetch } from '@tensorflow/tfjs-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Prediction = ({ p }) => {
  return (
    <View style={styles.welcomeImage}>
      <Text style={styles.text}>{p.class}</Text>
    </View>
  );
};

const DetectionScreen = (props) => {
  const [isTfReady, setIsTfReady] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    tf.ready().then(() => {
      setIsTfReady(true);
    });
    cocossd.load().then((cocoModels) => {
      setIsModelReady(true);
      setModel(cocoModels);
      getPermissionAsync();
    });
  }, []);

  useEffect(() => {
    if (image) detectObjects();
  }, [image]);

  const getPermissionAsync = async () => {
    if (Constants.platform.ios) {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status === 'granted') {
      } else {
        console.warn('Permissions Needed');
        console.log(status);
      }
    }
  };

  const imageToTensor = (rawImageData) => {
    const TO_UINT8ARRAY = true;
    const { width, height, data } = jpeg.decode(rawImageData, TO_UINT8ARRAY);
    const buffer = new Uint8Array(width * height * 3);
    let offset = 0;
    for (let i = 0; i < buffer.length; i += 3) {
      buffer[i] = data[offset];
      buffer[i + 1] = data[offset + 1];
      buffer[i + 2] = data[offset + 2];
      offset += 4;
    }

    return tf.tensor3d(buffer, [height, width, 3]);
  };

  const detectObjects = async () => {
    try {
      const imageAssetPath = Image.resolveAssetSource(image);
      const response = await fetch(imageAssetPath.uri, {}, { isBinary: true });
      const rawImageData = await response.arrayBuffer();
      const imageTensor = imageToTensor(rawImageData);
      const predictions = await model.detect(imageTensor);
      setPredictions(predictions);

      console.log('----------- predictions: ', predictions);
    } catch (error) {
      console.log('Exception Error: ', error);
    }
  };

  const selectImage = async () => {
    try {
      let response = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!response.cancelled) {
        const source = { uri: response.uri };
        setImage(source);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const renderPrediction = (prediction, index) => {
    return (
      <View style={styles.welcomeImage}>
        <Text key={index} style={styles.text}>
          {prediction.class}
        </Text>
      </View>
    );
  };
  return (
    <ImageBackground
      source={require('../assets/gradient.jpg')}
      style={styles.container}
    >
      <View style={styles.container}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <StatusBar barStyle='dark-content' />
        <View style={styles.loadingContainer}>
          <Text style={styles.text}>{isTfReady ? <Text></Text> : ''}</Text>
        </View>
        <View style={styles.loadingModelContainer}>
          <Text style={styles.text}>Detection Ready?</Text>
          {isModelReady ? (
            <Text style={styles.text}> 🚀 </Text>
          ) : (
            <ActivityIndicator size='small' />
          )}
        </View>
        <TouchableOpacity
          style={styles.imageWrapper}
          onPress={isModelReady ? selectImage : undefined}
        >
          {image && <Image source={image} style={styles.imageContainer} />}

          {isModelReady && !image && (
            <Text style={styles.transparentText}>Tap to choose image</Text>
          )}
        </TouchableOpacity>
        <View style={styles.predictionWrapper}>
          {isModelReady && image && (
            <Text style={styles.text}>
              Predictions: {predictions ? '' : 'Detecting...'}
            </Text>
          )}
          {isModelReady &&
            predictions &&
            predictions.map((pred, idx) => <Prediction p={pred} key={idx} />)}
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(47, 163, 218, 0)',
    alignItems: 'center',
  },
  logo: {
    top: '5%',
    width: 80,
    height: 80,
    alignItems: 'center',
    resizeMode: 'contain',
  },
  welcomeImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginTop: 3,
    marginLeft: -10,
  },
  contentContainer: {
    paddingTop: 30,
  },
  loadingContainer: {
    marginTop: 80,
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 27,
    alignItems: 'center',
  },
  loadingModelContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  imageWrapper: {
    width: 280,
    height: 280,
    padding: 10,
    borderColor: 'white',
    borderWidth: 3,
    borderStyle: 'dashed',
    marginTop: 40,
    marginBottom: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: 250,
    height: 250,
    position: 'absolute',
    top: 10,
    left: 10,
    bottom: 10,
    right: 10,
  },
  predictionWrapper: {
    height: 100,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
  },
  predictions: {},
  transparentText: {
    color: '#ffffff',
    opacity: 0.7,
  },
  homeButton: {
    alignItems: 'center',
    bottom: '-10%',
  },
  poweredBy: {
    fontSize: 20,
    color: '#e69e34',
    marginBottom: 6,
  },
});
export default DetectionScreen;
