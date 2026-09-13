// Notifier port (ADR-02/03). Records events instead of sending real email/in-portal
// notifications — a real adapter would plug into the existing Portal notification service
// (Discovery-Analysis.md A-11) behind this exact same shape.
function createNotifier() {
  const events = [];
  return {
    events,
    notify(event) {
      events.push({ ...event, recordedAt: new Date().toISOString() });
    },
  };
}

module.exports = { createNotifier };
