// app/index.tsx
import { Redirect } from "expo-router";
import { useAuth } from "@/src/features/auth/AuthProvider";

export default function Index() {
  DefaultLogins();
  return <Redirect href="/(auth)/login" />;
}

async function DefaultLogins() {
  const { register, logout } = useAuth();

  try {
    await register('test@email.com', 'test123!', 'Test_User', false);
    await logout();
  } catch (e: any) {
    if (e.message !== 'Email already in use') throw e;
    console.log('Default user already exists, skipping registration.');
  }

  try {
    await register('admin@email.com', 'admin123!', 'Admin_User', true);
    //await logout();
  } catch (e: any) {
    if (e.message !== 'Email already in use') throw e;
    console.log('Default admin user already exists, skipping registration.');
  }
}