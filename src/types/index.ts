
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  photo?: string;
}

export type UserRole = 'admin' | 'helper' | 'student' | 'driver';

export interface StudentOtp {
  id?: string;
  otp: string;
  timestamp: number;
  helperName: string;
  studentId: string;
  helperId?: string;
}

export interface RideRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  pickupLocation: string;
  destination: string;
  date: string;
  time: string;
  status: "pending" | "accepted" | "completed" | "declined";
  disabilityType: string;
  additionalNotes?: string;
}

export interface DriverRideRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  pickupLocation: string;
  destination: string;
  date: string;
  time: string;
  status: "pending" | "accepted" | "completed" | "declined";
  disabilityType: string;
  additionalNotes?: string;
}

export interface SignInRecord {
  id?: string;
  date: string;
  helper: string;
  timestamp: number;
}

export interface HelpConfirmation {
  id?: string;
  date: string;
  helper: string;
  student: string;
  description: string;
  timestamp: number;
}
