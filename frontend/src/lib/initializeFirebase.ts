import { ref, set } from 'firebase/database';
import { database } from './firebase';
import { generateMockIoTReadings, generateMockRoverControl, generateMockRoverStatus } from './mockData';

/**
 * Initialize Firebase with default structure and mock data
 * Use this for testing when hardware is not connected
 */
export const initializeFirebaseStructure = async () => {
  try {
    // Initialize IoT readings
    const iotRef = ref(database, 'ronin/iot');
    await set(iotRef, generateMockIoTReadings());

    // Initialize Rover control
    const roverControlRef = ref(database, 'ronin/rover/control');
    await set(roverControlRef, {
      direction: 'stop',
      speed: 0,
      mode: 'manual',
      emergency: false
    });

    // Initialize Rover status
    const roverStatusRef = ref(database, 'ronin/rover/status');
    await set(roverStatusRef, generateMockRoverStatus());

    console.log('✅ Firebase structure initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    return false;
  }
};

/**
 * Reset Firebase to default state
 */
export const resetFirebase = async () => {
  try {
    const roninRef = ref(database, 'ronin');
    await set(roninRef, {
      iot: generateMockIoTReadings(),
      rover: {
        control: {
          direction: 'stop',
          speed: 0,
          mode: 'manual',
          emergency: false
        },
        status: generateMockRoverStatus()
      },
      alerts: {},
      history: {}
    });

    console.log('✅ Firebase reset successfully');
    return true;
  } catch (error) {
    console.error('❌ Error resetting Firebase:', error);
    return false;
  }
};
