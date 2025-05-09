
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'helper' | 'student' | 'driver';
  created_at: string;
  updated_at: string;
}

export interface HelperStudentAssignment {
  id?: string;
  helper_id: string;
  student_id: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface StudentHelpConfirmation {
  id?: string;
  student_id: string;
  helper_id: string;
  date: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id?: string;
  user_id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
  feedback?: string;
  followUp?: string;
}

export interface RideRequest {
  id?: string;
  student_id: string;
  driver_id?: string | null;
  pickup_location: string;
  destination: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id?: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentOtp {
  id?: string;
  otp: string;
  timestamp: number;
  helperName: string;
  studentId: string;
  helperId: string;
}

export interface SystemLog {
  id?: string;
  type: string;
  message: string;
  userId?: string;
  userRole?: string;
  timestamp: number;
}
