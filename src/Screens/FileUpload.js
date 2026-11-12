import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ScrollView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { URL } from "../utils/Constant";
import * as ImagePicker from "expo-image-picker";
import { vw } from "../utils/ScreenSize";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const STORAGE_BASE = "http://thecolonysolution.com/storage/files";
const MASONRY_HEIGHTS = [150, 200, 170, 130, 190, 160, 140, 180];

const ImageWithShimmer = memo(({ uri, onPress, height, isUploading }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const shimmerTranslate = useSharedValue(0);

  useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: shimmerTranslate.value * 200 - 100,
      },
    ],
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {imageLoading && (
        <View style={[styles.imageContainer, { height }]}>
          <Animated.View style={[styles.shimmerLayer, animatedStyle]}>
            <LinearGradient
              colors={["#E0E0E0", "#F0F0F0", "#E0E0E0"]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      )}
      <Image
        source={{ uri }}
        style={[
          styles.imageContainer,
          { height, opacity: isUploading ? 0.6 : 1 },
        ]}
        contentFit="cover"
        cachePolicy={isUploading ? "none" : "disk"}
        transition={200}
        onLoad={() => setImageLoading(false)}
        onError={() => setImageLoading(false)}
      />
      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <MaterialCommunityIcons
            name="cloud-upload"
            size={32}
            color="white"
          />
        </View>
      )}
    </TouchableOpacity>
  );
});

