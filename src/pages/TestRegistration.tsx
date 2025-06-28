import React, { useState } from 'react';
import { UserRegistrationService, RegistrationData } from '@/services/userRegistrationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function TestRegistration() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'student' as 'student' | 'helper' | 'driver' | 'admin',
    phone: '',
    disability_type: '',
    bank_name: '',
    bank_account_number: '',
    assistant_type: 'undergraduate' as 'undergraduate' | 'postgraduate',
    assistant_specialization: 'reader' as 'reader' | 'note_taker' | 'mobility_assistant',
    time_period: 'full_year' as 'full_year' | 'semester' | 'half_semester',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      console.log('Starting test registration...');
      
      const registrationData: RegistrationData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        phone: formData.phone,
        disability_type: formData.disability_type,
        bank_name: formData.bank_name,
        bank_account_number: formData.bank_account_number,
        assistant_type: formData.assistant_type,
        assistant_specialization: formData.assistant_specialization,
        time_period: formData.time_period,
      };

      const result = await UserRegistrationService.registerUser(registrationData);

      console.log('Registration result:', result);

      setResult(result);

      if (result.success) {
        toast.success('User created successfully in both auth and public.users!');
        
        // Verify the registration
        if (result.user?.id) {
          const verification = await UserRegistrationService.verifyRegistration(result.user.id);
          console.log('Verification result:', verification);
          setResult({ ...result, verification });
        }
      } else {
        toast.error(`Registration failed: ${result.error?.message}`);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setResult({ error: error.message });
      toast.error(`Registration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test User Registration</CardTitle>
          <CardDescription>
            Test the complete registration process and verify users are properly inserted into both auth and public.users tables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="helper">Helper</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="disability_type">Disability Type</Label>
              <Input
                id="disability_type"
                value={formData.disability_type}
                onChange={(e) => handleInputChange('disability_type', e.target.value)}
              />
            </div>

            {formData.role === 'helper' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Select value={formData.bank_name} onValueChange={(value) => handleInputChange('bank_name', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CRDB">CRDB</SelectItem>
                        <SelectItem value="NBC">NBC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bank_account_number">Bank Account Number</Label>
                    <Input
                      id="bank_account_number"
                      value={formData.bank_account_number}
                      onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assistant_type">Assistant Type</Label>
                    <Select value={formData.assistant_type} onValueChange={(value) => handleInputChange('assistant_type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="undergraduate">Undergraduate</SelectItem>
                        <SelectItem value="postgraduate">Postgraduate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assistant_specialization">Specialization</Label>
                    <Select value={formData.assistant_specialization} onValueChange={(value) => handleInputChange('assistant_specialization', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reader">Reader</SelectItem>
                        <SelectItem value="note_taker">Note Taker</SelectItem>
                        <SelectItem value="mobility_assistant">Mobility Assistant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="time_period">Time Period</Label>
                  <Select value={formData.time_period} onValueChange={(value) => handleInputChange('time_period', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_year">Full Year</SelectItem>
                      <SelectItem value="semester">Semester</SelectItem>
                      <SelectItem value="half_semester">Half Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating User...' : 'Create Test User'}
            </Button>
          </form>

          {result && (
            <div className="mt-6 p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 