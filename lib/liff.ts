import liff from '@line/liff';
import { IS_MOCK_MODE, mockLineProfile } from './mock';

const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '';

export const initializeLiff = async () => {
  // Mock mode - skip LIFF initialization
  if (IS_MOCK_MODE || !liffId) {
    console.log('🔧 Running in MOCK MODE - LIFF disabled');
    return true;
  }

  try {
    await liff.init({ liffId });

    if (!liff.isLoggedIn()) {
      liff.login();
    }

    return true;
  } catch (error) {
    console.error('LIFF initialization failed', error);
    return false;
  }
};

export const getLiffProfile = async () => {
  // Mock mode - return mock profile
  if (IS_MOCK_MODE || !liffId) {
    return mockLineProfile;
  }

  try {
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      return profile;
    }
    return null;
  } catch (error) {
    console.error('Failed to get LIFF profile', error);
    return null;
  }
};

export const closeLiff = () => {
  liff.closeWindow();
};

export const isInLiffBrowser = () => {
  return liff.isInClient();
};

export { liff };
