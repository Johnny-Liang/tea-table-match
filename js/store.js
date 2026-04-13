// js/store.js

const STORE_KEY = 'tea_table_match_state';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function getState() {
  const data = localStorage.getItem(STORE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse stored state:', e);
      return getDefaultState();
    }
  }
  return getDefaultState();
}

function getDefaultState() {
  return {
    tableCount: 10,
    tables: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      guests: [],
      amount: null
    })),
    guests: []
  };
}

function saveState(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function clearAllSeats() {
  const state = getState();
  state.tables = state.tables.map(table => ({
    ...table,
    guests: [],
    amount: null
  }));
  saveState(state);
}

// Guest operations
function saveGuest(guest) {
  const state = getState();
  const existingIndex = state.guests.findIndex(g => g.id === guest.id);
  if (existingIndex >= 0) {
    state.guests[existingIndex] = { ...guest, updatedAt: Date.now() };
  } else {
    state.guests.push({ ...guest, createdAt: Date.now(), updatedAt: Date.now() });
  }
  saveState(state);
}

function searchGuests(keyword) {
  const state = getState();
  if (!keyword) return state.guests;
  const lower = keyword.toLowerCase();
  return state.guests.filter(g => g.name && g.name.toLowerCase().includes(lower));
}

function getGuestById(id) {
  const state = getState();
  return state.guests.find(g => g.id === id);
}
