import * as WebBrowser from 'expo-web-browser';
import React, { Component, useState, useEffect } from "react";
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator, ToastAndroid, BackHandler } from 'react-native';
import Card from '../components/Card';
import Modal from 'react-native-modal';
import { TextInput } from 'react-native-paper';
import Btn from '../components/Button';
import { FlatList } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';


export default function HomeScreen({ navigation }) {

  const [isLoading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [image, setImage] = useState([]);



  useEffect(() => {
 
    focusListener = navigation.addListener('focus', () => {
      getData();
      getPermissionAsync();
    });


    const getPermissionAsync = async () => {
      if (Constants.platform.ios) {
        const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
        if (status !== 'granted') {
          alert('Precisamos de permissão para acessar a câmera!');
        }
      }
    };


    const backAction = () => {
      Alert.alert("Tem certeza que quer voltar?", [
        {
          text: "Cancelar",
          onPress: () => null,
          style: "cancel"
        },
        { text: "Sim!", onPress: () => BackHandler.exitApp() }
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
     return () => backHandler.remove();
  }, []);



  const isAvailable = () => {
      const timeout = new Promise((resolve, reject) => {
      setTimeout(reject, 300, 'Request timed out');
    });

      const request = fetch('http://192.168.43.187:3000/crud/');

      return Promise
        .race([timeout, request])
        .then(response => console.log('It worked :)'))
        .catch(error => console.log('It timed out :('));
  }


  const getData = () => {
    isAvailable().then(fetch('http://192.168.43.187:3000/crud/')
      .then((response) => response.json())
      .then((json) => { setData(json.data); console.log(json.data) })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false))
    )
  }


  const openModal = (item, index) => {
    setModalData(item);
    setModalVisible(!modalVisible)
    console.log(modalData.name);
  }

  const picImage = async () => {

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.cancelled) {
        setImage(result);
        console.log("result.uri", result.uri)
      }

      console.log("result", result);
    } catch (E) {
      console.log(E);
    }
  }


  const createFormData = (photo, body) => {
    const data = new FormData();
    data.append("photo", {
      name: photo.fileName,
      type: photo.type,
      uri:
        Platform.OS === "android" ? photo.uri : photo.uri.replace("file://", "")
    });

    Object.keys(body).forEach(key => {
      data.append(key, body[key]);
    });
    return data;
  };


  const updateData = () => {
    setModalVisible(!modalVisible)

    let fileType = image.uri.substring(image.uri.lastIndexOf(".") + 1);
    console.log("fileType", fileType);
    let formData = new FormData();

    formData.append("photo", {
      uri: image.uri,
      name: 'first',
      type: `image/${fileType}`
    });

    formData.append('name', String(modalData.name));
    formData.append('designation', String(modalData.designation));


    let options = {
      method: "PUT",
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data; charset=utf-8; boundary="6ff46e0b6b5148d984f148b6542e5a5d',
        'Content-Disposition': 'form-data'
      }
    };

    fetch("http://192.168.43.187:3000/crud/update/" + modalData._id, options)
      .then(() => getData())
      .catch((error) => console.error(error))
  }

  const deleteData = id => {
    Alert.alert(
      "Deletar",
      "Você realmente deseja deletar?" + id,
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        {
          text: "OK", onPress: () => {
            fetch('http://192.168.43.187:3000/crud/delete/' + id, {
              method: 'DELETE',
            })
              .then(() => { getData(); showToast() })
              .catch((error) => console.error(error))
          }
        }
      ],
      { cancelable: false }
    );
  }


  const showToast = () => {
    ToastAndroid.showWithGravityAndOffset(
      "Deletado com sucesso!",
      ToastAndroid.LONG,
      ToastAndroid.BOTTOM,
      25,
      50
    );
  };

  const updateName = text => {
    setModalData({ ...modalData, name: text });
  }


  return (
    <View style={styles.container}>
      {isLoading ? <ActivityIndicator /> : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => 'key' + index}
          renderItem={({ item, index }) => (


            <TouchableOpacity onPress={() => openModal(item, index)} key={index} onLongPress={() => deleteData(item._id)} delayLongPress={7000}>
              <Card style={styles.card} >
                <View style={styles.img}>
                  <Image style={styles.tinyLogo} source={{ uri: item.path }} />
                </View>
                <View style={styles.otherDaata}>
                  <Text>{item.name}</Text>
                  <Text>{item.designation}</Text>
                </View>
              </Card>
            </TouchableOpacity>


          )}
        />
      )}


      <Modal isVisible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
        testID={'modal'}
        backdropColor="#B4B3DB"
        backdropOpacity={0.8}
        animationIn="zoomInDown"
        animationOut="zoomOutUp"
        animationInTiming={600}
        animationOutTiming={600}
        backdropTransitionInTiming={600}
        backdropTransitionOutTiming={600}>
        <View style={styles.modalContainer}>
          <View style={styles.inputContainer}>
            <TextInput style={styles.input} placeholder="Digite o nome" value={modalData.name} onChangeText={updateName} />
            <TextInput style={styles.input} placeholder="Digite a descrição" value={modalData.designation} onChangeText={text => setModalData({ ...modalData, designation: text })} />
            <View >
              <Btn title="Escolha uma imagem da galeria" onPress={picImage} />
              {image.uri && <Image source={{ uri: image.uri }} style={{ width: 100, height: 100, marginVertical: 10, justifyContent: 'space-around' }} />}
            </View>
            <Btn style={styles.btn} title="Enviar!" color="black" onPress={updateData} />
          </View>
        </View>
      </Modal>

    </View>

  );
};




HomeScreen.navigationOptions = {
  header: null,
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  card: {
    flexDirection: 'row',
    height: 80,
    shadowColor: 'red',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    // shadowRadius:6,
    shadowOpacity: 0.26,
    elevation: 5,
    borderRadius: 10,
    marginLeft: 30
  },
  img: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginLeft: 10
  },
  otherDaata: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    // marginRight:15
  },
  tinyLogo: {
    width: 50,
    height: 50,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#ffffff'
  },
  inputContainer: {
    marginTop: 20,
    alignItems: 'center'
  },
  input: {
    height: 30,
    width: '90%',
    textAlign: 'center',
    backgroundColor: '#fff',
    borderBottomColor: 'grey',
    marginVertical: 10,
    padding: 10,
    margin: 10
  },


});

