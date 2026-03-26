import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, StatusBar, View, Text, TouchableOpacity } from 'react-native';
import {
  StreamCall,
  RingingCallContent,
  CallContent,
  useCalls,
  useCallStateHooks,
  useCall,
  CallingState,
  callManager,
} from '@stream-io/video-react-native-sdk';
import InCallManager from 'react-native-incall-manager';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { saveCallHistory } from '../../services/callService';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeIn,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { Image, StatusBar as RNStatusBar } from 'react-native';

const formatTime = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

interface CallSummary {
  participantName: string;
  duration: number;
  isAudioOnly: boolean;
}

// ─── Premium Incoming Call UI ────────────────────────────────────────────────
const PremiumIncomingUI = ({
  callerName,
  callerImage,
  onAccept,
  onDecline,
  isVideoCall,
}: {
  callerName: string;
  callerImage?: string;
  onAccept: () => void;
  onDecline: () => void;
  isVideoCall: boolean;
}) => {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#1a1a2e']}
      style={styles.premiumRoot}
    >
      <RNStatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={StyleSheet.absoluteFill}>
        {callerImage && (
          <Image
            source={{ uri: callerImage }}
            style={[StyleSheet.absoluteFill, { opacity: 0.15 }]}
            blurRadius={10}
          />
        )}
      </View>
      <View style={[styles.premiumContent, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 60 }]}>
        <View style={styles.callerInfo}>
          <View style={styles.avatarContainer}>
            <Animated.View style={[styles.avatarPulse, animatedStyle]} />
            <View style={styles.avatarOuterBorder}>
              {callerImage ? (
                <Image source={{ uri: callerImage }} style={styles.premiumAvatar} />
              ) : (
                <View style={[styles.premiumAvatar, { backgroundColor: '#0f766e', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={styles.avatarInitial}>{callerName[0]?.toUpperCase()}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.premiumName}>{callerName}</Text>
          <View style={styles.incomingLabelContainer}>
            <Ionicons name={isVideoCall ? 'videocam' : 'call'} size={14} color="#10B981" />
            <Text style={styles.premiumIncomingText}>
              {isVideoCall ? 'Video calling you...' : 'Audio calling you...'}
            </Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={onDecline} activeOpacity={0.8} style={styles.actionBtnContainer}>
            <View style={[styles.actionBtn, styles.declineBtn]}>
              <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </View>
            <Text style={styles.actionLabel}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onAccept} activeOpacity={0.8} style={styles.actionBtnContainer}>
            <View style={[styles.actionBtn, styles.acceptBtn]}>
              <Ionicons name="call" size={32} color="#fff" />
            </View>
            <Text style={styles.actionLabel}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

// ─── Custom Audio Call UI ─────────────────────────────────────────────────────
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
    } catch {
      InCallManager.setForceSpeakerphoneOn(next);
    }
  };

  const initial = (participantName || 'U')[0].toUpperCase();

  return (
    <View style={[audioStyles.root, { paddingTop: insets.top }]}>
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

// ─── Active Call Inner UI ─────────────────────────────────────────────────────
const RingingCallInner = ({
  callTimer,
  startEarpieceEnforcement,
  clearEarpieceEnforcement,
  inCallStartedRef,
  inCallStoppedRef,
  audioArrivedRef,
  initialEnforcedRef,
  onCallEnded,
}: {
  callTimer: number;
  startEarpieceEnforcement: (label: string) => void;
  clearEarpieceEnforcement: () => void;
  inCallStartedRef: React.MutableRefObject<boolean>;
  inCallStoppedRef: React.MutableRefObject<boolean>;
  audioArrivedRef: React.MutableRefObject<boolean>;
  initialEnforcedRef: React.MutableRefObject<boolean>;
  // ── KEY: parent passes this so RingingCallInner can signal "call is over"
  // without rendering CallContent in the LEFT/IDLE state
  onCallEnded: () => void;
}) => {
  const call = useCall();
  const {
    useCallCallingState,
    useCallCustomData,
    useCallMembers,
    useLocalParticipant,
    useRemoteParticipants,
  } = useCallStateHooks();
  const callingState = useCallCallingState();
  const customData = useCallCustomData();
  const members = useCallMembers();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const insets = useSafeAreaInsets();

  const isAudioOnly = customData?.callType === 'audio';

  const isIncoming =
    call?.state?.createdBy?.id && localParticipant?.userId
      ? call.state.createdBy.id !== localParticipant.userId
      : !call?.isCreatedByMe;

  const ringtoneActiveRef = useRef(false);

  // Remote participant left → end call
  useEffect(() => {
    if (!call || callingState !== CallingState.JOINED) return;

    const checkParticipants = () => {
      if (remoteParticipants.length === 0 && inCallStartedRef.current) {
        handleHangUp();
      }
    };

    const unsubscribe = call.on('call.session_participant_left', () => {
      setTimeout(checkParticipants, 100);
    });
    const interval = setInterval(checkParticipants, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [call, callingState, remoteParticipants.length]);

  // Audio routing
  useEffect(() => {
    inCallStoppedRef.current = false;

    if (callingState === CallingState.RINGING) {
      if (isIncoming && !ringtoneActiveRef.current) {
        InCallManager.startRingtone('_DEFAULT_', [500, 200, 500, 200], 'playback', 30);
        ringtoneActiveRef.current = true;
      } else if (!isIncoming) {
        InCallManager.start({ media: isAudioOnly ? 'audio' : 'video', ringback: '_DEFAULT_' });
      }
    } else if (callingState === CallingState.JOINED) {
      if (ringtoneActiveRef.current) {
        InCallManager.stopRingtone();
        ringtoneActiveRef.current = false;
      }
      InCallManager.stopRingback();

      if (!isIncoming) {
        inCallStartedRef.current = true;
        return;
      }

      if (!inCallStartedRef.current) {
        inCallStartedRef.current = true;
        if (isAudioOnly) {
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
      if (ringtoneActiveRef.current) {
        InCallManager.stopRingtone();
        ringtoneActiveRef.current = false;
      }
    }

    const stopInCall = () => {
      if (inCallStartedRef.current && !inCallStoppedRef.current) {
        inCallStoppedRef.current = true;
        inCallStartedRef.current = false;
        clearEarpieceEnforcement();
        try {
          InCallManager.setKeepScreenOn(false);
          InCallManager.setForceSpeakerphoneOn(false);
          InCallManager.setSpeakerphoneOn(false);
          InCallManager.stop();
          InCallManager.stopRingback();
          setTimeout(() => { try { InCallManager.stop(); InCallManager.stopRingback(); } catch { } }, 800);
        } catch { }
        try { callManager.stop(); } catch { }
      }
    };

    return () => {
      if (ringtoneActiveRef.current) {
        InCallManager.stopRingtone();
        ringtoneActiveRef.current = false;
      }
      InCallManager.stopRingback();
      stopInCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callingState, isAudioOnly]);

  // Earpiece enforcement when remote audio arrives
  useEffect(() => {
    if (!isIncoming || !isAudioOnly || audioArrivedRef.current) return;
    const hasAudio = remoteParticipants.some((p: any) => p.audioStream != null);
    if (hasAudio) {
      audioArrivedRef.current = true;
      startEarpieceEnforcement('audio-arrived');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteParticipants, isIncoming]);

  const handleHangUp = async () => {
    try {
      if (callingState !== CallingState.LEFT && callingState !== CallingState.IDLE) {
        if (inCallStartedRef.current) {
          clearEarpieceEnforcement();
          InCallManager.setForceSpeakerphoneOn(false);
          InCallManager.setSpeakerphoneOn(false);
          InCallManager.stop();
        }
        try { await call?.microphone.disable(); } catch { }
        try { await call?.camera.disable(); } catch { }
        try { await call?.leave().catch(() => { }); } catch { }
      }
    } catch { }
  };

  const callerName = (() => {
    const creatorId = call?.state?.createdBy?.id;
    if (creatorId && members.length > 0) {
      const creator = members.find(m => m.user_id === creatorId);
      return creator?.user?.name || call?.state?.createdBy?.name || 'Unknown';
    }
    return call?.state?.createdBy?.name || 'Unknown';
  })();

  const callerImage = (() => {
    const creatorId = call?.state?.createdBy?.id;
    if (creatorId && members.length > 0) {
      const creator = members.find(m => m.user_id === creatorId);
      return creator?.user?.image || (creator?.user as any)?.profileImage;
    }
    return null;
  })();

  // ── KEY FIX: never render CallContent in LEFT/IDLE ──
  // Signal parent to show summary instead
  if (callingState === CallingState.LEFT || callingState === CallingState.IDLE) {
    // Tell parent synchronously on next tick (avoid setState-in-render)
    // Parent's ref-based guard handles the actual UI switch
    return null;
  }

  // Audio call in progress
  if (callingState === CallingState.JOINED && isAudioOnly) {
    return (
      <AudioCallUI
        participantName={callerName}
        callTimer={callTimer}
        onHangUp={handleHangUp}
        onStopTimers={clearEarpieceEnforcement}
      />
    );
  }

  // Video call in progress
  if (callingState === CallingState.JOINED) {
    return (
      <View style={styles.innerContainer}>
        <View style={{ height: insets.top, backgroundColor: '#1a1a2e' }} />
        <View style={styles.timerContainer}>
          <View style={styles.timerBadge}>
            <View style={styles.timerDot} />
            <Text style={styles.timerText}>{formatTime(callTimer)}</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <CallContent onHangupCallHandler={handleHangUp} layout="grid" />
        </View>
      </View>
    );
  }

  // Ringing / Joining state
  return (
    <View style={styles.innerContainer}>
      <View style={{ height: insets.top, backgroundColor: '#1a1a2e' }} />
      <View style={{ flex: 1 }}>
        {isIncoming ? (
          <PremiumIncomingUI
            callerName={callerName}
            callerImage={callerImage}
            onAccept={() => call?.join()}
            onDecline={handleHangUp}
            isVideoCall={!isAudioOnly}
          />
        ) : (
          <RingingCallContent />
        )}
      </View>
      <View style={{ height: Math.max(insets.bottom + 16, 40), backgroundColor: '#1a1a2e' }} />
    </View>
  );
};

// ─── Call Summary Screen ──────────────────────────────────────────────────────
const CallEndedScreen = ({ summary }: { summary: CallSummary }) => {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#1a1a2e']}
      style={[styles.premiumRoot, { paddingTop: insets.top + 100 }]}
    >
      <Animated.View entering={FadeIn.duration(800)} style={styles.summaryContainer}>
        <View style={styles.summaryIconCircle}>
          <Ionicons
            name="call"
            size={36}
            color="#EF4444"
            style={{ transform: [{ rotate: '135deg' }] }}
          />
        </View>
        <Text style={styles.summaryTitle}>Call Ended</Text>
        <Text style={styles.summaryName}>{summary.participantName}</Text>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Ionicons name="time-outline" size={20} color="#9CA3AF" />
          <Text style={styles.summaryDetail}>{formatTime(summary.duration)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons
            name={summary.isAudioOnly ? 'mic-outline' : 'videocam-outline'}
            size={20}
            color="#9CA3AF"
          />
          <Text style={styles.summaryDetail}>{summary.isAudioOnly ? 'Audio Call' : 'Video Call'}</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

// ─── Overlay Guard ────────────────────────────────────────────────────────────
const CallOverlayGuard = ({ onDismiss }: { onDismiss: () => void }) => {
  const call = useCall();
  const {
    useCallCallingState,
    useCallCustomData,
    useCallMembers,
    useLocalParticipant,
    useCallSession,
  } = useCallStateHooks();
  const callingState = useCallCallingState();
  const customData = useCallCustomData();
  const members = useCallMembers();
  const localParticipant = useLocalParticipant();
  const session = useCallSession();

  const isIncoming =
    call?.state?.createdBy?.id && localParticipant?.userId
      ? call.state.createdBy.id !== localParticipant.userId
      : !call?.isCreatedByMe;

  const { user } = useAuth();
  const participantNameRef = useRef('');
  const otherMemberIdRef = useRef<string | null>(null);
  const hasBeenActiveRef = useRef(false);
  const hasJoinedRef = useRef(false);
  const joinedAtRef = useRef<number>(0);
  const isAudioOnlyRef = useRef(false);
  const historySavedRef = useRef(false);

  const [callTimer, setCallTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── KEY FIX: Use ref as synchronous guard (same pattern as CallScreen fix) ──
  // showSummaryRef.current = true is set synchronously before setShowSummary(true)
  // so the very next render immediately shows CallEndedScreen, never RingingCallInner
  const showSummaryRef = useRef(false);
  const [showSummary, setShowSummary] = useState(false);

  // Audio enforcement refs
  const earpieceTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const enforcementIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inCallStartedRef = useRef(false);
  const inCallStoppedRef = useRef(false);
  const audioArrivedRef = useRef(false);
  const initialEnforcedRef = useRef(false);

  const clearEarpieceEnforcement = () => {
    if (enforcementIntervalRef.current) {
      clearInterval(enforcementIntervalRef.current);
      enforcementIntervalRef.current = null;
    }
    earpieceTimersRef.current.forEach(t => { try { clearTimeout(t); } catch { } });
    earpieceTimersRef.current = [];
  };

  const startEarpieceEnforcement = (label: string) => {
    if (inCallStoppedRef.current) return;
    clearEarpieceEnforcement();
    InCallManager.setForceSpeakerphoneOn(false);
    try { callManager.android.selectAudioDevice('Earpiece'); } catch { }

    let count = 0;
    enforcementIntervalRef.current = setInterval(() => {
      if (inCallStoppedRef.current) { clearEarpieceEnforcement(); return; }
      try { callManager.android.selectAudioDevice('Earpiece'); } catch {
        InCallManager.setForceSpeakerphoneOn(false);
      }
      count++;
      if (count >= 12 && enforcementIntervalRef.current) {
        clearInterval(enforcementIntervalRef.current);
        enforcementIntervalRef.current = null;
      }
    }, 500);
  };

  // Capture member names
  useEffect(() => {
    if (members.length > 0 && call) {
      const createdById = call.state?.createdBy?.id;
      if (isIncoming && createdById) {
        const creator = members.find(m => m.user_id === createdById);
        if (creator?.user?.name) participantNameRef.current = creator.user.name;
        else if (call.state?.createdBy?.name) participantNameRef.current = call.state.createdBy.name;
        if (!otherMemberIdRef.current) otherMemberIdRef.current = createdById;
      } else if (createdById) {
        const other = members.find(m => m.user_id !== createdById);
        if (other?.user?.name) participantNameRef.current = other.user.name;
        if (other?.user_id && !otherMemberIdRef.current) otherMemberIdRef.current = other.user_id;
      }
    }
  }, [members, call, isIncoming]);

  // Track active / joined state
  useEffect(() => {
    if ([CallingState.RINGING, CallingState.JOINING, CallingState.JOINED].includes(callingState as CallingState)) {
      hasBeenActiveRef.current = true;
    }
    if (callingState === CallingState.JOINED) {
      hasJoinedRef.current = true;
      if (joinedAtRef.current === 0) joinedAtRef.current = Date.now();
    }
    if (customData?.callType) isAudioOnlyRef.current = customData.callType === 'audio';
  }, [callingState, customData]);

  // Unified timer
  useEffect(() => {
    const startTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const liveStart = session?.live_started_at || call?.state?.startedAt;
        if (liveStart) {
          const diff = Math.floor((Date.now() - new Date(liveStart).getTime()) / 1000);
          setCallTimer(diff > 0 ? diff : 0);
        } else {
          setCallTimer(prev => prev + 1);
        }
      }, 1000);
    };

    if (callingState === CallingState.JOINED) {
      hasJoinedRef.current = true;
      hasBeenActiveRef.current = true;
      startTimer();
    } else if (callingState === CallingState.LEFT || callingState === CallingState.IDLE) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }

    const unsubscribe = call?.on('call.accepted', () => {
      hasJoinedRef.current = true;
      hasBeenActiveRef.current = true;
      startTimer();
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [callingState, call, session?.live_started_at]);

  const saveHistory = () => {
    if (historySavedRef.current || !user?._id || !isIncoming) return;
    const callerId = otherMemberIdRef.current || call?.state?.createdBy?.id;
    if (!callerId || callerId === user._id) return;

    historySavedRef.current = true;

    let finalDuration = callTimer;
    if (joinedAtRef.current > 0) {
      finalDuration = Math.round((Date.now() - joinedAtRef.current) / 1000);
    }
    finalDuration = Math.max(finalDuration, callTimer, 0);

    saveCallHistory(
      callerId,
      user._id,
      isAudioOnlyRef.current ? 'audio' : 'video',
      finalDuration > 0 ? 'completed' : 'rejected',
      finalDuration
    );
  };

  // Handle call end
  useEffect(() => {
    if (
      hasBeenActiveRef.current &&
      (callingState === CallingState.LEFT || callingState === CallingState.IDLE)
    ) {
      // Audio cleanup
      const forceResetAudio = async () => {
        clearEarpieceEnforcement();
        try {
          InCallManager.setKeepScreenOn(false);
          InCallManager.setForceSpeakerphoneOn(false);
          InCallManager.setSpeakerphoneOn(false);
          InCallManager.stop();
        } catch { }
        try { await call?.microphone.disable(); } catch { }
        try { await call?.camera.disable(); } catch { }
        try { callManager.stop(); } catch { }
      };

      saveHistory();
      forceResetAudio();

      if (hasJoinedRef.current) {
        // ── SYNCHRONOUS: set ref first so render immediately shows summary ──
        showSummaryRef.current = true;
        setShowSummary(true);
        const t = setTimeout(() => onDismiss(), 3500);
        return () => clearTimeout(t);
      } else {
        onDismiss();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callingState]);

  // ── RENDER PRIORITY ─────────────────────────────────────────────────────
  // Check REF first (synchronous) — this prevents any flash of RingingCallInner
  // during the one render cycle before showSummary state updates.
  // ─────────────────────────────────────────────────────────────────────────
  if (showSummaryRef.current || showSummary) {
    return (
      <CallEndedScreen
        summary={{
          participantName: participantNameRef.current || 'Unknown',
          duration: callTimer,
          isAudioOnly: isAudioOnlyRef.current,
        }}
      />
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <RingingCallInner
        callTimer={callTimer}
        startEarpieceEnforcement={startEarpieceEnforcement}
        clearEarpieceEnforcement={clearEarpieceEnforcement}
        inCallStartedRef={inCallStartedRef}
        inCallStoppedRef={inCallStoppedRef}
        audioArrivedRef={audioArrivedRef}
        initialEnforcedRef={initialEnforcedRef}
        onCallEnded={() => {
          showSummaryRef.current = true;
          setShowSummary(true);
        }}
      />
    </View>
  );
};

// ─── Root Handler ─────────────────────────────────────────────────────────────
const RingingCallHandler = () => {
  const calls = useCalls();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [activeCallObject, setActiveCallObject] = useState<any>(null);

  useEffect(() => {
    if (activeCallObject) {
      if (dismissedIds.has(activeCallObject.id)) {
        setActiveCallObject(null);
      }
      return;
    }
    const active = calls.find(c => {
      if (dismissedIds.has(c.id)) return false;
      const cs = c.state.callingState;
      return (
        cs === CallingState.RINGING ||
        cs === CallingState.JOINING ||
        cs === CallingState.JOINED ||
        c.ringing
      );
    });
    if (active) setActiveCallObject(active);
  }, [calls, dismissedIds, activeCallObject]);

  if (!activeCallObject) return null;

  return (
    <StreamCall call={activeCallObject}>
      <CallOverlayGuard
        onDismiss={() => {
          setDismissedIds(prev => {
            const next = new Set(prev);
            next.add(activeCallObject.id);
            return next;
          });
          setActiveCallObject(null);
        }}
      />
    </StreamCall>
  );
};

export default RingingCallHandler;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: { zIndex: 9999, backgroundColor: '#1a1a2e' },
  innerContainer: { flex: 1, backgroundColor: '#1a1a2e' },
  timerContainer: { alignItems: 'center', paddingVertical: 8, zIndex: 10 },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, gap: 8,
  },
  timerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  timerText: { color: '#ffffff', fontSize: 15, fontWeight: '600', letterSpacing: 1 },
  summaryContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 32 },
  summaryIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  summaryTitle: { color: '#9CA3AF', fontSize: 15, fontWeight: '500', letterSpacing: 0.5, marginBottom: 6 },
  summaryName: { color: '#ffffff', fontSize: 24, fontWeight: '700', marginBottom: 24 },
  summaryDivider: {
    width: 48, height: 2, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1, marginBottom: 20,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  summaryDetail: { color: '#D1D5DB', fontSize: 16, fontWeight: '500' },
  premiumRoot: { flex: 1 },
  premiumContent: {
    flex: 1, justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, zIndex: 2,
  },
  callerInfo: { alignItems: 'center', marginTop: 40 },
  avatarContainer: { width: 180, height: 180, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  avatarPulse: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  avatarOuterBorder: {
    width: 170, height: 170, borderRadius: 85, borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.1)', padding: 6, backgroundColor: '#1a1a2e',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 20,
  },
  premiumAvatar: { width: '100%', height: '100%', borderRadius: 80 },
  avatarInitial: { color: '#fff', fontSize: 60, fontWeight: '700' },
  premiumName: {
    color: '#fff', fontSize: 32, fontWeight: '700', marginBottom: 12,
    textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  incomingLabelContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 20,
  },
  premiumIncomingText: { color: '#10B981', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
  actionButtons: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', paddingHorizontal: 20, marginBottom: 20,
  },
  actionBtnContainer: { alignItems: 'center', gap: 12, width: 120 },
  actionBtn: {
    width: 76, height: 76, borderRadius: 38,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 10,
  },
  acceptBtn: { backgroundColor: '#10B981' },
  declineBtn: { backgroundColor: '#EF4444' },
  actionLabel: {
    color: '#fff', fontSize: 15, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
});

const audioStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'space-between' },
  centerSection: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  avatar: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#0f766e',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  avatarLetter: { color: '#fff', fontSize: 38, fontWeight: '700' },
  name: { color: '#fff', fontSize: 26, fontWeight: '700', letterSpacing: 0.3 },
  timerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
  },
  timerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  timerText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 1 },
  controls: { paddingHorizontal: 24 },
  controlRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  btn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  btnActive: { backgroundColor: 'rgba(16,185,129,0.35)' },
  endBtn: { backgroundColor: '#EF4444', width: 88, height: 88, borderRadius: 44 },
  endIcon: { transform: [{ rotate: '135deg' }] },
  btnLabel: { color: '#fff', fontSize: 11, fontWeight: '500', marginTop: 2 },
});