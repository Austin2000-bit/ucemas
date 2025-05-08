
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  created_at?: string;
  updated_at?: string;
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

export interface StudentConfirmation {
  id?: string;
  student_id: string;
  helper_id: string;
  date: string;
  status: 'pending' | 'confirmed' | 'rejected';
}

export interface StudentOtp {
  id?: string;
  otp: string;
  timestamp: number;
  helperName: string;
  studentId: string;
  helperId: string;
}

export interface AdminMessage {
  id?: string;
  recipient: string;
  subject: string;
  content: string;
  timestamp: number;
  read: boolean;
}

export interface Complaint {
  id?: string;
  user_id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at?: string;
  updated_at?: string;
}

export interface HelperStudentAssignment {
  id?: string;
  helper_id: string;
  student_id: string;
  status: 'active' | 'inactive';
  academic_year: string;
  created_at?: string;
  updated_at?: string;
}

export interface RideRequest {
  id: string;
  student_id: string;
  driver_id?: string | null;
  pickup_location: string;
  destination: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at?: string;
  updated_at?: string;
}
