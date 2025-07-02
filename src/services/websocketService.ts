import { supabase } from '@/lib/supabase';
import { RideRequest, User } from '@/types';

export interface RideUpdate {
  type: 'ride_created' | 'ride_accepted' | 'ride_rejected' | 'ride_completed' | 'driver_location_update';
  rideId: string;
  data: any;
  timestamp: string;
}

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicle_type?: string;
  current_location?: { lat: number; lng: number };
  rating?: number;
}

class WebSocketService {
  private channels: Map<string, any> = new Map();
  private listeners: Map<string, Set<(update: RideUpdate) => void>> = new Map();

  // Subscribe to ride updates for a specific user
  subscribeToRideUpdates(userId: string, userRole: string, callback: (update: RideUpdate) => void) {
    const channelKey = `ride_updates_${userId}`;
    
    // Store the callback
    if (!this.listeners.has(channelKey)) {
      this.listeners.set(channelKey, new Set());
    }
    this.listeners.get(channelKey)!.add(callback);

    // Subscribe to Supabase real-time changes
    const channel = supabase
      .channel(`ride_requests_${userRole}_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_requests',
          filter: userRole === 'student' 
            ? `student_id=eq.${userId}`
            : userRole === 'driver'
            ? `driver_id=eq.${userId} OR (status=eq.pending AND driver_id=is.null)`
            : undefined
        },
        (payload) => {
          this.handleRideUpdate(payload, userId, userRole);
        }
      )
      .subscribe((status) => {
        console.log(`WebSocket subscription status for ${userRole} ${userId}:`, status);
      });

    this.channels.set(channelKey, channel);
  }

  // Unsubscribe from ride updates
  unsubscribeFromRideUpdates(userId: string, callback?: (update: RideUpdate) => void) {
    const channelKey = `ride_updates_${userId}`;
    
    if (callback && this.listeners.has(channelKey)) {
      this.listeners.get(channelKey)!.delete(callback);
    } else {
      this.listeners.delete(channelKey);
    }

    const channel = this.channels.get(channelKey);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelKey);
    }
  }

  // Handle ride updates from Supabase
  private async handleRideUpdate(payload: any, userId: string, userRole: string) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    let update: RideUpdate;

    switch (eventType) {
      case 'INSERT':
        update = {
          type: 'ride_created',
          rideId: newRecord.id,
          data: newRecord,
          timestamp: new Date().toISOString()
        };
        break;

      case 'UPDATE':
        if (newRecord.status === 'accepted' && oldRecord.status === 'pending') {
          // Get driver information when ride is accepted
          const driverInfo = await this.getDriverInfo(newRecord.driver_id);
          update = {
            type: 'ride_accepted',
            rideId: newRecord.id,
            data: { ...newRecord, driverInfo },
            timestamp: new Date().toISOString()
          };
        } else if (newRecord.status === 'rejected' && oldRecord.status === 'pending') {
          update = {
            type: 'ride_rejected',
            rideId: newRecord.id,
            data: newRecord,
            timestamp: new Date().toISOString()
          };
        } else if (newRecord.status === 'completed' && oldRecord.status === 'accepted') {
          update = {
            type: 'ride_completed',
            rideId: newRecord.id,
            data: newRecord,
            timestamp: new Date().toISOString()
          };
        } else {
          return; // Ignore other updates
        }
        break;

      default:
        return;
    }

    // Notify all listeners for this user
    const channelKey = `ride_updates_${userId}`;
    if (this.listeners.has(channelKey)) {
      this.listeners.get(channelKey)!.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error('Error in WebSocket callback:', error);
        }
      });
    }
  }

  // Get driver information
  private async getDriverInfo(driverId: string): Promise<DriverInfo | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone, vehicle_type, current_location')
        .eq('id', driverId)
        .single();

      if (error || !data) {
        console.error('Error fetching driver info:', error);
        return null;
      }

      return {
        id: data.id,
        name: `${data.first_name} ${data.last_name}`,
        phone: data.phone || 'Not available',
        email: data.email,
        vehicle_type: data.vehicle_type,
        current_location: data.current_location,
        rating: 4.5 // Placeholder - would come from ratings table
      };
    } catch (error) {
      console.error('Error getting driver info:', error);
      return null;
    }
  }

  // Send a custom notification to a specific user
  async sendNotification(userId: string, notification: RideUpdate) {
    const channelKey = `ride_updates_${userId}`;
    if (this.listeners.has(channelKey)) {
      this.listeners.get(channelKey)!.forEach(callback => {
        try {
          callback(notification);
        } catch (error) {
          console.error('Error in notification callback:', error);
        }
      });
    }
  }

  // Update driver location in real-time
  async updateDriverLocation(driverId: string, location: { lat: number; lng: number }) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          current_location: location,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) {
        console.error('Error updating driver location:', error);
        return false;
      }

      // Notify relevant users about location update
      const notification: RideUpdate = {
        type: 'driver_location_update',
        rideId: '', // Not applicable for location updates
        data: { driverId, location },
        timestamp: new Date().toISOString()
      };

      // This would typically notify students with active rides from this driver
      // For now, we'll just log it
      console.log('Driver location updated:', notification);

      return true;
    } catch (error) {
      console.error('Error in updateDriverLocation:', error);
      return false;
    }
  }

  // Cleanup all subscriptions
  cleanup() {
    this.channels.forEach((channel, key) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.listeners.clear();
  }
}

// Export singleton instance
export const websocketService = new WebSocketService(); 