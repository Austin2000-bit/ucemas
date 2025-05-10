
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'helper' | 'student' | 'driver';
  created_at: string;
  updated_at: string;
  photo?: string;
  phone?: string;
  bank_name?: string;
  bank_account_number?: string;
  time_period?: 'full_year' | 'semester' | 'half_semester';
  status?: 'active' | 'completed' | 'inactive';
  disability_type?: string;
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
  estimatedTime?: string | number;
  student_name?: string;
  driver_name?: string;
}

export interface RideRequestWithDetails extends RideRequest {
  student_name?: string;
  driver_name?: string;
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

// Types needed for other parts of the application
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

export interface GadgetLoan {
  id: string;
  user_id: string;
  gadget_name: string;
  status: 'borrowed' | 'returned';
  borrowed_date: string;
  return_date?: string;
  fullName?: string;
  regNumber?: string;
  course?: string;
  disabilityType?: string;
  gadgetTypes?: string[] | string;
  dateBorrowed?: string;
  dateReturned?: string;
  usage_hours?: number;
  usage_start_time?: string;
  usage_end_time?: string;
  usage_notes?: string;
}

export interface HelperStatusLog {
  id: string;
  helper_id: string;
  previous_status: string;
  new_status: string;
  changed_by: string;
  changed_at: string;
  notes?: string;
}
