import type { RideRequest, RequestStatus } from "@/types/rider";
import { MOCK_REQUESTS } from "@/data/mockData";
import { userService } from './userService';
import { notificationService } from './notificationService';

let requestsStore: RideRequest[] = [...MOCK_REQUESTS];

export const requestService = {
  getRideRequests(userId: string): RideRequest[] {
    return requestsStore.filter(
      (r) => r.senderId === userId || r.receiverId === userId
    );
  },

  sendRideRequest(data: {
    receiverId: string;
    role: 'rider' | 'pillion';
    startLocation: string;
    destination: string;
    date: string;
    message: string;
    rideId?: string;
  }): RideRequest {
    const currentUser = userService.getCurrentUser();
    const receiver = userService.getUserProfile(data.receiverId);
    if (!receiver) throw new Error('Receiver profile not found');

    const newRequest: RideRequest = {
      requestId: `req-${Date.now()}`,
      rideId: data.rideId,
      senderId: currentUser.userId,
      receiverId: data.receiverId,
      sender: {
        userId: currentUser.userId,
        name: currentUser.name,
        avatar: currentUser.avatar,
        city: currentUser.city,
        reputationScore: currentUser.reputation.rating,
        badges: currentUser.badges,
        primaryBike: currentUser.bikes.find((b) => b.isPrimary)
          ? {
              model: currentUser.bikes.find((b) => b.isPrimary)!.model,
              engineCC: currentUser.bikes.find((b) => b.isPrimary)!.engineCC,
            }
          : undefined,
      },
      receiver: {
        userId: receiver.userId,
        name: receiver.name,
        avatar: receiver.avatar,
        city: receiver.city,
        reputationScore: receiver.reputation.rating,
        badges: receiver.badges,
      },
      role: data.role,
      startLocation: data.startLocation,
      destination: data.destination,
      date: data.date,
      message: data.message,
      status: 'PENDING',
      createdAt: new Date().toISOString().split('T')[0],
    };

    requestsStore.unshift(newRequest);

    // Notify receiver
    notificationService.addNotification({
      userId: data.receiverId,
      type: 'RIDE_REQUEST',
      title: `New Ride Request from ${currentUser.name}`,
      message: `${currentUser.name} sent you a ride request for ${data.startLocation} → ${data.destination}.`,
      relatedId: newRequest.requestId,
    });

    return newRequest;
  },

  updateRideRequestStatus(requestId: string, status: RequestStatus): RideRequest | null {
    const index = requestsStore.findIndex((r) => r.requestId === requestId);
    if (index === -1) return null;

    requestsStore[index].status = status;
    const req = requestsStore[index];

    // Notify sender about status change
    const actionText = status === 'ACCEPTED' ? 'accepted' : status === 'REJECTED' ? 'declined' : 'updated';
    const notifType = status === 'ACCEPTED' ? 'REQUEST_ACCEPTED' : 'REQUEST_REJECTED';

    notificationService.addNotification({
      userId: req.senderId,
      type: notifType,
      title: `Ride Request ${status}`,
      message: `${req.receiver.name} has ${actionText} your ride request for ${req.startLocation} → ${req.destination}.`,
      relatedId: req.requestId,
    });

    return { ...req };
  },
};
