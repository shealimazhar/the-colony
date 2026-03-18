import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect, useContext } from "react";
import { FontAwesome } from "@expo/vector-icons";
import SelectDropdown from "react-native-select-dropdown";
import Color from "../Color";
import Toast from "react-native-toast-message";
import { vw, vh } from "../utils/ScreenSize";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { URL } from "../utils/Constant";
import { ContextProvider } from "../Global/Context";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

const TaskDetail = ({ navigation, route }) => {
  const { items: initialItems, Alldata, screenName } = route.params;
  const [items, setItems] = useState(initialItems);
  const [data, setData] = useState();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { setUpdation } = useContext(ContextProvider);

  // Sync items with route.params when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const currentItems = route.params?.items;
      if (currentItems && currentItems.task_status !== items.task_status) {
        setItems(currentItems);
      }
    });
    return unsubscribe;
  }, [navigation, route.params?.items, items.task_status]);

  useEffect(() => {
    setData([
      {
        label: "Company",
        value: items.client_company_name,
      },
      {
        label: "Task",
        value: items.project_title,
      },
      {
        label: "Status",
        value: items?.task_status - 1,
        selectoptions: true,
      },
      {
        label: "Start Date",
        value: formatDate(items?.project_date_start),
      },
      {
        label: "End Date",
        value: formatDate(items?.project_date_due),
      },
      {
        label: "Priority",
        value: items?.task_priority,
      },
    ]);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [items]);

  const options = [
    "New (Unassigned)",
    "Not Started",
    "In Progress",
    "On Hold",
    "Query Resolved",
    "Query Raised",
    "Completed",
  ];

  const selectOption = async (value, index) => {
    const updatedData = data.map((el) =>
      el.label == "Status" ? { ...el, value: index } : el
    );
    setData(updatedData);
  };

  const updateTask = async () => {
    const statusObject = data?.find((item) => item?.label === "Status");
    const authToken = await AsyncStorage.getItem("token");
    const newStatus = statusObject?.value + 1;
    
    setUpdating(true);
    
    try {
      const response = await axios.post(
        URL + "/update-task/" + items?.task_id,
        {
          task_status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      
      const updatedItems = { ...items, task_status: newStatus };
      setItems(updatedItems);
      
      navigation.setParams({ items: updatedItems });
      
      // Call callback to update parent screen's data
      if (route.params?.onTaskUpdate) {
        route.params.onTaskUpdate(updatedItems);
      }
      
      setUpdation((pre) => [...pre]);
      
      Toast.show({
        type: "success",
        text1: "Task Updated Successfully!",
        visibilityTime: 1500,
        topOffset: 5,
      });
    } catch (err) {
      const errorMessage = err?.response?.data?.message || "Failed to update task";
      Toast.show({
        type: "error",
        text1: errorMessage,
        visibilityTime: 2500,
        topOffset: 5,
      });
    } finally {
      setUpdating(false);
    }
  };
  function stripHtmlTags(str) {
    return (str || "N/A").replace(/<[^>]*>/g, "");
  }
  return (
    <View style={styles.mainContainer}>
      {!loading ? (
        <View style={styles.Container}>
          <ScrollView>
            {data.map((option, index) => (
              <View key={index} style={styles.optionContainer}>
                <Text style={styles.label}>{option.label}</Text>
                {option.selectoptions ? (
                  <SelectDropdown
                    data={options}
                    buttonStyle={{
                      backgroundColor: "white",
                      height: vh * 5,
                      width: vw * 45,
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "row",
                    }}
                    dropdownStyle={{ marginTop: -(vh * 4), fontSize: 12 }}
                    buttonTextStyle={{ fontSize: 15 }}
                    renderDropdownIcon={(isOpened) => {
                      return (
                        <FontAwesome
                          style={{ marginLeft: 4 }}
                          name={isOpened ? "chevron-up" : "chevron-down"}
                          color={"#5A5A5A"}
                          size={14}
                        />
                      );
                    }}
                    defaultValue={options[option.value]}
                    onSelect={(selectedItem, index) => {
                      selectOption("Status", index);
                    }}
                    buttonTextAfterSelection={(selectedItem, index) => {
                      return selectedItem;
                    }}
                    rowTextForSelection={(item, index) => {
                      return item;
                    }}
                  />
                ) : (
                  <Text style={styles.value}>{option.value}</Text>
                )}
              </View>
            ))}
            <View
              style={[
                styles.optionContainer,
                { flexDirection: "column", alignItems: "flex-start", gap: 10 },
              ]}
            >
              <Text style={styles.label}>Task Description: </Text>
              <Text style={styles.value}>
                {stripHtmlTags(items.task_description)}
              </Text>
            </View>
            <View style={styles.bottomContainer}>
              <View style={styles.TextContainer}>
                <Text style={styles.text1}>Assigned</Text>
              </View>
              <View>
                <ScrollView>
                  {items?.assigned.map((item, index) => {
                    return (
                      <View
                        key={index}
                        style={[
                          styles.individual,
                          {
                            backgroundColor:
                              index % 2 == 0 ? "#D2CBBC" : "#F2F1CF",
                          },
                        ]}
                      >
                        <Text
                          style={styles.dataText}
                        >{`${item.first_name} ${item.last_name}`}</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.btnContainer, updating && { opacity: 0.7 }]}
              activeOpacity={0.6}
              onPress={updateTask}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitTxt}>Update</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
          <Toast />
        </View>
      ) : (
        <View style={styles.Indicator}>
          <ActivityIndicator size="large" color={"black"} />
          <Text style={styles.fetchingData}>Fetching Data</Text>
        </View>
      )}
    </View>
  );
};

export default TaskDetail;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  Container: {
    height: "100%",
    backgroundColor: "#EFE5DC",
  },
  Indicator: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
    marginTop: vh * 37,
  },
  fetchingData: {
    color: "black",
    fontWeight: "bold",
  },
  optionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "lightgray",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },

  value: {
    fontSize: 16,
  },
  optionText: {
    color: "black",
  },
  bottomContainer: {
    paddingHorizontal: 20,
  },
  text1: {
    fontSize: 16,
    paddingHorizontal: 15,
  },
  TextContainer: {
    marginTop: 20,
    height: 45,
    display: "flex",
    justifyContent: "center",
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: Color.brightOrange,
  },
  dataText: {
    fontSize: 14,
    color: "black",
    flex: 0.4,
  },
  dataText2: {
    fontSize: 14,
    color: "black",
    flex: 0.6,
    textAlign: "center",
  },
  individual: {
    height: 45,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomColor: Color.brightOrange,
    borderBottomWidth: 1,
  },
  btnContainer: {
    backgroundColor: "black",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12 * vh,
    marginTop: 3 * vh,
    marginHorizontal: 5 * vw,
    height: 45,
    borderRadius: 10,
  },
  submitTxt: {
    color: "white",
    fontSize: 17,
  },
});
