// FILE: studentServices.ts
import axios from "axios";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import api from "./api";

export type Student = {
  id: string;
  name: string;
  cohort: string;
  payment_status?: string;
};

// Convert app format → PHP API format
const mapToApi = (student: Student) => ({
  student_id: student.id,
  name: student.name,
  class: student.cohort,
  payment_status: student.payment_status || "Pending",
});

// Convert PHP API format → app format
const mapFromApi = (student: any): Student => ({
  id: String(student.student_id),
  name: student.name,
  cohort: String(student.class),
  payment_status: student.payment_status || "Pending",
});

export async function getStudents() {
  try {
    const { data } = await api.get("/students/getStudents.php");
    console.log("Students API:", data);

    if (data?.success && data.data) {
      data.data = data.data.map(mapFromApi);
    }
    return data;
  } catch (err: any) {
    console.error("Get students error:", err.response?.data || err.message);
    throw err;
  }
}

export async function getApiHealth() {
  try {
    const { data } = await api.get("/health.php");
    return data;
  } catch (err: any) {
    console.error("Health error:", err.response?.data || err.message);
    throw err;
  }
}

export async function createStudent(student: Student) {
  try {
    const payload = mapToApi(student);
    const { data } = await api.post("/students/addStudent.php", payload);
    return data;
  } catch (err: any) {
    console.error("Create student error:", err.response?.data || err.message);
    throw err;
  }
}

export async function updateStudent(student: Student) {
  try {
    const payload = mapToApi(student);
    // Use POST for PHP compatibility
    const { data } = await api.post("/students/updateStudent.php", payload);
    return data;
  } catch (err: any) {
    console.error("Update student error:", err.response?.data || err.message);
    throw err;
  }
}

export async function deleteStudent(studentId: string | number) {
  try {
    console.log("Attempting to delete student:", studentId);
    const { data } = await api.post("/students/deleteStudent.php", {
      student_id: String(studentId),
    });
    console.log("Delete student response:", data);
    return data;
  } catch (err: any) {
    console.error(
      "Delete student error details:",
      err.response?.data || err.message,
    );
    throw err;
  }
}

export async function bulkCreateStudents(students: Student[], config: any) {
  try {
    // Mapping payload for PHP consistency
    const payload = {
      students: students.map((s) => ({
        student_id: String(s.id),
        name: String(s.name),
        class: String(s.cohort),
        payment_status: s.payment_status || "Pending",
      })),
    };

    // Use the base URL from your 'api' instance, or if you need to use
    // the 'config.apiUrl' dynamically, ensure your axios instance is configured to use it.
    const { data } = await axios.post(
      `${config.apiUrl}/students/bulkAddStudents.php`,
      payload,
    );

    return data;
  } catch (err: any) {
    console.error(
      "Bulk create students error:",
      err.response?.data || err.message,
    );
    throw err;
  }
}

export async function bulkDeleteStudents(studentIds: string[]) {
  try {
    const { data } = await api.post("/students/bulkDeleteStudents.php", {
      student_ids: studentIds,
    });
    return data;
  } catch (err: any) {
    console.error(
      "Bulk delete students error:",
      err.response?.data || err.message,
    );
    throw err;
  }
}

export async function exportStudentsCsv(
  students: Student[],
  fileName = "students-export.csv",
) {
  try {
    const rows = [
      ["id", "name", "cohort", "payment_status"],
      ...students.map((student) => [
        student.id,
        student.name,
        student.cohort,
        student.payment_status || "Pending",
      ]),
    ];

    const csvContent = rows
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const fileUri = (FileSystem as any).documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, csvContent);

    await Sharing.shareAsync(fileUri);
  } catch (err) {
    console.log("CSV export error:", err);
  }
}
