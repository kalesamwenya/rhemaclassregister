<?php
require_once '../config/Api.php';
$data = readJsonInput();
$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');
$role = trim($data['role'] ?? 'student');

$validCredentials = [
    'admin' => ['email' => 'admin@rhema.com', 'password' => 'admin123'],
    'student' => ['email' => 'student@rhema.com', 'password' => 'student123'],
];

if (isset($validCredentials[$role])) {
    $expected = $validCredentials[$role];
    if ($email === $expected['email'] && $password === $expected['password']) {
        sendJson([
            'success' => true,
            'user' => [
                'id' => $role,
                'name' => ucfirst($role) . ' User',
                'role' => $role
            ]
        ]);
    }
}
sendJson(['success' => false, 'message' => 'Invalid credentials'], 401);