const FileUpload = ({ navigation, route }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { items, Alldata, screenName } = route.params;
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchAttachments(true);
  }, [items]);

  const fetchAttachments = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      const authToken = await AsyncStorage.getItem("token");
      const response = await axios.get(
        `${URL}/task/${Number(items.project_id)}/show-attachments`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
          },
        }
      );
      setData(response.data.attachments.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (sourceType) => {
    let result;
    if (sourceType === "gallery") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need gallery permissions to make this work!");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });
    } else {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera permissions to make this work!");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
      });
    }

    if (!result.canceled) {
      await uploadImage(result.assets[0]);
    }
  };

  const uploadImage = async (image) => {
    const tempId = `temp_${Date.now()}`;
    const tempAttachment = {
      attachment_id: tempId,
      attachment_directory: "",
      attachment_filename: "",
      attachment_medium: "",
      attachment_thumbname: "",
      _localUri: image.uri,
      _isUploading: true,
    };

    setData((prev) => [tempAttachment, ...prev]);

    try {
      const authToken = await AsyncStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", {
        uri: image.uri,
        type: "image/jpeg",
        name: image.uri.split("/").pop() || "image.jpg",
      });

      const response = await axios.post(
        `${URL}/task/${Number(items.project_id)}/attach-files`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const attachment = response.data?.attachment || response.data?.attachments?.data?.[0];
      if (attachment) {
        setData((prev) =>
          prev.map((item) =>
            item.attachment_id === tempId ? attachment : item
          )
        );
      } else {
        await fetchAttachments(false);
      }
    } catch (error) {
      console.log("Upload error:", error);
      setData((prev) => prev.filter((item) => item.attachment_id !== tempId));
      alert("Failed to upload image. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not available";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleImagePress = (imageUri) => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  const ShimmerSkeleton = () => {
    const shimmerTranslate = useSharedValue(0);

    useEffect(() => {
      shimmerTranslate.value = withRepeat(
        withTiming(1, { duration: 1000 }),
        -1,
        true
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateX: shimmerTranslate.value * 200 - 100,
        },
      ],
    }));

    return (
      <View style={styles.skeletonContainer}>
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <View
              key={index}
              style={[
                styles.skeletonItem,
                { height: index % 2 === 0 ? 150 : 200 },
              ]}
            >
              <Animated.View style={[styles.shimmerLayer, animatedStyle]}>
                <LinearGradient
                  colors={["#E0E0E0", "#F0F0F0", "#E0E0E0"]}
                  style={styles.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            </View>
          ))}
      </View>
    );
  };

  const splitDataIntoColumns = () => {
    const leftColumn = [];
    const rightColumn = [];
    data.forEach((item, index) => {
      const dir = item.attachment_directory;
      const thumbFile =
        item.attachment_medium || item.attachment_thumbname || item.attachment_filename;
      const fullFile = item.attachment_filename;

      const thumbUri = item._localUri
        ? item._localUri
        : `${STORAGE_BASE}/${dir}/${thumbFile}`;
      const fullUri = item._localUri
        ? item._localUri
        : `${STORAGE_BASE}/${dir}/${fullFile}`;

      const entry = {
        id: String(item.attachment_id),
        thumbUri,
        fullUri,
        isUploading: !!item._isUploading,
        height: MASONRY_HEIGHTS[index % MASONRY_HEIGHTS.length],
      };

      if (index % 2 === 0) {
        leftColumn.push(entry);
      } else {
        rightColumn.push(entry);
      }
    });
    return [leftColumn, rightColumn];
  };

  const [leftColumn, rightColumn] = useMemo(
    () => splitDataIntoColumns(),
    [data]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <ImageWithShimmer
        uri={item.thumbUri}
        onPress={() => handleImagePress(item.fullUri)}
        height={item.height}
        isUploading={item.isUploading}
      />
    ),
    []
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#EEE5DC" }}>
      <View style={styles.maiNContainer}>
        <View style={styles.header}>
          <Text
            style={styles.txt}
          >{`Assigned User: ${items?.assigned[0]?.first_name}`}</Text>
          <Text style={styles.txt}>{`Stated Data: ${formatDate(
            items.project_date_start
          )}`}</Text>
        </View>
        <View style={styles.container}>
          <View style={styles.containerTop}>
            <MaterialCommunityIcons
              name="file-upload"
              size={29}
              color="black"
            />
            <Text style={styles.txt2}>Files Attachment</Text>
          </View>
          <View style={styles.fileUploadContainer}>
            <Text style={styles.txt4}>Updates Files</Text>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons
                name="file-upload"
                size={29}
                color="white"
              />
            </View>
            <View style={styles.btnContainer}>
              <TouchableOpacity
                activeOpacity={0.6}
                style={styles.btn}
                onPress={() => pickImage("gallery")}
              >
                <Text style={[styles.txt3, { color: "white" }]}>
                  Choose Files
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.6}
                style={styles.btnOutline}
                onPress={() => pickImage("camera")}
              >
                <Text style={[styles.txt3, { color: "black" }]}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.smTxt}>
            Only .jpg and .png files, 500 KB max file size.
          </Text>
          <View style={styles.fileContainer}>
            {loading ? (
              <ShimmerSkeleton />
            ) : data.length === 0 ? (
              <View>
                <Text>No attachments found</Text>
              </View>
            ) : (
              <View style={styles.masonryContainer}>
                <View style={styles.column}>
                  <FlashList
                    data={leftColumn}
                    renderItem={renderItem}
                    keyExtractor={(item) => `left-${item.id}`}
                    estimatedItemSize={150}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
                <View style={styles.column}>
                  <FlashList
                    data={rightColumn}
                    renderItem={renderItem}
                    keyExtractor={(item) => `right-${item.id}`}
                    estimatedItemSize={150}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              </View>
            )}
            <Modal visible={modalVisible} transparent animationType="fade">
              <View style={styles.modalContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.fullImage}
                  contentFit="contain"
                  cachePolicy="disk"
                  transition={300}
                />
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text>Close</Text>
                </TouchableOpacity>
              </View>
            </Modal>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default FileUpload;

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#382504",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  maiNContainer: {
    flex: 1,
    paddingBottom: 70,
  },
  txt: {
    color: "white",
    fontSize: 12,
  },
  container: {
    padding: 17,
    gap: 17,
    backgroundColor: "#EEE5DC",
    flex: 1,
  },
  containerTop: {
    display: "flex",
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
  },
  txt2: {
    fontSize: 15,
    fontWeight: "600",
  },
  fileUploadContainer: {
    borderRadius: 8,
    backgroundColor: "white",
    padding: 10,
    paddingVertical: 20,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
  },
  iconWrapper: {
    backgroundColor: "#FBA81A",
    height: 50,
    width: 50,
    borderRadius: 100,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  btnContainer: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  btn: {
    backgroundColor: "black",
    paddingHorizontal: 13,
    paddingVertical: 2,
    borderRadius: 100,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: "black",
  },
  btnOutline: {
    backgroundColor: "white",
    paddingHorizontal: 13,
    paddingVertical: 2,
    borderRadius: 100,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: "black",
  },
  txt3: {
    fontSize: 13,
  },
  txt4: {
    fontWeight: "500",
  },
  smTxt: {
    fontSize: 13,
    color: "gray",
  },
  fileContainer: {
    gap: 15,
    flex: 1,
  },
  masonryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
    marginHorizontal: 2,
  },
  imageContainer: {
    borderRadius: 10,
    width: "100%",
    marginBottom: 4,
    backgroundColor: "#E0E0E0",
    overflow: "hidden",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "90%",
    height: "80%",
  },
  closeBtn: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    marginTop: 10,
  },
  skeletonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 10,
  },
  skeletonItem: {
    width: "48%",
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
  },
  shimmerLayer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  gradient: {
    width: 200,
    height: "100%",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 4,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
});
