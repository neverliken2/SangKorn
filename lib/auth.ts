// Admin authentication utilities
// Version: 2026-02-28
import { supabase } from './supabase';
import { IS_MOCK_MODE, mockAdmin } from './mock';

// Simple hash function for password (in production, use bcrypt on server-side)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Verify password
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

// Admin login
export const adminLogin = async (email: string, password: string) => {
  // Mock mode - accept test credentials
  if (IS_MOCK_MODE) {
    if (email === '111' && password === '111') {
      return { success: true, admin: mockAdmin };
    }
    return { success: false, error: 'Invalid email or password' };
  }

  try {
    // Get admin by email
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Verify password
    const isValid = await verifyPassword(password, admin.password_hash);
    if (!isValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Update last login
    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // Return admin data (without password)
    const { password_hash: _, ...adminData } = admin;
    return { success: true, admin: adminData };
  } catch (error) {
    console.error('Admin login error:', error);
    return { success: false, error: 'Login failed' };
  }
};

// Create admin (for initial setup)
export const createAdmin = async (email: string, password: string, name: string, role: 'admin' | 'super_admin' = 'admin') => {
  try {
    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase
      .from('admins')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name,
        role,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating admin:', error);
      return { success: false, error: error.message };
    }

    const { password_hash: _, ...adminData } = data;
    return { success: true, admin: adminData };
  } catch (error) {
    console.error('Create admin error:', error);
    return { success: false, error: 'Failed to create admin' };
  }
};

// Change admin password
export const changeAdminPassword = async (adminId: string, currentPassword: string, newPassword: string) => {
  try {
    // Get admin
    const { data: admin, error } = await supabase
      .from('admins')
      .select('password_hash')
      .eq('id', adminId)
      .single();

    if (error || !admin) {
      return { success: false, error: 'Admin not found' };
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, admin.password_hash);
    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Update password
    const newPasswordHash = await hashPassword(newPassword);
    const { error: updateError } = await supabase
      .from('admins')
      .update({ password_hash: newPasswordHash })
      .eq('id', adminId);

    if (updateError) {
      return { success: false, error: 'Failed to update password' };
    }

    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: 'Failed to change password' };
  }
};

// Admin session storage key
const ADMIN_SESSION_KEY = 'admin_session';

// Save admin session
export const saveAdminSession = (admin: { id: string; email: string; name: string; role: string }) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(admin));
  }
};

// Get admin session
export const getAdminSession = (): { id: string; email: string; name: string; role: string } | null => {
  if (typeof window !== 'undefined') {
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    return session ? JSON.parse(session) : null;
  }
  return null;
};

// Clear admin session
export const clearAdminSession = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
};

// Check if admin is logged in
export const isAdminLoggedIn = (): boolean => {
  return getAdminSession() !== null;
};
