import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  StreamCall,
  CallContent,
  useCall,
  useCallStateHooks,
  CallingState,
  callManager,
} from '@stream-io/video-react-native-sdk';
import InCallManager from 'react-native-incall-manager';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStreamVideo } from '../../contexts/StreamVideoContext';
import { useAuth } from '../../contexts/AuthContext';
import { saveCallHistory } from '../../services/callService';

const formatTime = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

// ─── Call-Ended Summary ───────────────────────────────────────────────────────
type CallStatus = 'completed' | 'declined' | 'no_answer';

const STATUS_META: Record<CallStatus, { icon: string; label: string; color: string }> = {
  completed: { icon: 'checkmark-circle', label: 'Call Ended', color: '#10B981' },
  declined: { icon: 'close-circle', label: 'Call Declined', color: '#EF4444' },
  no_answer: { icon: 'time', label: 'No Answer', color: '#F59E0B' },
};

const CallEndedSummary = ({
  participantName,
  duration,
  isAudioOnly,
  callStatus,
  onDismiss
}: {
  participantName: string;
  duration: number;
  isAudioOnly: boolean;
  callStatus: CallStatus;
  onDismiss: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const meta = STATUS_META[callStatus];
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={[styles.summaryContainer, { paddingTop: insets.top + 40 }]}>
        <View style={[styles.summaryIconCircle, { backgroundColor: `${meta.color}20` }]}>
          <Ionicons name={meta.icon as any} size={36} color={meta.color} />
        </View>
        <Text style={[styles.summaryTitle, { color: meta.color }]}>{meta.label}</Text>
        <Text style={styles.summaryName}>{participantName || 'Unknown'}</Text>
        <View style={styles.summaryDivider} />
        {callStatus === 'completed' && (
          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={18} color="#9CA3AF" />
            <Text style={styles.summaryDetail}>{formatTime(duration)}</Text>
          </View>
        )}
        <View style={styles.summaryRow}>
          <Ionicons
            name={isAudioOnly ? 'call-outline' : 'videocam-outline'}
            size={18}
            color="#9CA3AF"
          />
          <Text style={styles.summaryDetail}>{isAudioOnly ? 'Audio Call' : 'Video Call'}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Custom Audio Call UI (Caller) ───────────────────────────────────────────
const AudioCallUI = ({
  participantName,
  callTimer,
  onHangUp,
  onStopTimers,
}: {
  participantName: string;
  callTimer: number;
  onHangUp: () => void;
  onStopTimers?: () => void;
}) => {
  const call = useCall();
  const insets = useSafeAreaInsets();
  const [micOn, setMicOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(false);

  const toggleMic = async () => {
    try {
      if (micOn) { await call?.microphone.disable(); }
      else { await call?.microphone.enable(); }
      setMicOn(m => !m);
    } catch { }
  };

  const toggleSpeaker = () => {
    const next = !speakerOn;
    if (onStopTimers) onStopTimers();
    setSpeakerOn(next);
    try {
      if (next) {
        callManager.android.selectAudioDevice('Speaker');
      } else {
        callManager.android.selectAudioDevice('Earpiece');
      }
    } catch (e) {
      InCallManager.setForceSpeakerphoneOn(next);
    }
  };

  const initial = (participantName || 'U')[0].toUpperCase();

  return (
    <View style={[audioStyles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={audioStyles.centerSection}>
        <View style={audioStyles.avatar}>
          <Text style={audioStyles.avatarLetter}>{initial}</Text>
        </View>
        <Text style={audioStyles.name}>{participantName || 'Unknown'}</Text>
        <View style={audioStyles.timerRow}>
          <View style={audioStyles.timerDot} />
          <Text style={audioStyles.timerText}>{formatTime(callTimer)}</Text>
        </View>
      </View>
      <View style={[audioStyles.controls, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}>
        <View style={audioStyles.controlRow}>
          <TouchableOpacity
            onPress={toggleMic}
            style={[audioStyles.btn, !micOn && audioStyles.btnActive]}
            activeOpacity={0.75}
          >
            <Ionicons name={micOn ? 'mic' : 'mic-off'} size={26} color="#fff" />
            <Text style={audioStyles.btnLabel}>{micOn ? 'Mute' : 'Unmute'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onHangUp}
            style={[audioStyles.btn, audioStyles.endBtn]}
            activeOpacity={0.75}
          >
            <Ionicons name="call" size={26} color="#fff" style={audioStyles.endIcon} />
            <Text style={audioStyles.btnLabel}>End</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleSpeaker}
            style={[audioStyles.btn, speakerOn && audioStyles.btnActive]}
            activeOpacity={0.75}
          >
            <Ionicons name={speakerOn ? 'volume-high' : 'volume-medium'} size={26} color="#fff" />
            <Text style={audioStyles.btnLabel}>Speaker</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ─── Active Call UI (Caller) ──────────────────────────────────────────────────
const ActiveCallUI = ({
  otherUserName,
  callTypeParam,
}: {
  otherUserName?: string;
  callTypeParam?: string;
}) => {
  const call = useCall();
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { useCallCallingState, useCallCustomData, useCallMembers, useRemoteParticipants } = useCallStateHooks();
  const callingState = useCallCallingState();
  const customData = useCallCustomData();
  const members = useCallMembers();
  const remoteParticipants = useRemoteParticipants();

  const joinedAtRef = useRef<number>(0);
  const historySavedRef = useRef(false);
  const hasBeenActiveRef = useRef(false);
  const hasNavigatedRef = useRef(false);
  const otherMemberIdRef = useRef<string | null>(null);
  const otherMemberNameRef = useRef(otherUserName || '');
  const inCallStartedRef = useRef(false);
  const inCallStoppedRef = useRef(false);
  const ringingStartedAtRef = useRef<number>(0);

  const initialEnforcedRef = useRef(false);
  const audioArrivedRef = useRef(false);
  const earpieceTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const enforcementIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── KEY FIX: callEndedRef is a SYNCHRONOUS guard used in render ──
  // setCallEnded(true) triggers re-render but has 1-cycle delay.
  // callEndedRef.current = true is synchronous — checked FIRST in render
  // so CallContent is NEVER shown after triggerEndScreen() is called.
  const callEndedRef = useRef(false);
  const [callEnded, setCallEnded] = useState(false);

  const callStatusRef = useRef<CallStatus>('no_answer');
  const summaryDurationRef = useRef(0);
  const [callTimer, setCallTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAudioOnly = callTypeParam === 'audio' || customData?.callType === 'audio';

  const clearEarpieceEnforcement = () => {
    if (enforcementIntervalRef.current) {
      clearInterval(enforcementIntervalRef.current);
      enforcementIntervalRef.current = null;
    }
    earpieceTimersRef.current.forEach(t => { try { clearTimeout(t); } catch { } });
    earpieceTimersRef.current = [];
  };

  const startEarpieceEnforcement = (label: string) => {
    clearEarpieceEnforcement();
    InCallManager.setForceSpeakerphoneOn(false);
    let count = 0;
    enforcementIntervalRef.current = setInterval(() => {
      try {
        callManager.android.selectAudioDevice('Earpiece');
      } catch {
        InCallManager.setForceSpeakerphoneOn(false);
      }
      count++;
      if (count >= 12) {
        if (enforcementIntervalRef.current) {
          clearInterval(enforcementIntervalRef.current);
          enforcementIntervalRef.current = null;
        }
      }
    }, 500);
  };

  // Call timer
  useEffect(() => {
    if (callingState === CallingState.JOINED) {
      timerRef.current = setInterval(() => setCallTimer(prev => prev + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); } };
  }, [callingState]);

  // Capture other member info
  useEffect(() => {
    if (members.length > 0 && user?._id) {
      const other = members.find(m => m.user_id !== user._id);
      if (other) {
        if (!otherMemberIdRef.current) otherMemberIdRef.current = other.user_id;
        if (other.user?.name && !otherMemberNameRef.current) otherMemberNameRef.current = other.user.name;
      }
    }
  }, [members, user?._id]);

  const stopInCall = () => {
    clearEarpieceEnforcement();
    if (!inCallStoppedRef.current) {
      inCallStoppedRef.current = true;
      inCallStartedRef.current = false;
      try {
        InCallManager.setKeepScreenOn(false);
        InCallManager.setForceSpeakerphoneOn(false);
        InCallManager.setSpeakerphoneOn(false);
        InCallManager.stop();
        setTimeout(() => { try { InCallManager.stop(); } catch { } }, 800);
      } catch { }
      try { callManager.stop(); } catch { }
    }
  };

  const triggerEndScreen = () => {
    if (callEndedRef.current) return;

    // ── SYNCHRONOUS: set ref immediately so next render skips CallContent ──
    callEndedRef.current = true;
    summaryDurationRef.current = callTimer;
    stopInCall();

    if (callTimer > 0 || callStatusRef.current === 'completed') {
      callStatusRef.current = 'completed';
    } else {
      const ringingMs = ringingStartedAtRef.current > 0
        ? Date.now() - ringingStartedAtRef.current
        : Infinity;
      callStatusRef.current = ringingMs < 28_000 ? 'declined' : 'no_answer';
    }

    // ── Trigger re-render to show summary ──
    setCallEnded(true);

    setTimeout(() => {
      if (hasNavigatedRef.current) return;
      hasNavigatedRef.current = true;
      if (navigation.canGoBack()) navigation.goBack();
    }, 2500);
  };

  const saveHistory = () => {
    const myId = user?._id;
    if (historySavedRef.current || !myId) return;

    let otherUserId: string | null = otherMemberIdRef.current;
    if (!otherUserId && call) {
      const mems = call.state?.members || [];
      const otherMember = mems.find(m => m.user_id !== myId);
      if (otherMember) otherUserId = otherMember.user_id;
    }
    if (!otherUserId) {
      const createdById = call?.state?.createdBy?.id;
      if (createdById && createdById !== myId) {
        otherUserId = createdById;
      } else {
        const anyOther = call?.state?.members.find(m => m.user_id !== myId);
        if (anyOther) otherUserId = anyOther.user_id;
      }
    }
    if (!otherUserId) return;

    historySavedRef.current = true;

    let finalDuration = callTimer;
    if (joinedAtRef.current > 0) {
      finalDuration = Math.round((Date.now() - joinedAtRef.current) / 1000);
    }
    finalDuration = Math.max(finalDuration, callTimer, 0);

    const ringingMs = ringingStartedAtRef.current > 0
      ? Date.now() - ringingStartedAtRef.current
      : Infinity;

    const historyStatus: 'completed' | 'missed' | 'rejected' =
      finalDuration > 0 || callStatusRef.current === 'completed'
        ? 'completed'
        : (ringingMs < 28000 ? 'rejected' : 'missed');

    saveCallHistory(myId, otherUserId, isAudioOnly ? 'audio' : 'video', historyStatus, finalDuration);
  };

  // Track ringing start + JOINED
  useEffect(() => {
    if (callingState === CallingState.RINGING && ringingStartedAtRef.current === 0) {
      ringingStartedAtRef.current = Date.now();
    }
    if (callingState === CallingState.JOINED) {
      callStatusRef.current = 'completed';
    }
  }, [callingState]);

  // SDK event bus fallback
  useEffect(() => {
    if (!call) return;
    const unsubscribe = call.on('call.accepted', () => {
      callStatusRef.current = 'completed';
      if (joinedAtRef.current === 0) joinedAtRef.current = Date.now();
      if (!timerRef.current) {
        timerRef.current = setInterval(() => setCallTimer(prev => prev + 1), 1000);
      }
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, [call]);

  // Audio routing
  useEffect(() => {
    if ([CallingState.RINGING, CallingState.JOINING, CallingState.JOINED].includes(callingState as CallingState)) {
      hasBeenActiveRef.current = true;
    }
    if (callingState === CallingState.RINGING) {
      if (!isAudioOnly) {
        InCallManager.start({ media: 'video', ringback: '_DEFAULT_' });
      } else {
        InCallManager.start({ media: 'audio', ringback: '_DEFAULT_' });
      }
    } else if (callingState === CallingState.JOINED) {
      InCallManager.stopRingback();
      joinedAtRef.current = Date.now();
      if (!inCallStartedRef.current) {
        inCallStartedRef.current = true;
        inCallStoppedRef.current = false;
        if (isAudioOnly) {
          call?.camera.disable();
          try { callManager.start({ audioRole: 'communicator', deviceEndpointType: 'earpiece' }); } catch { }
          if (!initialEnforcedRef.current) {
            initialEnforcedRef.current = true;
            startEarpieceEnforcement('on-joined');
          }
        } else {
          InCallManager.start({ media: 'video' });
          InCallManager.setForceSpeakerphoneOn(true);
        }
      }
    } else if (callingState === CallingState.LEFT || callingState === CallingState.IDLE) {
      InCallManager.stopRingback();
    }
    return () => {
      clearEarpieceEnforcement();
      InCallManager.stopRingback();
      if (callingState === CallingState.JOINED) stopInCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callingState, isAudioOnly]);

  // Enforce earpiece when remote audio arrives
  useEffect(() => {
    if (!isAudioOnly || audioArrivedRef.current) return;
    const hasAudio = remoteParticipants.some((p: any) => p.audioStream != null);
    if (hasAudio) {
      audioArrivedRef.current = true;
      startEarpieceEnforcement('audio-arrived');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteParticipants]);

  // Detect remote hang-up via participant count
  useEffect(() => {
    if (!call || !hasBeenActiveRef.current || callingState !== CallingState.JOINED) return;
    const checkParticipants = () => {
      if (remoteParticipants.length === 0 && inCallStartedRef.current) {
        saveHistory();
        triggerEndScreen();
      }
    };
    const unsubscribe = call.on('call.session_participant_left', () => {
      setTimeout(checkParticipants, 100);
    });
    const interval = setInterval(checkParticipants, 2000);
    return () => { unsubscribe(); clearInterval(interval); };
  }, [call, callingState, remoteParticipants.length]);

  // Handle LEFT/IDLE state transitions
  useEffect(() => {
    if (!hasBeenActiveRef.current) return;
    if (callingState === CallingState.LEFT || callingState === CallingState.IDLE) {
      saveHistory();
      triggerEndScreen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callingState]);

  const handleHangUp = async () => {
    saveHistory();
    triggerEndScreen();
    stopInCall();
    try {
      if (callingState !== CallingState.LEFT && callingState !== CallingState.IDLE) {
        try { await call?.microphone.disable(); } catch { }
        try { await call?.camera.disable(); } catch { }
        try { await call?.leave().catch(() => { }); } catch { }
      }
    } catch { }
  };

  // ── RENDER PRIORITY ──────────────────────────────────────────────────────
  //
  // 1. callEndedRef.current  → synchronous, checked FIRST every render
  //                            prevents CallContent from ever flashing
  // 2. callEnded state       → triggers re-render after triggerEndScreen()
  // 3. LEFT/IDLE state       → fallback safety net
  //
  // By checking the REF (not just state) first, we guarantee zero
  // black-screen frames between triggerEndScreen() and summary render.
  // ─────────────────────────────────────────────────────────────────────────

  const isEnded =
    callEndedRef.current ||
    callEnded ||
    (
      (hasBeenActiveRef.current || ringingStartedAtRef.current > 0) &&
      (callingState === CallingState.LEFT || callingState === CallingState.IDLE)
    );

  if (isEnded) {
    const displayStatus: CallStatus =
      callTimer > 0 || callStatusRef.current === 'completed'
        ? 'completed'
        : callStatusRef.current;

    return (
      <CallEndedSummary
        participantName={otherMemberNameRef.current || otherUserName || 'Unknown'}
        duration={summaryDurationRef.current || callTimer}
        isAudioOnly={!!isAudioOnly}
        callStatus={displayStatus}
      />
    );
  }

  // Audio only UI — shown during RINGING, JOINING, JOINED
  if (
    isAudioOnly &&
    [CallingState.RINGING, CallingState.JOINING, CallingState.JOINED].includes(callingState as CallingState)
  ) {
    return (
      <AudioCallUI
        participantName={otherMemberNameRef.current || otherUserName || 'Unknown'}
        callTimer={callTimer}
        onHangUp={handleHangUp}
        onStopTimers={clearEarpieceEnforcement}
      />
    );
  }

  // Safety: never render CallContent during LEFT/IDLE
  if (callingState === CallingState.LEFT || callingState === CallingState.IDLE) {
    return null;
  }

  // Video call UI
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={{ height: insets.top }} />
      {callingState === CallingState.JOINED && (
        <View style={styles.timerContainer}>
          <View style={styles.timerBadge}>
            <View style={styles.timerDot} />
            <Text style={styles.timerText}>{formatTime(callTimer)}</Text>
          </View>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <CallContent onHangupCallHandler={handleHangUp} layout="grid" />
      </View>
      <View style={{ height: Math.max(insets.bottom + 16, 40) }} />
    </View>
  );
};

// ─── CallScreen Root ──────────────────────────────────────────────────────────
const CallScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { client } = useStreamVideo();
  const { callId, otherUserName, callType } = route.params || {};

  const callRef = useRef<ReturnType<NonNullable<typeof client>['call']> | null>(null);
  if (!callRef.current && client && callId) {
    callRef.current = client.call('default', callId);
  }

  if (!client || !callId || !callRef.current) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <Ionicons name="warning-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Unable to connect to call</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <StreamCall call={callRef.current}>
      <ActiveCallUI otherUserName={otherUserName} callTypeParam={callType} />
    </StreamCall>
  );
};

export default CallScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  timerContainer: { alignItems: 'center', paddingVertical: 8, zIndex: 10 },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  timerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  timerText: { color: '#ffffff', fontSize: 15, fontWeight: '600', letterSpacing: 1 },
  summaryContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 32 },
  summaryIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: { color: '#9CA3AF', fontSize: 15, fontWeight: '500', letterSpacing: 0.5, marginBottom: 6 },
  summaryName: { color: '#ffffff', fontSize: 24, fontWeight: '700', marginBottom: 24 },
  summaryDivider: {
    width: 48,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1,
    marginBottom: 20,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  summaryDetail: { color: '#D1D5DB', fontSize: 16, fontWeight: '500' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    gap: 16,
  },
  errorText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  errorButton: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  errorButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

const audioStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'space-between' },
  centerSection: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarLetter: { color: '#fff', fontSize: 38, fontWeight: '700' },
  name: { color: '#fff', fontSize: 26, fontWeight: '700', letterSpacing: 0.3 },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  timerText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 1 },
  controls: { paddingHorizontal: 24 },
  controlRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  btn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  btnActive: { backgroundColor: 'rgba(16,185,129,0.35)' },
  endBtn: { backgroundColor: '#EF4444', width: 88, height: 88, borderRadius: 44 },
  endIcon: { transform: [{ rotate: '135deg' }] },
  btnLabel: { color: '#fff', fontSize: 11, fontWeight: '500', marginTop: 2 },
});