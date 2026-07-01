import { useRouter } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Plus,
  Search,
  Settings,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  Layout,
  SlideInRight,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Theme";
import { useAppContext } from "../../context/AppContext";

import SplashScreen from "../../components/SplashScreen";

export default function AdminTimetableScreen() {
  const router = useRouter();
  const {
    schedule,
    students,
    sysConfig,
    saveAllSchedule,
    removeSchedule,
    courseEnrollments,
    saveAllEnrollments,
  } = useAppContext();

  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [newSlot, setNewSlot] = useState({
    course: "",
    cohort: "1",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 120 * 86400000).toISOString().split("T")[0],
    start: "09:00",
    end: "12:00",
    days: [1, 2, 3, 4, 5],
    autoEnroll: true,
  });

  const [managingSlotId, setManagingSlotId] = useState<string | null>(null);
  const [manageTab, setManageTab] = useState<"roster" | "schedule">("roster");
  const [editFormData, setEditFormData] = useState<any>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    visible: boolean;
    id: string;
    name: string;
  }>({
    visible: false,
    id: "",
    name: "",
  });

  const [rosterSearch, setRosterSearch] = useState("");
  const [selectedRosterIds, setSelectedRosterIds] = useState<string[]>([]);
  const [showSinglePicker, setShowSinglePicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [timetableSearch, setTimetableSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Picker States
  const [pickerModal, setPickerModal] = useState<{
    visible: boolean;
    type: "date" | "time";
    field: string;
    data: any[];
  }>({
    visible: false,
    type: "date",
    field: "",
    data: [],
  });

  const [manualTime, setManualTime] = useState({ hour: "09", min: "00" });

  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const openPicker = (type: "date" | "time", field: string) => {
    setPickerSearch(""); // Reset search when opening
    let data: any[] = [];
    if (type === "time") {
      const currentVal = managingSlotId ? editFormData[field] : newSlot[field];
      const [h, m] = (currentVal || "09:00").split(":");
      setManualTime({ hour: h || "09", min: m || "00" });

      const hours = Array.from({ length: 24 }, (_, i) =>
        i.toString().padStart(2, "0"),
      );
      const mins = [
        "00",
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20",
        "21",
        "22",
        "23",
        "24",
        "25",
        "26",
        "27",
        "28",
        "29",
        "30",
        "31",
        "32",
        "33",
        "34",
        "35",
        "36",
        "37",
        "38",
        "39",
        "40",
        "41",
        "42",
        "43",
        "44",
        "45",
        "46",
        "47",
        "48",
        "49",
        "50",
        "51",
        "52",
        "53",
        "54",
        "55",
        "56",
        "57",
        "58",
        "59",
      ];
      data = hours.flatMap((h) => mins.map((m) => `${h}:${m}`));
    } else {
      // Set calendar month to the current field value if valid, or today
      const currentVal = managingSlotId ? editFormData[field] : newSlot[field];
      const initialDate = currentVal ? new Date(currentVal) : new Date();
      if (!isNaN(initialDate.getTime())) {
        setCalendarMonth(initialDate);
      } else {
        setCalendarMonth(new Date());
      }
    }
    setPickerModal({ visible: true, type, field, data });
  };

  const handlePickerSelect = (val: string) => {
    if (
      pickerModal.field === "startDate" ||
      pickerModal.field === "endDate" ||
      pickerModal.field === "start" ||
      pickerModal.field === "end"
    ) {
      if (managingSlotId) {
        setEditFormData({ ...editFormData, [pickerModal.field]: val });
      } else {
        setNewSlot({ ...newSlot, [pickerModal.field]: val });
      }
    }
    setPickerModal({ ...pickerModal, visible: false });
  };

  const changeMonth = (offset: number) => {
    const next = new Date(calendarMonth);
    next.setMonth(next.getMonth() + offset);
    setCalendarMonth(next);
  };

  const adjustManualTime = (part: "hour" | "min", delta: number) => {
    let val = parseInt(manualTime[part]);
    val += delta;
    if (part === "hour") {
      if (val > 23) val = 0;
      if (val < 0) val = 23;
    } else {
      if (val > 59) val = 0;
      if (val < 0) val = 59;
    }
    setManualTime({ ...manualTime, [part]: String(val).padStart(2, "0") });
  };

  const renderTimeAdjuster = () => (
    <View style={styles.timeAdjusterContainer}>
      <View style={styles.adjusterRow}>
        <View style={styles.adjusterCol}>
          <TouchableOpacity
            onPress={() => adjustManualTime("hour", 1)}
            style={styles.adjBtn}
          >
            <ChevronUp size={24} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.adjDisplay}>
            <Text style={styles.adjText}>{manualTime.hour}</Text>
          </View>
          <TouchableOpacity
            onPress={() => adjustManualTime("hour", -1)}
            style={styles.adjBtn}
          >
            <ChevronDown size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.adjLabel}>HOUR</Text>
        </View>
        <Text style={styles.adjSeparator}>:</Text>
        <View style={styles.adjusterCol}>
          <TouchableOpacity
            onPress={() => adjustManualTime("min", 1)}
            style={styles.adjBtn}
          >
            <ChevronUp size={24} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.adjDisplay}>
            <Text style={styles.adjText}>{manualTime.min}</Text>
          </View>
          <TouchableOpacity
            onPress={() => adjustManualTime("min", -1)}
            style={styles.adjBtn}
          >
            <ChevronDown size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.adjLabel}>MIN</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.adjConfirmBtn}
        onPress={() =>
          handlePickerSelect(`${manualTime.hour}:${manualTime.min}`)
        }
      >
        <Text style={styles.adjConfirmText}>Set Selection</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = calendarMonth.toLocaleString("default", {
      month: "long",
    });

    const days = [];
    // Padding for previous month days
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`pad-${i}`} style={styles.calendarDayEmpty} />);
    }

    const currentVal =
      (managingSlotId
        ? editFormData[pickerModal.field]
        : newSlot[pickerModal.field]) || "";

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const isSelected = currentVal === dateStr;
      const isToday = new Date().toISOString().split("T")[0] === dateStr;

      days.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.calendarDay,
            isSelected && { backgroundColor: Colors.primary },
            isToday && !isSelected && { backgroundColor: Colors.blue50 },
          ]}
          onPress={() => handlePickerSelect(dateStr)}
        >
          <Text
            style={[
              styles.calendarDayText,
              isSelected && { color: "#fff" },
              isToday && !isSelected && { color: Colors.primary },
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>,
      );
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={() => changeMonth(-1)}
            style={styles.calNavBtn}
          >
            <ChevronLeft size={20} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.monthDisplay}>
            <Text style={styles.calendarMonthName}>{monthName}</Text>
            <Text style={styles.calendarYearName}>{year}</Text>
          </View>
          <TouchableOpacity
            onPress={() => changeMonth(1)}
            style={styles.calNavBtn}
          >
            <ChevronRight size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.calendarWeekDays}>
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d, i) => (
            <Text key={i} style={styles.calendarWeekDayText}>
              {d}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>{days}</View>
      </View>
    );
  };

  const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DAYS_FULL = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const handleCreateCourse = async () => {
    if (
      !newSlot.course ||
      !newSlot.startDate ||
      !newSlot.endDate ||
      !newSlot.start ||
      !newSlot.end ||
      newSlot.days.length === 0
    ) {
      Alert.alert("Incomplete", "Please fill all fields.");
      return;
    }

    setIsProcessing(true);
    const slotId = "c_" + Date.now();
    const slot = {
      id: slotId,
      course: newSlot.course,
      cohort: parseInt(newSlot.cohort),
      days: newSlot.days,
      start: newSlot.start,
      end: newSlot.end,
      startDate: newSlot.startDate,
      endDate: newSlot.endDate,
    };

    const nextSchedule = [...schedule, slot];
    const nextEnrollments = { ...courseEnrollments, [slotId]: [] as string[] };

    if (newSlot.autoEnroll) {
      Object.keys(students).forEach((id) => {
        if (parseInt(students[id].cohort) === parseInt(newSlot.cohort)) {
          nextEnrollments[slotId].push(id);
        }
      });
    }

    try {
      await saveAllSchedule(nextSchedule, nextEnrollments);
      setCreateModalVisible(false);
      setNewSlot({ ...newSlot, course: "" });
    } finally {
      setIsProcessing(false);
    }
  };

  const openManageModal = (slot: any) => {
    setManagingSlotId(slot.id);
    setEditFormData({ ...slot, cohort: slot.cohort, days: slot.days || [] });
    setManageTab("roster");
  };

  const handleUpdateSchedule = async () => {
    setIsProcessing(true);
    const nextSchedule = schedule.map((s) =>
      s.id === managingSlotId
        ? { ...editFormData, cohort: parseInt(editFormData.cohort) }
        : s,
    );
    try {
      await saveAllSchedule(nextSchedule);
      Alert.alert("Success", "All changes saved successfully.");
      setManagingSlotId(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteScheduleSlot = (id: string, name: string) => {
    setDeleteConfirmation({ visible: true, id, name });
  };

  const handleConfirmDelete = async () => {
    const { id } = deleteConfirmation;
    setDeleteConfirmation({ ...deleteConfirmation, visible: false });
    setManagingSlotId(null);
    setIsProcessing(true);
    try {
      await removeSchedule(id);
    } catch (err) {
      console.error("Deletion error", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentRoster = useMemo(() => {
    if (!managingSlotId) return [];
    return (courseEnrollments[managingSlotId] || []).map((id) => ({
      id,
      ...(students[id] || { name: "Unknown Student" }),
    }));
  }, [managingSlotId, courseEnrollments, students]);

  const filteredRoster = useMemo(() => {
    return currentRoster.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(rosterSearch.toLowerCase()) ||
        (s.id || "").toLowerCase().includes(rosterSearch.toLowerCase()),
    );
  }, [currentRoster, rosterSearch]);

  const removeStudentsFromRoster = (ids: string[]) => {
    if (!managingSlotId) return;
    const next = {
      ...courseEnrollments,
      [managingSlotId]: (courseEnrollments[managingSlotId] || []).filter(
        (id) => !ids.includes(id),
      ),
    };
    saveAllEnrollments(next);
    setSelectedRosterIds([]);
  };

  const bulkAddCohortToRoster = (cohortId: string) => {
    if (!managingSlotId) return;
    const ids = [...(courseEnrollments[managingSlotId] || [])];
    Object.keys(students).forEach((id) => {
      if (
        parseInt(students[id].cohort) === parseInt(cohortId) &&
        !ids.includes(id)
      ) {
        ids.push(id);
      }
    });
    saveAllEnrollments({ ...courseEnrollments, [managingSlotId]: ids });
  };

  const filteredPickerStudents = useMemo(() => {
    return Object.entries(students)
      .map(([id, s]) => ({ id, ...s }))
      .filter(
        (s) =>
          s.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
          s.id.toLowerCase().includes(pickerSearch.toLowerCase()),
      );
  }, [students, pickerSearch]);

  const filteredSchedule = useMemo(() => {
    return schedule.filter(
      (s) =>
        s.course.toLowerCase().includes(timetableSearch.toLowerCase()) ||
        (sysConfig.cohorts[s.cohort] || "")
          .toLowerCase()
          .includes(timetableSearch.toLowerCase()),
    );
  }, [schedule, timetableSearch, sysConfig.cohorts]);

  const filteredTimeData = useMemo(() => {
    if (pickerModal.type !== "time") return [];
    const base = pickerModal.data.filter((t: string) =>
      t.includes(pickerSearch),
    );
    // If user typed a valid HH:MM that isn't in the 5-min list, add it as first option
    if (
      pickerSearch.length === 5 &&
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(pickerSearch) &&
      !base.includes(pickerSearch)
    ) {
      return [pickerSearch, ...base];
    }
    return base;
  }, [pickerModal.data, pickerModal.type, pickerSearch]);

  const renderScheduleItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      layout={Layout.springify()}
      style={styles.slotCard}
    >
      <View style={styles.cardTop}>
        <View style={styles.courseHeader}>
          <Text style={styles.courseNameText}>{item.course}</Text>
          <View style={styles.cohortPill}>
            <Text style={styles.cohortPillText}>
              {sysConfig.cohorts[item.cohort]}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            style={[styles.manageBtn, { marginRight: 8 }]}
            onPress={() => openManageModal(item)}
            activeOpacity={0.7}
          >
            <Settings size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.manageBtn, { backgroundColor: "#fee2e2" }]}
            onPress={() => deleteScheduleSlot(item.id, item.course)}
            activeOpacity={0.5}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Trash2 size={20} color={Colors.danger} pointerEvents="none" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Clock size={14} color="#94a3b8" />
          <Text style={styles.detailText}>
            {item.start} - {item.end}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Calendar size={14} color="#94a3b8" />
          <Text style={styles.detailText}>
            {item.startDate} to {item.endDate}
          </Text>
        </View>
      </View>

      <View style={styles.daysStrip}>
        {item.days.map((d: number) => (
          <View key={d} style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>{DAYS_SHORT[d]}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isProcessing && <SplashScreen message="Updating schedule..." />}
      <Animated.View entering={SlideInRight} style={styles.screenHeader}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={styles.backBtn}
          >
            <ArrowLeft size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Calendar size={24} color={Colors.primary} />
          <Text style={styles.screenTitle}>Timetable</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setCreateModalVisible(true)}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.searchArea}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textLighter} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tracks..."
            value={timetableSearch}
            onChangeText={setTimetableSearch}
          />
        </View>
      </View>

      <FlatList
        data={filteredSchedule}
        keyExtractor={(item) => item.id}
        renderItem={renderScheduleItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No schedules mapped. Create one above.
          </Text>
        }
        ListFooterComponent={<View style={{ height: 120 }} />}
      />

      {/* CREATE MODAL */}
      <Modal visible={isCreateModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Schedule Track</Text>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.modalForm}>
                <Text style={styles.fieldLabel}>COURSE MODULE NAME</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newSlot.course}
                  onChangeText={(t) => setNewSlot({ ...newSlot, course: t })}
                  placeholder="e.g. BTH 101"
                />

                <Text style={styles.fieldLabel}>TARGET COHORT</Text>
                <View style={styles.cohortGrid}>
                  {Object.entries(sysConfig.cohorts).map(([id, label]) => (
                    <TouchableOpacity
                      key={id}
                      style={[
                        styles.cohortOption,
                        newSlot.cohort === id && styles.cohortOptionActive,
                      ]}
                      onPress={() => setNewSlot({ ...newSlot, cohort: id })}
                    >
                      <Text
                        style={[
                          styles.cohortOptionText,
                          newSlot.cohort === id &&
                            styles.cohortOptionTextActive,
                        ]}
                      >
                        {label as string}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() =>
                    setNewSlot({ ...newSlot, autoEnroll: !newSlot.autoEnroll })
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      newSlot.autoEnroll && styles.checkboxActive,
                    ]}
                  >
                    {newSlot.autoEnroll && <X size={12} color="#fff" />}
                  </View>
                  <Text style={styles.toggleText}>
                    Automatically bulk-enroll cohort students
                  </Text>
                </TouchableOpacity>

                <View style={styles.inputGrid}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>START DATE</Text>
                    <TouchableOpacity
                      style={styles.modalInputTouch}
                      onPress={() => openPicker("date", "startDate")}
                    >
                      <Calendar size={18} color={Colors.primary} />
                      <Text style={styles.modalInputTouchText}>
                        {newSlot.startDate}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>END DATE</Text>
                    <TouchableOpacity
                      style={styles.modalInputTouch}
                      onPress={() => openPicker("date", "endDate")}
                    >
                      <Calendar size={18} color={Colors.primary} />
                      <Text style={styles.modalInputTouchText}>
                        {newSlot.endDate}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGrid}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>START TIME</Text>
                    <TouchableOpacity
                      style={styles.modalInputTouch}
                      onPress={() => openPicker("time", "start")}
                    >
                      <Clock size={18} color={Colors.primary} />
                      <Text style={styles.modalInputTouchText}>
                        {newSlot.start}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>END TIME</Text>
                    <TouchableOpacity
                      style={styles.modalInputTouch}
                      onPress={() => openPicker("time", "end")}
                    >
                      <Clock size={18} color={Colors.primary} />
                      <Text style={styles.modalInputTouchText}>
                        {newSlot.end}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>RECURRENCE DAYS</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setNewSlot({
                        ...newSlot,
                        days:
                          newSlot.days.length === 7
                            ? []
                            : [0, 1, 2, 3, 4, 5, 6],
                      })
                    }
                  >
                    <Text style={styles.labelActionText}>
                      {newSlot.days.length === 7 ? "Clear" : "All"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.daysGrid}>
                  {DAYS_FULL.map((day, idx) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayToggle,
                        newSlot.days.includes(idx) && styles.dayToggleActive,
                      ]}
                      onPress={() => {
                        const days = newSlot.days.includes(idx)
                          ? newSlot.days.filter((d) => d !== idx)
                          : [...newSlot.days, idx];
                        setNewSlot({ ...newSlot, days });
                      }}
                    >
                      <Text
                        style={[
                          styles.dayToggleText,
                          newSlot.days.includes(idx) &&
                            styles.dayToggleTextActive,
                        ]}
                      >
                        {day.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleCreateCourse}
                >
                  <Text style={styles.saveBtnText}>
                    Inject Track into Timetable
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MANAGE MODAL */}
      <Modal visible={!!managingSlotId} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentFull}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{editFormData?.course}</Text>
                <Text style={styles.modalSubtitle}>
                  {sysConfig.cohorts[editFormData?.cohort]}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setManagingSlotId(null)}
                style={styles.closeBtn}
              >
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.tabBarInner}>
              <TouchableOpacity
                style={[
                  styles.innerTab,
                  manageTab === "roster" && styles.innerTabActive,
                ]}
                onPress={() => setManageTab("roster")}
              >
                <Users
                  size={18}
                  color={manageTab === "roster" ? Colors.primary : "#94a3b8"}
                />
                <Text
                  style={[
                    styles.innerTabText,
                    manageTab === "roster" && styles.innerTabTextActive,
                  ]}
                >
                  Roster
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.innerTab,
                  manageTab === "schedule" && styles.innerTabActive,
                ]}
                onPress={() => setManageTab("schedule")}
              >
                <Settings
                  size={18}
                  color={manageTab === "schedule" ? Colors.primary : "#94a3b8"}
                />
                <Text
                  style={[
                    styles.innerTabText,
                    manageTab === "schedule" && styles.innerTabTextActive,
                  ]}
                >
                  Settings
                </Text>
              </TouchableOpacity>
            </View>

            {manageTab === "roster" ? (
              <View style={{ flex: 1 }}>
                <View style={styles.rosterWizard}>
                  <Text style={styles.wizardLabel}>Bulk Add Cohort:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 15 }}
                  >
                    {Object.entries(sysConfig.cohorts).map(([id, label]) => (
                      <TouchableOpacity
                        key={id}
                        style={styles.bulkPill}
                        onPress={() => bulkAddCohortToRoster(id)}
                      >
                        <Text style={styles.bulkPillText}>
                          + {label as string}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <View style={styles.rosterActions}>
                    <View style={styles.searchBarMini}>
                      <Search size={16} color="#94a3b8" />
                      <TextInput
                        style={styles.searchInputMini}
                        placeholder="Filter roster..."
                        value={rosterSearch}
                        onChangeText={setRosterSearch}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.addSingleBtn}
                      onPress={() => setShowSinglePicker(true)}
                    >
                      <UserPlus size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                <FlatList
                  data={filteredRoster}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.rosterRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rosterName}>{item.name}</Text>
                        <Text style={styles.rosterId}>{item.id}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeStudentsFromRoster([item.id])}
                        style={styles.removeBtn}
                      >
                        <X size={16} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  )}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>Roster is empty.</Text>
                  }
                />
              </View>
            ) : (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalForm}>
                  <Text style={styles.fieldLabel}>COURSE MODULE NAME</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editFormData?.course}
                    onChangeText={(t) =>
                      setEditFormData({ ...editFormData, course: t })
                    }
                    placeholder="e.g. BTH 101"
                  />

                  <Text style={styles.fieldLabel}>TARGET COHORT</Text>
                  <View style={styles.cohortGrid}>
                    {Object.entries(sysConfig.cohorts).map(([id, label]) => (
                      <TouchableOpacity
                        key={id}
                        style={[
                          styles.cohortOption,
                          editFormData?.cohort === parseInt(id) &&
                            styles.cohortOptionActive,
                        ]}
                        onPress={() =>
                          setEditFormData({
                            ...editFormData,
                            cohort: parseInt(id),
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.cohortOptionText,
                            editFormData?.cohort === parseInt(id) &&
                              styles.cohortOptionTextActive,
                          ]}
                        >
                          {label as string}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.inputGrid}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>START DATE</Text>
                      <TouchableOpacity
                        style={styles.modalInputTouch}
                        onPress={() => openPicker("date", "startDate")}
                      >
                        <Calendar size={18} color={Colors.primary} />
                        <Text style={styles.modalInputTouchText}>
                          {editFormData?.startDate}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>END DATE</Text>
                      <TouchableOpacity
                        style={styles.modalInputTouch}
                        onPress={() => openPicker("date", "endDate")}
                      >
                        <Calendar size={18} color={Colors.primary} />
                        <Text style={styles.modalInputTouchText}>
                          {editFormData?.endDate}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGrid}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>START TIME</Text>
                      <TouchableOpacity
                        style={styles.modalInputTouch}
                        onPress={() => openPicker("time", "start")}
                      >
                        <Clock size={18} color={Colors.primary} />
                        <Text style={styles.modalInputTouchText}>
                          {editFormData?.start}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>END TIME</Text>
                      <TouchableOpacity
                        style={styles.modalInputTouch}
                        onPress={() => openPicker("time", "end")}
                      >
                        <Clock size={18} color={Colors.primary} />
                        <Text style={styles.modalInputTouchText}>
                          {editFormData?.end}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>RECURRENCE DAYS</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setEditFormData({
                          ...editFormData,
                          days:
                            editFormData?.days?.length === 7
                              ? []
                              : [0, 1, 2, 3, 4, 5, 6],
                        })
                      }
                    >
                      <Text style={styles.labelActionText}>
                        {editFormData?.days?.length === 7 ? "Clear" : "All"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.daysGrid}>
                    {DAYS_FULL.map((day, idx) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayToggle,
                          editFormData?.days?.includes(idx) &&
                            styles.dayToggleActive,
                        ]}
                        onPress={() => {
                          const days = editFormData?.days?.includes(idx)
                            ? editFormData.days.filter((d: number) => d !== idx)
                            : [...(editFormData?.days || []), idx];
                          setEditFormData({ ...editFormData, days });
                        }}
                      >
                        <Text
                          style={[
                            styles.dayToggleText,
                            editFormData?.days?.includes(idx) &&
                              styles.dayToggleTextActive,
                          ]}
                        >
                          {day.substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleUpdateSchedule}
                  >
                    <Text style={styles.saveBtnText}>Save All Changes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteLink}
                    onPress={() =>
                      deleteScheduleSlot(managingSlotId!, editFormData?.course)
                    }
                    activeOpacity={0.7}
                  >
                    <Trash2
                      size={16}
                      color={Colors.danger}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.deleteLinkText}>
                      Permanently Delete Course Track
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* CUSTOM PICKER MODAL */}
      <Modal visible={pickerModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.pickerModalContent,
              pickerModal.type === "date" && {
                height: "auto",
                paddingBottom: 40,
              },
            ]}
          >
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                Select {pickerModal.type.toUpperCase()}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setPickerModal({ ...pickerModal, visible: false });
                  setPickerSearch("");
                }}
              >
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {pickerModal.type === "date" ? (
              renderCalendar()
            ) : (
              <View style={{ paddingBottom: 20 }}>
                {renderTimeAdjuster()}

                <View style={styles.timeDivider}>
                  <Text style={styles.timeDividerText}>OR QUICK SELECT</Text>
                </View>

                <View style={{ padding: 15 }}>
                  <View style={styles.searchBarMini}>
                    <Search size={16} color="#94a3b8" />
                    <TextInput
                      style={styles.searchInputMini}
                      placeholder="Filter times..."
                      value={pickerSearch}
                      onChangeText={setPickerSearch}
                    />
                  </View>
                </View>

                <FlatList
                  data={filteredTimeData}
                  keyExtractor={(item) => item}
                  style={{ maxHeight: 200 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.pickerItem}
                      onPress={() => handlePickerSelect(item)}
                    >
                      <Text style={styles.pickerItemText}>{item}</Text>
                      {(managingSlotId
                        ? editFormData[pickerModal.field]
                        : newSlot[pickerModal.field]) === item && (
                        <CheckSquare size={18} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* CUSTOM DELETE ALERT */}
      <Modal
        visible={deleteConfirmation.visible}
        transparent
        animationType="fade"
      >
        <View style={styles.alertOverlay}>
          <Animated.View
            entering={FadeInDown.springify()}
            style={styles.alertBox}
          >
            <View style={styles.alertIconWrapper}>
              <AlertTriangle size={32} color={Colors.danger} />
            </View>

            <Text style={styles.alertTitle}>Confirm Deletion</Text>
            <Text style={styles.alertMessage}>
              Are you sure you want to permanently remove{" "}
              <Text style={styles.alertStrong}>{deleteConfirmation.name}</Text>?
              This action cannot be undone and will wipe all associated student
              rosters.
            </Text>

            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.alertCancelBtn}
                onPress={() =>
                  setDeleteConfirmation({
                    ...deleteConfirmation,
                    visible: false,
                  })
                }
              >
                <Text style={styles.alertCancelText}>Keep Track</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.alertDeleteBtn}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.alertDeleteText}>Delete Permanently</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 2 : 2,
    paddingBottom: 50,
    backgroundColor: "#fff",
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  screenTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  searchArea: { paddingHorizontal: 20, marginBottom: 20 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },

  list: { paddingHorizontal: 20 },
  slotCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  courseHeader: { flex: 1, gap: 6 },
  courseNameText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1e293b",
    letterSpacing: -0.2,
  },
  cohortPill: {
    alignSelf: "flex-start",
    backgroundColor: "#0f172a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cohortPillText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  manageBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.blue50,
    alignItems: "center",
    justifyContent: "center",
  },

  cardDetails: { flexDirection: "row", gap: 20, marginBottom: 15 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 13, fontWeight: "700", color: "#64748b" },

  daysStrip: { flexDirection: "row", gap: 6 },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  dayBadgeText: { fontSize: 11, fontWeight: "800", color: "#94a3b8" },

  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    padding: 40,
    fontSize: 14,
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  modalContentFull: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: { fontSize: 20, fontWeight: "900", color: "#0f172a" },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.primary,
    marginTop: 2,
    textTransform: "uppercase",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: { padding: 24 },
  modalForm: { gap: 18, paddingBottom: 40 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1,
  },
  modalInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 15,
    fontSize: 16,
    fontWeight: "600",
  },
  modalInputTouch: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 55,
  },
  modalInputTouchText: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  cohortGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cohortOption: {
    flex: 1,
    minWidth: "45%",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cohortOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cohortOptionText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  cohortOptionTextActive: { color: "#fff" },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.blue50,
    padding: 15,
    borderRadius: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: { backgroundColor: Colors.primary },
  toggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
    flex: 1,
  },

  inputGrid: { flexDirection: "row", gap: 12 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  labelActionText: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.primary,
    textTransform: "uppercase",
  },

  daysGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayToggle: {
    width: "22%",
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dayToggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayToggleText: { fontSize: 12, fontWeight: "800", color: "#94a3b8" },
  dayToggleTextActive: { color: "#fff" },

  saveBtn: {
    backgroundColor: Colors.primary,
    height: 55,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  saveBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  tabBarInner: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  innerTab: {
    flex: 1,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  innerTabActive: { borderBottomWidth: 3, borderBottomColor: Colors.primary },
  innerTabText: { fontSize: 14, fontWeight: "800", color: "#94a3b8" },
  innerTabTextActive: { color: Colors.primary },

  rosterWizard: {
    padding: 20,
    backgroundColor: "#fcfdfe",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  wizardLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94a3b8",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  bulkPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 8,
  },
  bulkPillText: { fontSize: 11, fontWeight: "800", color: Colors.primary },
  rosterActions: { flexDirection: "row", gap: 10 },
  searchBarMini: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 45,
  },
  searchInputMini: { flex: 1, marginLeft: 8, fontSize: 14, fontWeight: "600" },
  addSingleBtn: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  rosterRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  rosterName: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  rosterId: { fontSize: 11, fontWeight: "800", color: "#94a3b8", marginTop: 1 },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    padding: 15,
  },
  deleteLinkText: { color: Colors.danger, fontWeight: "800", fontSize: 13 },

  pickerModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "50%",
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
    textTransform: "uppercase",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  pickerItemText: { fontSize: 15, fontWeight: "700", color: "#334155" },

  timeAdjusterContainer: { padding: 20, alignItems: "center" },
  adjusterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 20,
  },
  adjusterCol: { alignItems: "center", gap: 8 },
  adjBtn: {
    width: 50,
    height: 40,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  adjDisplay: {
    width: 70,
    height: 70,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    borderWIdth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  adjText: { fontSize: 32, fontWeight: "900", color: "#0f172a" },
  adjLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1,
  },
  adjSeparator: {
    fontSize: 32,
    fontWeight: "900",
    color: "#cbd5e1",
    marginBottom: 20,
  },
  adjConfirmBtn: {
    backgroundColor: Colors.primary,
    width: "100%",
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  adjConfirmText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  timeDivider: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  timeDividerText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#cbd5e1",
    letterSpacing: 1,
  },

  calendarContainer: { padding: 20 },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  monthDisplay: { alignItems: "center" },
  calendarMonthName: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  calendarYearName: { fontSize: 12, fontWeight: "700", color: "#94a3b8" },
  calNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarWeekDays: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  calendarWeekDayText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94a3b8",
    width: 40,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  calendarDay: {
    width: "14.28%",
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginVertical: 2,
  },
  calendarDayEmpty: { width: "14.28%", height: 45, marginVertical: 2 },
  calendarDayText: { fontSize: 14, fontWeight: "700", color: "#334155" },

  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertBox: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  alertIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    fontWeight: "500",
  },
  alertStrong: {
    color: "#1e293b",
    fontWeight: "800",
  },
  alertActions: {
    width: "100%",
    gap: 12,
  },
  alertDeleteBtn: {
    width: "100%",
    height: 52,
    backgroundColor: Colors.danger,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  alertDeleteText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  alertCancelBtn: {
    width: "100%",
    height: 52,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  alertCancelText: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "700",
  },
} as any);
