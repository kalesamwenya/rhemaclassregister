import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
    AlertTriangle,
    ArrowLeft,
    CheckSquare,
    ChevronLeft,
    ChevronRight,
    Download,
    FileSpreadsheet,
    Pencil,
    Plus,
    Search,
    Square,
    Trash2,
    Users,
    X,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
    Alert,
    Dimensions,
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

const { width } = Dimensions.get("window");

export default function AdminStudentsScreen() {
  const router = useRouter();
  const {
    students,
    sysConfig,
    registerStudent,
    bulkRegisterStudents,
    removeStudent,
    bulkRemoveStudents,
    paymentStatus,
    updateStudentPaymentStatus,
    getPaymentSummary,
    isPaymentCurrent,
    downloadBackup,
    schedule,
    courseEnrollments,
    saveAllEnrollments,
    apiStatus,
  } = useAppContext();

  const [search, setSearch] = useState("");
  const [cohortFilter, setCohortFilter] = useState("all");
  const [sortKey, setSortKey] = useState<"id" | "name" | "cohort" | "payment">(
    "name",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isModalVisible, setModalVisible] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ id: "", name: "", cohort: "1" });

  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);

  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
    itemName?: string;
  }>({
    visible: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handlePaymentUpdate = async (status: string) => {
    if (activePaymentId) {
      await updateStudentPaymentStatus(activePaymentId, status);
      setPaymentModalVisible(false);
    }
  };

  const PAYMENT_OPTIONS = [
    { value: "Paid", label: "All 4 Terms" },
    { value: "Term 1", label: "Term 1 Only" },
    { value: "Term 2", label: "Term 2 Only" },
    { value: "Term 3", label: "Term 3 Only" },
    { value: "Term 4", label: "Term 4 Only" },
    { value: "Pending", label: "No Payment" },
  ];

  const allRows = useMemo(() => {
    return Object.entries(students)
      .map(([id, s]) => {
        // Robust track/cohort identification: prioritize 'cohort', then 'class', default to '1'
        let rawCohort = s.cohort ?? s.class ?? "1";
        let cohortStr = String(rawCohort).trim();

        // Standardize: If the value is a label (e.g. "FYM") rather than an ID ("1"),
        // resolve it back to the ID so filtering and icons work correctly.
        if (sysConfig.cohorts) {
          const matchedEntry = Object.entries(sysConfig.cohorts).find(
            ([cid, label]) =>
              String(label).toLowerCase() === cohortStr.toLowerCase(),
          );
          if (matchedEntry) {
            cohortStr = matchedEntry[0];
          }
        }

        return {
          id: String(id),
          name: s.name || "Unnamed Student",
          cohort: cohortStr,
          payment: paymentStatus[id] || "Pending",
        };
      })
      .filter((row) => {
        const cohortLabel = sysConfig.cohorts[row.cohort] || row.cohort;
        const matchesSearch =
          !search ||
          row.id.toLowerCase().includes(search.toLowerCase()) ||
          row.name.toLowerCase().includes(search.toLowerCase()) ||
          String(cohortLabel).toLowerCase().includes(search.toLowerCase());

        // Categorize by tab selection
        const matchesFilter =
          cohortFilter === "all" || String(row.cohort) === String(cohortFilter);

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "id") return dir * a.id.localeCompare(b.id);
        if (sortKey === "cohort") {
          const valA = parseInt(a.cohort) || 0;
          const valB = parseInt(b.cohort) || 0;
          return dir * (valA - valB);
        }
        if (sortKey === "payment")
          return dir * a.payment.localeCompare(b.payment);
        return dir * a.name.localeCompare(b.name);
      });
  }, [
    students,
    search,
    cohortFilter,
    sortKey,
    sortDir,
    paymentStatus,
    sysConfig.cohorts,
  ]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allRows.slice(start, start + pageSize);
  }, [allRows, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(allRows.length / pageSize));

  const exportCsvContent = async (csvContent: string, fileName: string) => {
    if (Platform.OS === "web") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    try {
      const directory =
        FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
      const fileUri = `${directory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isShareAvailable = await Sharing.isAvailableAsync();
      if (isShareAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: `Export ${fileName}`,
        });
      } else {
        Alert.alert("Saved", `CSV was written to ${fileUri}`);
      }
    } catch (e) {
      console.error("CSV export failed:", e);
      Alert.alert("Error", "Failed to export students");
    }
  };

  const exportStudentsCSV = async () => {
    if (allRows.length === 0) {
      Alert.alert("No Data", "No students match your selection.");
      return;
    }

    const header = "Student ID,Name,Cohort,Payment Status\n";
    const rows = allRows
      .map(
        (r) =>
          `"${r.id}","${r.name}","${sysConfig.cohorts[r.cohort] || r.cohort}","${r.payment}"`,
      )
      .join("\n");

    const csvContent = header + rows;
    const fileName = `Student_Registry.csv`;
    await exportCsvContent(csvContent, fileName);
  };

  const handleBulkCSVImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "application/vnd.ms-excel", "text/plain"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      setIsProcessing(true);
      const fileUri = result.assets[0].uri;
      const csvText = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const lines = csvText.split(/\r?\n/);
      const studentsToImport: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const columns = line.split(",");
        if (columns.length >= 2) {
          const rawId = columns[0].trim().replace(/["']/g, "");
          const rawName = columns[1].trim().replace(/["']/g, "");
          let rawCohortText =
            columns.length >= 3 ? columns[2].trim().toLowerCase() : "1";

          if (i === 0 && rawId.toLowerCase().includes("id")) continue;

          let det = 1;
          if (
            rawCohortText.includes("evening") ||
            rawCohortText.includes("eve") ||
            rawCohortText.includes(sysConfig.cohorts[2].toLowerCase()) ||
            rawCohortText.includes(sysConfig.cohorts[4].toLowerCase())
          ) {
            det =
              rawCohortText.includes("second") ||
              rawCohortText.includes("2nd") ||
              rawCohortText.includes("y2")
                ? 4
                : 2;
          } else if (
            rawCohortText.includes("second") ||
            rawCohortText.includes("2nd") ||
            rawCohortText.includes("y2")
          ) {
            det = 3;
          }
          if (rawId && rawName) {
            studentsToImport.push({
              id: rawId,
              name: rawName,
              cohort: sysConfig.cohorts[det] || String(det), // Convert numeric to cohort name string
              class: det, // Keep numeric for API
            });
          }
        }
      }

      if (studentsToImport.length > 0) {
        await bulkRegisterStudents(studentsToImport);
      }

      // Merge current local state with imported data for immediate enrollment syncing
      const allStudentsMap = { ...students };
      studentsToImport.forEach((s) => {
        allStudentsMap[s.id] = s;
      });

      const updatedEnrollments = { ...courseEnrollments };
      schedule.forEach((slot) => {
        if (!updatedEnrollments[slot.id]) updatedEnrollments[slot.id] = [];
        Object.keys(allStudentsMap).forEach((id) => {
          // Handle both string cohorts (e.g., "FYM") and numeric (e.g., 1)
          let studentCohortNumeric = allStudentsMap[id].cohort;
          if (typeof studentCohortNumeric === "string") {
            // Map cohort name back to numeric ID
            const found = Object.entries(sysConfig.cohorts).find(
              ([_, name]) => name === studentCohortNumeric,
            );
            studentCohortNumeric = found
              ? found[0]
              : String(studentCohortNumeric);
          }
          if (
            parseInt(String(studentCohortNumeric)) === parseInt(slot.cohort)
          ) {
            if (!updatedEnrollments[slot.id].includes(id))
              updatedEnrollments[slot.id].push(id);
          }
        });
      });
      await saveAllEnrollments(updatedEnrollments);

      setIsProcessing(false);
      Alert.alert(
        "Success",
        `Import complete. Synced ${studentsToImport.length} students to API.`,
      );
    } catch (error) {
      setIsProcessing(false);
      Alert.alert("Error", "Failed to process CSV file.");
    }
  };

  const handleBulkDelete = () => {
    setCustomAlert({
      visible: true,
      title: "Bulk Deletion",
      message: `Are you sure you want to permanently delete ${selectedIds.length} selected profiles? This will remove all their records from the system.`,
      isDanger: true,
      onConfirm: async () => {
        setCustomAlert((prev) => ({ ...prev, visible: false }));
        setIsProcessing(true);
        try {
          await bulkRemoveStudents(selectedIds);
          setSelectedIds([]);
          setPage(1);
        } catch (err) {
          Alert.alert(
            "Error",
            "Some students could not be deleted from the server.",
          );
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const handleSave = async () => {
    if (!formData.id || !formData.name) {
      Alert.alert("Required", "Please enter both ID and Full Name");
      return;
    }
    setIsProcessing(true);
    if (editingStudentId && editingStudentId !== formData.id) {
      await removeStudent(editingStudentId);
    }
    await registerStudent({
      id: formData.id,
      name: formData.name,
      cohort: parseInt(formData.cohort),
      class: parseInt(formData.cohort),
    });
    setIsProcessing(false);
    setModalVisible(false);
  };

  const toggleSort = (key: "id" | "name" | "cohort" | "payment") => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isSelected = selectedIds.includes(item.id);
    const paySum = getPaymentSummary(item.payment);
    const isCurrent = isPaymentCurrent(item.id);

    const badgeStyle =
      paySum.status === "all-paid"
        ? styles.badgePaid
        : isCurrent
          ? styles.badgeCurrent
          : paySum.status === "partial"
            ? styles.badgePartial
            : styles.badgePending;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).springify()}
        layout={Layout.springify()}
        style={[styles.inlineRow, isSelected && styles.rowSelected]}
      >
        <TouchableOpacity
          onPress={() =>
            setSelectedIds((prev) =>
              prev.includes(item.id)
                ? prev.filter((x) => x !== item.id)
                : [...prev, item.id],
            )
          }
          style={styles.checkCol}
        >
          {isSelected ? (
            <CheckSquare size={20} color={Colors.primary} />
          ) : (
            <Square size={20} color={Colors.textLighter} />
          )}
        </TouchableOpacity>

        <View style={styles.idCol}>
          <Text style={styles.inlineId}>{item.id}</Text>
        </View>

        <View style={styles.nameCol}>
          <Text style={styles.inlineName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={styles.inlineCohort}>
              {sysConfig.cohorts[item.cohort] || item.cohort}
            </Text>
            {isCurrent && paySum.status !== "all-paid" && (
              <View style={styles.currentIndicator}>
                <Text style={styles.currentIndicatorText}>CURRENT</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.payCol}
          onPress={() => {
            setActivePaymentId(item.id);
            setPaymentModalVisible(true);
          }}
        >
          <View style={[styles.inlineBadge, badgeStyle]}>
            <Text style={styles.badgeText}>{paySum.label}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actionCol}>
          <TouchableOpacity
            onPress={() => {
              setEditingStudentId(item.id);
              setFormData({
                id: item.id,
                name: item.name,
                cohort: item.cohort,
              });
              setModalVisible(true);
            }}
            style={styles.inlineIconBtn}
          >
            <Pencil size={14} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setCustomAlert({
                visible: true,
                title: "Delete Student",
                message: "Permanently remove ",
                itemName: `${item.name} (${item.id})`,
                isDanger: true,
                onConfirm: async () => {
                  setCustomAlert((prev) => ({ ...prev, visible: false }));
                  setIsProcessing(true);
                  try {
                    await removeStudent(item.id);
                  } finally {
                    setIsProcessing(false);
                  }
                },
              });
            }}
            style={styles.inlineIconBtn}
          >
            <Trash2 size={14} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {isProcessing && <SplashScreen message="Syncing registers..." />}

      <Animated.View entering={SlideInRight} style={styles.screenHeader}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={styles.backBtn}
          >
            <ArrowLeft size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Users size={24} color={Colors.primary} />
          <Text style={styles.screenTitle}>Registry</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: Colors.success }]}
            onPress={exportStudentsCSV}
          >
            <Download size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setEditingStudentId(null);
              setFormData({ id: "", name: "", cohort: "1" });
              setModalVisible(true);
            }}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView stickyHeaderIndices={[2]} style={{ flex: 1 }}>
        <View style={styles.csvImportSection}>
          <TouchableOpacity
            style={styles.csvDropZone}
            onPress={handleBulkCSVImport}
          >
            <FileSpreadsheet size={28} color={Colors.primary} />
            <View>
              <Text style={styles.csvMainText}>Bulk Import Students</Text>
              <Text style={styles.csvSubText}>
                Tap to select a .CSV roster file
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerArea}>
          <View style={styles.searchBar}>
            <Search size={18} color={Colors.textLighter} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search names or IDs..."
              placeholderTextColor={Colors.textLighter}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cohortTabs}
          >
            <TouchableOpacity
              onPress={() => setCohortFilter("all")}
              style={[styles.tab, cohortFilter === "all" && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  cohortFilter === "all" && styles.tabTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {Object.entries(sysConfig.cohorts).map(([id, label]) => (
              <TouchableOpacity
                key={id}
                onPress={() => setCohortFilter(id)}
                style={[styles.tab, cohortFilter === id && styles.tabActive]}
              >
                <Text
                  style={[
                    styles.tabText,
                    cohortFilter === id && styles.tabTextActive,
                  ]}
                >
                  {label as string}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.tableHeader}>
          <View style={styles.checkCol} />
          <TouchableOpacity
            style={styles.idCol}
            onPress={() => toggleSort("id")}
          >
            <Text style={styles.headerLabel}>
              ID {sortKey === "id" && (sortDir === "asc" ? "↑" : "↓")}
            </Text>
          </TouchableOpacity>
          <View style={styles.nameCol}>
            <View style={{ flexDirection: "row", gap: 15 }}>
              <TouchableOpacity onPress={() => toggleSort("name")}>
                <Text style={styles.headerLabel}>
                  STUDENT{" "}
                  {sortKey === "name" && (sortDir === "asc" ? "↑" : "↓")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleSort("cohort")}>
                <Text style={styles.headerLabel}>
                  TRACK{" "}
                  {sortKey === "cohort" && (sortDir === "asc" ? "↑" : "↓")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles.payCol}
            onPress={() => toggleSort("payment")}
          >
            <Text style={styles.headerLabel}>
              STATUS {sortKey === "payment" && (sortDir === "asc" ? "↑" : "↓")}
            </Text>
          </TouchableOpacity>
          <View style={styles.actionCol} />
        </View>

        {selectedIds.length > 0 && (
          <Animated.View entering={FadeInDown} style={styles.selectionBar}>
            <Text style={styles.selectionText}>
              {selectedIds.length} profiles selected
            </Text>
            <TouchableOpacity
              style={styles.bulkDeleteBtn}
              onPress={handleBulkDelete}
            >
              <Text style={styles.bulkDeleteText}>Delete</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <FlatList
          scrollEnabled={false}
          data={pagedRows}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No students matched filters.</Text>
          }
        />

        <View style={styles.paginationRow}>
          <View style={styles.pagination}>
            <TouchableOpacity
              disabled={page === 1}
              onPress={() => setPage(page - 1)}
              style={styles.pageBtn}
            >
              <ChevronLeft
                size={20}
                color={page === 1 ? "#cbd5e1" : Colors.primary}
              />
            </TouchableOpacity>
            <Text style={styles.pageInfo}>
              {page} of {totalPages}
            </Text>
            <TouchableOpacity
              disabled={page >= totalPages}
              onPress={() => setPage(page + 1)}
              style={styles.pageBtn}
            >
              <ChevronRight
                size={20}
                color={page >= totalPages ? "#cbd5e1" : Colors.primary}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.backupBtn} onPress={downloadBackup}>
            <Download size={16} color={Colors.primary} />
            <Text style={styles.backupText}>Backup</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Profile Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingStudentId ? "Edit Profile" : "Register Student"}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>SYSTEM IDENTIFIER (ID)</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.id}
                onChangeText={(t) => setFormData({ ...formData, id: t })}
                placeholder="e.g. 1024"
                placeholderTextColor={Colors.textLighter}
                keyboardType="numeric"
              />
              <Text style={styles.fieldLabel}>LEGAL FULL NAME</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
                placeholder="Enter name..."
                placeholderTextColor={Colors.textLighter}
              />
              <Text style={styles.fieldLabel}>ASSIGNED TRACK GROUP</Text>
              <View style={styles.cohortGrid}>
                {Object.entries(sysConfig.cohorts).map(([id, label]) => (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.cohortOption,
                      formData.cohort === id && styles.cohortOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, cohort: id })}
                  >
                    <Text
                      style={[
                        styles.cohortOptionText,
                        formData.cohort === id && styles.cohortOptionTextActive,
                      ]}
                    >
                      {label as string}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>
                  {editingStudentId ? "Update Profile" : "Create Student"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={isPaymentModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={[
            styles.modalOverlay,
            { backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center" },
          ]}
          activeOpacity={1}
          onPress={() => setPaymentModalVisible(false)}
        >
          <View style={styles.paymentModal}>
            <Text style={styles.paymentTitle}>Update Enrollment Status</Text>
            {PAYMENT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.payOption}
                onPress={() => handlePaymentUpdate(opt.value)}
              >
                <View
                  style={[
                    styles.optionDot,
                    paymentStatus[activePaymentId!] === opt.value &&
                      styles.optionDotActive,
                  ]}
                />
                <Text style={styles.payOptionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* CUSTOM ALERT MODAL */}
      <Modal visible={customAlert.visible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <Animated.View
            entering={FadeInDown.springify()}
            style={styles.alertBox}
          >
            <View
              style={[
                styles.alertIconWrapper,
                customAlert.isDanger && { backgroundColor: "#fee2e2" },
              ]}
            >
              <AlertTriangle
                size={32}
                color={customAlert.isDanger ? Colors.danger : Colors.primary}
              />
            </View>

            <Text style={styles.alertTitle}>{customAlert.title}</Text>
            <Text style={styles.alertMessage}>
              {customAlert.message}
              {customAlert.itemName && (
                <Text style={styles.alertStrong}>{customAlert.itemName}</Text>
              )}
              {customAlert.itemName && "?"}
            </Text>

            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.alertCancelBtn}
                onPress={() =>
                  setCustomAlert({ ...customAlert, visible: false })
                }
              >
                <Text style={styles.alertCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.alertDeleteBtn,
                  customAlert.isDanger && { backgroundColor: Colors.danger },
                ]}
                onPress={customAlert.onConfirm}
              >
                <Text style={styles.alertDeleteText}>Confirm Action</Text>
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
  overlayLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.9)",
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    fontWeight: "800",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 2 : 2,
    paddingBottom: 10,
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

  csvImportSection: { paddingHorizontal: 20, marginBottom: 15 },
  csvDropZone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.blue50,
    borderWidth: 1,
    borderColor: Colors.blue100,
  },
  csvMainText: { fontSize: 15, fontWeight: "800", color: Colors.primary },
  csvSubText: { fontSize: 11, color: Colors.textLighter, fontWeight: "600" },

  headerArea: { paddingHorizontal: 20, marginBottom: 15 },
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

  filterBar: { marginBottom: 15 },
  cohortTabs: { paddingHorizontal: 20, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  tabTextActive: { color: "#fff" },

  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.5,
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  rowSelected: { backgroundColor: "#eff6ff" },
  checkCol: { width: 35 },
  idCol: { width: 65 },
  nameCol: { flex: 1, paddingRight: 10 },
  payCol: { width: 100, alignItems: "center" },
  actionCol: {
    width: 60,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },

  inlineId: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    fontWeight: "800",
    color: Colors.primary,
  },
  inlineName: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  inlineCohort: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "700",
    marginTop: 1,
  },

  inlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  badgeText: { fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  badgePaid: { backgroundColor: "#dcfce7", color: "#15803d" },
  badgeCurrent: { backgroundColor: "#e0f2fe", color: "#0369a1" },
  badgePartial: { backgroundColor: "#fef3c7", color: "#b45309" },
  badgePending: { backgroundColor: "#fee2e2", color: "#b91c1c" },

  currentIndicator: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#86efac",
  },
  currentIndicatorText: { fontSize: 7, fontWeight: "900", color: "#166534" },

  inlineIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },

  selectionBar: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    backgroundColor: "#fee2e2",
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectionText: { fontSize: 12, fontWeight: "800", color: "#b91c1c" },
  bulkDeleteBtn: {
    backgroundColor: "#b91c1c",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bulkDeleteText: { color: "#fff", fontSize: 11, fontWeight: "bold" },

  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    padding: 40,
    fontSize: 14,
    fontWeight: "600",
  },

  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  pagination: { flexDirection: "row", alignItems: "center", gap: 15 },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  pageInfo: { fontSize: 13, fontWeight: "800", color: "#1e293b" },
  backupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.blue50,
  },
  backupText: { fontSize: 12, color: Colors.primary, fontWeight: "800" },

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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: { padding: 24, gap: 15 },
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
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 55,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  saveBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  paymentModal: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 10,
  },
  payOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
  },
  optionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  payOptionText: { fontSize: 15, color: "#1e293b", fontWeight: "700" },

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
    backgroundColor: "#eff6ff",
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
    backgroundColor: Colors.primary,
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
