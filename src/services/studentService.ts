import api from './api';

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
  payment_status: student.payment_status || 'Pending',
});

// Convert PHP API format → app format
const mapFromApi = (student: any): Student => ({
  id: String(student.student_id),
  name: student.name,
  cohort: String(student.class),
  payment_status: student.payment_status || 'Pending',
});

export async function getStudents() {
  try {
    const { data } = await api.get('/students/getStudents.php');
    console.log('Students API:', data);

    if (data?.success && data.data) {
      data.data = data.data.map(mapFromApi);
    }
    return data;
  } catch (err: any) {
    console.error('Get students error:', err.response?.data || err.message);
    throw err;
  }
}

export async function getApiHealth() {
  try {
    const { data } = await api.get('/health.php');
    return data;
  } catch (err: any) {
    console.error('Health error:', err.response?.data || err.message);
    throw err;
  }
}

export async function createStudent(student: Student) {
  try {
    const payload = mapToApi(student);
    const { data } = await api.post('/students/addStudent.php', payload);
    return data;
  } catch (err: any) {
    console.error('Create student error:', err.response?.data || err.message);
    throw err;
  }
}

export async function updateStudent(student: Student) {
  try {
    const payload = mapToApi(student);
    const { data } = await api.put('/students/updateStudent.php', payload);
    return data;
  } catch (err: any) {
    console.error('Update student error:', err.response?.data || err.message);
    throw err;
  }
}

export async function deleteStudent(studentId: string | number) {
  try {
    console.log('Attempting to delete student:', studentId);
    const { data } = await api.post('/students/deleteStudent.php', {
      student_id: String(studentId)
    });
    console.log('Delete student response:', data);
    return data;
  } catch (err: any) {
    console.error('Delete student error details:', err.response?.data || err.message);
    throw err;
  }
}

export function exportStudentsCsv(students: Student[], fileName = 'students-export.csv') {
  const rows = [
    ['id', 'name', 'cohort', 'payment_status'],
    ...students.map((student) => [
      student.id,
      student.name,
      student.cohort,
      student.payment_status || 'Pending',
    ]),
  ];

  const csvContent = rows
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
