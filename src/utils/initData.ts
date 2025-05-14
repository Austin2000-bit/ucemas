import { User } from "@/types";

// Default data for the application
const defaultData = {
  users: [
    {
      id: "admin1",
      email: "admin@example.com",
      password: "admin123",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      photo: "/default-avatar.png"
    },
    {
      id: "helper1",
      email: "amanda@example.com",
      password: "helper123",
      firstName: "Amanda",
      lastName: "Smith",
      role: "helper",
      photo: "/default-avatar.png"
    },
    {
      id: "student1",
      email: "john@example.com",
      password: "student123",
      firstName: "John",
      lastName: "Doe",
      role: "student",
      photo: "/default-avatar.png"
    },
    {
      id: "driver1",
      email: "driver@example.com",
      password: "driver123",
      firstName: "Mike",
      lastName: "Johnson",
      role: "driver",
      photo: "/default-avatar.png"
    }
  ],
  helperStudentAssignments: [],
  studentHelpConfirmations: [],
  complaints: [],
  rideRequests: [],
  messages: [],
  systemLogs: [
    {
      id: "log1",
      timestamp: new Date().toISOString(),
      action: "System Initialized",
      details: "System initialized with default data",
      userId: "system",
      userRole: "system"
    }
  ]
};

// Initialize localStorage with default data if it doesn't exist
export const initializeData = () => {
  console.log("Initializing data..."); // Debug log
  
  const keys = Object.keys(defaultData);
  
  keys.forEach(key => {
    const existingData = localStorage.getItem(key);
    if (!existingData) {
      console.log(`Initializing ${key} with default data...`); // Debug log
      localStorage.setItem(key, JSON.stringify(defaultData[key as keyof typeof defaultData]));
    } else {
      console.log(`${key} already exists in localStorage`); // Debug log
    }
  });
  
  // Verify users are properly initialized
  const users = localStorage.getItem("users");
  console.log("Current users in localStorage:", users); // Debug log
};

// Helper function to get data from localStorage
export const getData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  if (!data) {
    console.log(`No data found for key: ${key}`); // Debug log
    return [];
  }
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error parsing data for key ${key}:`, error);
    return [];
  }
};

// Helper function to save data to localStorage
export const saveData = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`Successfully saved data for key: ${key}`); // Debug log
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
  }
};

// Helper function to add a new item to data
export const addData = <T>(key: string, item: T) => {
  const data = getData<T>(key);
  data.push(item);
  saveData(key, data);
};

// Helper function to update an item in data
export const updateData = <T extends { id: string }>(key: string, id: string, updates: Partial<T>) => {
  const data = getData<T>(key);
  const index = data.findIndex(item => item.id === id);
  if (index !== -1) {
    data[index] = { ...data[index], ...updates };
    saveData(key, data);
    return true;
  }
  return false;
};

// Helper function to delete an item from data
export const deleteData = <T extends { id: string }>(key: string, id: string) => {
  const data = getData<T>(key);
  const filteredData = data.filter(item => item.id !== id);
  saveData(key, filteredData);
};

// Helper function to get a single item by ID
export const getDataById = <T extends { id: string }>(key: string, id: string): T | undefined => {
  const data = getData<T>(key);
  return data.find(item => item.id === id);
};

// Helper function to get data by a specific field
export const getDataByField = <T>(key: string, field: keyof T, value: any): T[] => {
  const data = getData<T>(key);
  return data.filter(item => item[field] === value);
}; 