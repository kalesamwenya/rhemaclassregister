'use client';

import { useCallback, useEffect, useState } from 'react';
import { createStudent, getStudents, updateStudent, type Student } from '../services/studentService';

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getStudents();
      if (response?.success) {
        setStudents(response.data || []);
      } else {
        setError(response?.message || 'Unable to load students');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const saveStudent = async (student: Student) => {
    try {
      const response = await createStudent(student);
      if (response?.success) {
        await loadStudents();
        return { success: true, message: 'Student added successfully' };
      }
      return { success: false, message: response?.message || 'Could not add student' };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Could not add student' };
    }
  };

  const editStudent = async (student: Student) => {
    try {
      const response = await updateStudent(student);
      if (response?.success) {
        await loadStudents();
        return { success: true, message: 'Student updated successfully' };
      }
      return { success: false, message: response?.message || 'Could not update student' };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Could not update student' };
    }
  };

  return { students, loading, error, loadStudents, saveStudent, editStudent };
}
