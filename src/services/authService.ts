export async function loginToApp(email: string, password: string, role: 'admin' | 'student') {
  const validAdmin = email === 'admin@rhema.com' && password === 'admin123';
  const validStudent = email === 'student@rhema.com' && password === 'student123';

  if ((role === 'admin' && validAdmin) || (role === 'student' && validStudent)) {
    return {
      success: true,
      user: {
        id: role === 'admin' ? 'admin' : 'student',
        name: role === 'admin' ? 'Admin User' : 'Student User',
        role,
      },
    };
  }

  return { success: false, message: 'Invalid credentials' };
}
