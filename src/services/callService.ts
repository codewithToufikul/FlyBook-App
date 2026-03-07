import { StreamVideoClient } from '@stream-io/video-react-native-sdk';
import { post } from './api';

export const generateCallId = (): string => {
  return `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const ensureUsersExistInStream = async (userIds: string[]) => {
  await post('/api/stream/ensure-users', { userIds });
};

export const initiateCall = async (
  client: StreamVideoClient,
  callerId: string,
  calleeId: string,
  isVideo: boolean = true,
) => {
  await ensureUsersExistInStream([callerId, calleeId]);

  const callId = generateCallId();
  const call = client.call('default', callId);

  await call.getOrCreate({
    ring: true,
    video: isVideo,
    data: {
      members: [{ user_id: callerId }, { user_id: calleeId }],
      custom: {
        callType: isVideo ? 'video' : 'audio',
      },
    },
  });

  if (!isVideo) {
    await call.camera.disable();
  }

  return call;
};

export const saveCallHistory = async (
  callerId: string,
  calleeId: string,
  callType: 'audio' | 'video',
  status: 'missed' | 'completed' | 'rejected',
  duration: number = 0,
) => {
  try {
    const response = await post('/api/call-history', {
      callerId,
      calleeId,
      callType,
      status,
      duration,
    });
  } catch (error) {
    console.error('[CALL-HISTORY] ❌ Failed to save call history:', error);
  }
};
