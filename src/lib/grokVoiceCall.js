/**
 * Browser Grok Voice Agent session — WebSocket + mic/speaker PCM16.
 * Token is minted server-side (/api/pros/voice/session); the xAI API key never ships to the client.
 */

import { lookupProsPlaybook } from './prosPlaybook';
import { PROS_DEFAULT_GREETING } from '../config/prosVoiceContact';

const SAMPLE_RATE = 24000;

function downsample(float32, fromRate, toRate) {
  if (fromRate === toRate) return float32;
  const ratio = fromRate / toRate;
  const length = Math.max(1, Math.floor(float32.length / ratio));
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const idx = i * ratio;
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, float32.length - 1);
    const frac = idx - i0;
    out[i] = float32[i0] * (1 - frac) + float32[i1] * frac;
  }
  return out;
}

function floatToPcm16(float32) {
  const pcm = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm;
}

function pcm16ToBase64(pcm) {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToPcm16(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

function executeVoiceTool(name, args) {
  if (name === 'lookup_pros_playbook') {
    return lookupProsPlaybook(args.trade, args.issue);
  }
  return { error: `Unknown tool: ${name}` };
}

export function startProsGrokVoiceCall({ session, chatHistory = [], onEvent, onTranscript, onStatus }) {
  const emit = (status, extra) => {
    onStatus?.(status, extra);
  };

  let closed = false;
  let ws = null;
  let captureCtx = null;
  let playbackCtx = null;
  let processor = null;
  let source = null;
  let mediaStream = null;
  let nextPlayTime = 0;
  const activeSources = new Set();
  let muted = false;
  let pendingToolCalls = 0;
  let assistantBuf = '';
  let userLive = '';
  let assistantSpeaking = false;
  let assistantPostedForResponse = false;
  let usingOutputTranscriptEvents = false;
  let currentAssistantResponseId = '';
  let userTurnSeq = 0;
  let currentUserItemId = 'user-live-0';
  const greeting = session.greeting || PROS_DEFAULT_GREETING;

  const isPlayingAudio = () =>
    Boolean(playbackCtx && nextPlayTime > playbackCtx.currentTime + 0.05);

  const micShouldSend = () =>
    !closed && !muted && !assistantSpeaking && !isPlayingAudio() && ws?.readyState === WebSocket.OPEN;

  const commitAssistantTranscript = (event) => {
    if (assistantPostedForResponse) return;
    const text = (assistantBuf || event.transcript || event.text || '').trim();
    assistantBuf = '';
    if (!text) return;
    if (text === greeting) return;
    assistantPostedForResponse = true;
    const itemId = currentAssistantResponseId || event.response_id || event.item_id || event.id;
    onTranscript?.({ role: 'assistant', content: text, kind: 'voice', itemId });
  };

  const upsertUserTranscript = (event, final) => {
    const text = (event.transcript || event.text || userLive || '').trim();
    if (event.transcript || event.text) userLive = event.transcript || event.text;
    if (!text) return;
    const itemId = event.item_id || event.id || currentUserItemId;
    if (event.item_id) currentUserItemId = event.item_id;
    onTranscript?.({ role: 'user', content: text, kind: 'voice', itemId, final });
  };

  const stopPlayback = () => {
    for (const src of activeSources) {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    }
    activeSources.clear();
    nextPlayTime = playbackCtx ? playbackCtx.currentTime : 0;
  };

  const playPcm16 = (pcm) => {
    if (!playbackCtx || !pcm?.length) return;
    const float32 = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) float32[i] = pcm[i] / 32768;
    const buffer = playbackCtx.createBuffer(1, float32.length, SAMPLE_RATE);
    buffer.getChannelData(0).set(float32);
    const src = playbackCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(playbackCtx.destination);
    const now = playbackCtx.currentTime;
    if (nextPlayTime < now) nextPlayTime = now;
    src.onended = () => activeSources.delete(src);
    src.start(nextPlayTime);
    nextPlayTime += buffer.duration;
    activeSources.add(src);
  };

  const waitForPlaybackDrain = () =>
    new Promise((resolve) => {
      const tick = () => {
        if (!playbackCtx || playbackCtx.currentTime >= nextPlayTime - 0.04) resolve();
        else setTimeout(tick, 60);
      };
      tick();
    });

  const sendJson = (payload) => {
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
  };

  const CLIENT_TOOLS = new Set(['lookup_pros_playbook']);

  const isBenignSessionError = (msg) => {
    const text = String(msg || '').toLowerCase();
    return (
      /no active response/.test(text) ||
      /nothing to cancel/.test(text) ||
      /already (been )?cancel/.test(text) ||
      /cancellation failed/.test(text) ||
      /already has an active response/.test(text) ||
      /response is not active/.test(text) ||
      /cannot cancel/.test(text)
    );
  };

  const seedHistory = (history) => {
    const items = (history || [])
      .filter((m) => m?.role === 'user' || m?.role === 'assistant')
      .filter((m) => m.channel !== 'voice')
      .filter((m) => typeof m.content === 'string' && m.content.trim())
      .filter((m, i, arr) => i === 0 || m.content.trim() !== arr[i - 1].content.trim())
      .slice(-8);
    for (const m of items) {
      sendJson({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: m.role,
          content: [
            {
              type: m.role === 'user' ? 'input_text' : 'output_text',
              text: m.content.trim().slice(0, 2000),
            },
          ],
        },
      });
    }
    return items;
  };

  const handleToolCall = async (event) => {
    const name = event.name || event.item?.name;
    if (!CLIENT_TOOLS.has(name)) return;
    pendingToolCalls += 1;
    emit('thinking');
    let args = {};
    try {
      args = event.arguments ? JSON.parse(event.arguments) : {};
    } catch {
      args = {};
    }
    const result = executeVoiceTool(name, args);
    sendJson({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: event.call_id,
        output: JSON.stringify(result),
      },
    });
    pendingToolCalls = Math.max(0, pendingToolCalls - 1);
    if (pendingToolCalls === 0) {
      await waitForPlaybackDrain();
      sendJson({ type: 'response.create' });
    }
  };

  const onWsMessage = (raw) => {
    let event;
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }
    onEvent?.(event);
    const type = event.type;

    if (type === 'session.updated') {
      if (!assistantSpeaking && !isPlayingAudio()) emit('listening');
    }
    if (type === 'input_audio_buffer.speech_started') {
      if (assistantSpeaking || isPlayingAudio()) return;
      userTurnSeq += 1;
      currentUserItemId = `user-live-${userTurnSeq}`;
      userLive = '';
      stopPlayback();
      emit('listening');
    }
    if (type === 'input_audio_buffer.speech_stopped') {
      if (!assistantSpeaking) emit('thinking');
    }
    if (type === 'response.created') {
      assistantBuf = '';
      assistantPostedForResponse = false;
      usingOutputTranscriptEvents = false;
      currentAssistantResponseId = event.response_id || event.id || '';
      assistantSpeaking = true;
      emit('speaking');
    }
    if (type === 'response.output_audio.delta' || type === 'response.audio.delta') {
      if (event.delta) playPcm16(base64ToPcm16(event.delta));
    }
    if (type === 'response.output_audio_transcript.delta') {
      usingOutputTranscriptEvents = true;
      assistantBuf += event.delta || '';
    } else if (type === 'response.audio_transcript.delta' && !usingOutputTranscriptEvents) {
      assistantBuf += event.delta || '';
    }
    if (type === 'response.output_audio_transcript.done') {
      usingOutputTranscriptEvents = true;
      commitAssistantTranscript(event);
    } else if (type === 'response.audio_transcript.done') {
      commitAssistantTranscript(event);
    }
    if (type === 'conversation.item.input_audio_transcription.updated') {
      upsertUserTranscript(event, false);
    }
    if (type === 'conversation.item.input_audio_transcription.completed') {
      const status = event.status || event.item?.status;
      upsertUserTranscript(event, status !== 'in_progress');
    }
    if (type === 'response.function_call_arguments.done') {
      handleToolCall(event);
    }
    if (type === 'response.done') {
      if (assistantBuf.trim()) commitAssistantTranscript(event);
      assistantSpeaking = false;
      waitForPlaybackDrain().then(() => {
        if (!closed) emit('listening');
      });
    }
    if (type === 'error') {
      const msg = event.error?.message || event.message || 'Voice session error';
      if (isBenignSessionError(msg)) return;
      emit('error', msg);
    }
  };

  const cleanup = () => {
    if (closed) return;
    closed = true;
    stopPlayback();
    try {
      processor?.disconnect();
    } catch {
      /* ignore */
    }
    try {
      source?.disconnect();
    } catch {
      /* ignore */
    }
    mediaStream?.getTracks().forEach((t) => t.stop());
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    }
    captureCtx?.close().catch(() => {});
    playbackCtx?.close().catch(() => {});
    ws = null;
    emit('idle');
  };

  const start = async () => {
    emit('connecting');
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });

    captureCtx = new AudioContext();
    playbackCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
    await captureCtx.resume();
    await playbackCtx.resume();

    source = captureCtx.createMediaStreamSource(mediaStream);
    processor = captureCtx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      if (!micShouldSend()) return;
      const input = e.inputBuffer.getChannelData(0);
      const resampled = downsample(input, captureCtx.sampleRate, SAMPLE_RATE);
      const pcm = floatToPcm16(resampled);
      sendJson({ type: 'input_audio_buffer.append', audio: pcm16ToBase64(pcm) });
    };
    const silent = captureCtx.createGain();
    silent.gain.value = 0;
    source.connect(processor);
    processor.connect(silent);
    silent.connect(captureCtx.destination);

    const token = session.value;
    const url =
      session.realtimeUrl ||
      (session.agentId
        ? `wss://api.x.ai/v1/realtime?agent_id=${encodeURIComponent(session.agentId)}`
        : `wss://api.x.ai/v1/realtime?model=${session.model || 'grok-voice-latest'}`);
    ws = new WebSocket(url, [`xai-client-secret.${token}`]);

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Voice connection timed out.')), 15000);
      ws.onopen = () => {
        clearTimeout(timer);
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Could not connect to Grok Voice.'));
      };
    });

    ws.onmessage = (ev) => {
      if (typeof ev.data === 'string') onWsMessage(ev.data);
    };
    ws.onclose = () => {
      if (!closed) cleanup();
    };

    if (session.instructions) {
      sendJson({
        type: 'session.update',
        session: {
          voice: session.voice && session.voice !== 'eve' ? session.voice : 'aurora',
          instructions: session.instructions,
          tools: session.tools,
          turn_detection: { type: 'server_vad' },
          replace: {
            AiBhive: 'A I Bhive',
            aibhive: 'A I Bhive',
          },
          audio: {
            input: {
              format: { type: 'audio/pcm', rate: SAMPLE_RATE },
              transcription: {
                model: 'grok-transcribe',
                language_hint: 'en',
                keyterms: ['AiBhive', 'Grok', 'HVAC', 'GFCI', 'Diagnose', 'dispatch'],
              },
            },
            output: { format: { type: 'audio/pcm', rate: SAMPLE_RATE } },
          },
        },
      });
    }

    const seeded = seedHistory(chatHistory);
    const hasUserTurns = seeded.some((m) => m.role === 'user');
    if (hasUserTurns) {
      sendJson({ type: 'response.create' });
    } else {
      assistantSpeaking = true;
      sendJson({
        type: 'conversation.item.create',
        item: {
          type: 'force_message',
          role: 'assistant',
          interruptible: false,
          content: [{ type: 'output_text', text: greeting }],
        },
      });
      onTranscript?.({ role: 'assistant', content: greeting, kind: 'voice', itemId: 'greeting' });
    }
    emit('listening');
  };

  const started = start().catch((err) => {
    cleanup();
    throw err;
  });

  return {
    started,
    hangup: cleanup,
    setMuted: (next) => {
      muted = Boolean(next);
      mediaStream?.getAudioTracks().forEach((t) => {
        t.enabled = !muted;
      });
    },
    get muted() {
      return muted;
    },
  };
}
