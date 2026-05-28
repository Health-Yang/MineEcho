#!/bin/bash
set -e

BFF_URL="${BFF_URL:-http://127.0.0.1:3085}"
SESSION_ID="verify-$(date +%s)"

echo "=== MineEcho Chat HTTP Verification ==="
echo "Session ID: $SESSION_ID"
echo ""

# 1. POST /api/chat/send returns a normal assistant reply
echo "[1/5] Testing POST /api/chat/send..."
SEND_RESPONSE=$(curl -s -X POST "$BFF_URL/api/chat/send" \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"你好\",\"sessionId\":\"$SESSION_ID\",\"mode\":\"general\"}")
echo "Response: $SEND_RESPONSE"
echo "$SEND_RESPONSE" | grep -q '"role":"assistant"' && echo "PASS" || echo "FAIL: no assistant reply"
echo ""

# 2. POST /api/chat/send-stream emits started -> delta -> final correctly
echo "[2/5] Testing POST /api/chat/send-stream..."
STREAM_RESPONSE=$(curl -s -N -X POST "$BFF_URL/api/chat/send-stream" \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"你好\",\"sessionId\":\"$SESSION_ID-stream\",\"mode\":\"general\"}")
echo "Raw SSE:"
echo "$STREAM_RESPONSE"
HAS_STARTED=$(echo "$STREAM_RESPONSE" | grep -c "event: started" || true)
HAS_DELTA=$(echo "$STREAM_RESPONSE" | grep -c "event: delta" || true)
HAS_FINAL=$(echo "$STREAM_RESPONSE" | grep -c "event: final" || true)
if [ "$HAS_STARTED" -ge 1 ] && [ "$HAS_FINAL" -ge 1 ]; then
  echo "PASS (started=$HAS_STARTED, delta=$HAS_DELTA, final=$HAS_FINAL)"
else
  echo "FAIL (started=$HAS_STARTED, delta=$HAS_DELTA, final=$HAS_FINAL)"
fi
echo ""

# 3. GET /api/chat/history returns the session's messages
echo "[3/5] Testing GET /api/chat/history..."
HISTORY_RESPONSE=$(curl -s "$BFF_URL/api/chat/history?sessionId=$SESSION_ID")
echo "Response: $HISTORY_RESPONSE"
echo "$HISTORY_RESPONSE" | grep -q '"messages"' && echo "PASS" || echo "FAIL: no messages array"
echo ""

# 4. POST /api/chat/clear clears the session
echo "[4/5] Testing POST /api/chat/clear..."
CLEAR_RESPONSE=$(curl -s -X DELETE "$BFF_URL/api/chat/history?sessionId=$SESSION_ID")
echo "Response: $CLEAR_RESPONSE"
echo "$CLEAR_RESPONSE" | grep -q '"ok":true' && echo "PASS" || echo "FAIL"
echo ""

# 5. POST /api/chat/send with HCI trigger content
echo "[5/5] Testing POST /api/chat/send with HCI trigger..."
HCI_RESPONSE=$(curl -s -X POST "$BFF_URL/api/chat/send" \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"帮我生成深信服超融合的实施方案\",\"sessionId\":\"$SESSION_ID-hci\",\"mode\":\"general\"}")
echo "Response: $HCI_RESPONSE"
# Check for HCI-related keywords in the response content
if echo "$HCI_RESPONSE" | grep -iqE "超融合|HCI|深信服|实施|方案|aCloud"; then
  echo "PASS: HCI-related content detected"
else
  echo "FAIL: no HCI-related content"
fi
echo ""

echo "=== Verification Complete ==="
