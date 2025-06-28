import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DebugDatabase = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testAuthentication = async () => {
    try {
      addLog('Testing authentication...');
      
      // Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addLog(`❌ Session error: ${sessionError.message}`);
        return;
      }
      
      if (!session) {
        addLog('❌ No active session found');
        return;
      }
      
      addLog(`✅ Session found for user: ${session.user.email}`);
      addLog(`User ID: ${session.user.id}`);
      
      // Get user profile from database
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        addLog(`❌ Profile error: ${profileError.message}`);
        return;
      }
      
      addLog(`✅ User profile: ${userProfile.first_name} ${userProfile.last_name} (${userProfile.role})`);
      
    } catch (error) {
      addLog(`❌ Authentication test error: ${error}`);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      addLog('Testing database connection...');
      
      // Test 1: Check if we can query the sessions table
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .limit(1);
      
      if (sessionsError) {
        addLog(`❌ Sessions table error: ${sessionsError.message}`);
      } else {
        addLog(`✅ Sessions table accessible. Found ${sessions?.length || 0} records`);
      }

      // Test 2: Check if we can query the student_help_confirmations table
      const { data: confirmations, error: confirmationsError } = await supabase
        .from('student_help_confirmations')
        .select('*')
        .limit(1);
      
      if (confirmationsError) {
        addLog(`❌ Confirmations table error: ${confirmationsError.message}`);
      } else {
        addLog(`✅ Confirmations table accessible. Found ${confirmations?.length || 0} records`);
      }

      // Test 3: Check if we can query the users table
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .limit(5);
      
      if (usersError) {
        addLog(`❌ Users table error: ${usersError.message}`);
      } else {
        addLog(`✅ Users table accessible. Found ${users?.length || 0} users`);
        users?.forEach(user => {
          addLog(`  - ${user.first_name} ${user.last_name} (${user.role})`);
        });
      }

    } catch (error) {
      addLog(`❌ General error: ${error}`);
    }
  };

  const testCreateSession = async () => {
    try {
      addLog('Testing session creation...');
      
      // Get current authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addLog('❌ No authenticated session found');
        return;
      }
      
      // Get user profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .eq('id', session.user.id)
        .single();
      
      if (!userProfile) {
        addLog('❌ User profile not found');
        return;
      }
      
      addLog(`Using authenticated user: ${userProfile.first_name} ${userProfile.last_name} (${userProfile.role})`);
      
      // Find a student to create session with (if current user is helper)
      let studentId = userProfile.id;
      if (userProfile.role === 'helper') {
        const { data: students } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .eq('role', 'student')
          .limit(1);
        
        if (students && students.length > 0) {
          studentId = students[0].id;
          addLog(`Using student: ${students[0].first_name} ${students[0].last_name}`);
        } else {
          addLog('❌ No students found for testing');
          return;
        }
      }
      
      // Create a test session
      const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          helper_id: userProfile.role === 'helper' ? userProfile.id : studentId,
          student_id: userProfile.role === 'student' ? userProfile.id : studentId,
          otp: testOtp,
          otp_expiry: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          status: 'pending_confirmation'
        })
        .select()
        .single();

      if (sessionError) {
        addLog(`❌ Session creation failed: ${sessionError.message}`);
      } else {
        addLog(`✅ Session created successfully with OTP: ${testOtp}`);
        addLog(`Session ID: ${sessionData.id}`);
      }

    } catch (error) {
      addLog(`❌ Session creation error: ${error}`);
    }
  };

  const testCreateConfirmation = async () => {
    try {
      addLog('Testing confirmation creation...');
      
      // Get current authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addLog('❌ No authenticated session found');
        return;
      }
      
      // Get user profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .eq('id', session.user.id)
        .single();
      
      if (!userProfile) {
        addLog('❌ User profile not found');
        return;
      }
      
      addLog(`Using authenticated user: ${userProfile.first_name} ${userProfile.last_name} (${userProfile.role})`);
      
      // Find a student to create confirmation with (if current user is helper)
      let studentId = userProfile.id;
      if (userProfile.role === 'helper') {
        const { data: students } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .eq('role', 'student')
          .limit(1);
        
        if (students && students.length > 0) {
          studentId = students[0].id;
          addLog(`Using student: ${students[0].first_name} ${students[0].last_name}`);
        } else {
          addLog('❌ No students found for testing');
          return;
        }
      }
      
      // Create a test confirmation
      const { data: confirmation, error: confirmationError } = await supabase
        .from('student_help_confirmations')
        .insert({
          helper_id: userProfile.role === 'helper' ? userProfile.id : studentId,
          student_id: userProfile.role === 'student' ? userProfile.id : studentId,
          description: 'Test help confirmation',
          date: new Date().toISOString().split('T')[0],
          status: 'pending'
        })
        .select()
        .single();

      if (confirmationError) {
        addLog(`❌ Confirmation creation failed: ${confirmationError.message}`);
      } else {
        addLog(`✅ Confirmation created successfully`);
        addLog(`Confirmation ID: ${confirmation.id}`);
      }

    } catch (error) {
      addLog(`❌ Confirmation creation error: ${error}`);
    }
  };

  const clearLogs = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Database Debug Tool</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button onClick={testDatabaseConnection}>
            Test Database Connection
          </Button>
          <Button onClick={testCreateSession}>
            Test Session Creation
          </Button>
          <Button onClick={testCreateConfirmation}>
            Test Confirmation Creation
          </Button>
          <Button onClick={testAuthentication}>
            Test Authentication
          </Button>
          <Button onClick={clearLogs} variant="outline">
            Clear Logs
          </Button>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500">No test results yet. Run a test to see results.</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugDatabase; 