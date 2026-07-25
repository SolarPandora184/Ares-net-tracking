// js/firebase/db.js
// Thin, typed-ish wrappers around Realtime Database reads/writes. Keeping every
// path string in one file makes it easy to keep the schema consistent and to
// optimize reads later (e.g. adding .indexOn rules) without hunting through pages.

import {
  ref,
  get,
  set,
  push,
  update,
  remove,
  query,
  orderByChild,
  limitToLast,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { db } from "./config.js";
import { logAudit } from "./audit.js";

/* ---------------------------------------------------------------------- */
/* Staff roster                                                            */
/* ---------------------------------------------------------------------- */

export function watchStaff(callback) {
  return onValue(ref(db, "staff"), (snap) => callback(objectToArray(snap.val())));
}

export async function saveStaffMember(id, data) {
  const path = id ? `staff/${id}` : `staff/${push(ref(db, "staff")).key}`;
  await set(ref(db, path), data);
  await logAudit("staff_edit", { path, data });
}

export async function deleteStaffMember(id) {
  await remove(ref(db, `staff/${id}`));
  await logAudit("staff_delete", { id });
}

/* ---------------------------------------------------------------------- */
/* Area controllers (Mountain / Metro)                                    */
/* ---------------------------------------------------------------------- */

export function watchAreas(kind, callback) {
  // kind: "mountain" | "metro"
  return onValue(ref(db, `areas/${kind}`), (snap) => callback(objectToArray(snap.val())));
}

export async function saveArea(kind, id, data) {
  const path = id ? `areas/${kind}/${id}` : `areas/${kind}/${push(ref(db, `areas/${kind}`)).key}`;
  await set(ref(db, path), data);
}

/* ---------------------------------------------------------------------- */
/* Alternate bands / frequencies                                          */
/* ---------------------------------------------------------------------- */

export function watchBands(callback) {
  return onValue(ref(db, "bands"), (snap) => callback(objectToArray(snap.val())));
}

export async function saveBand(id, data) {
  const path = id ? `bands/${id}` : `bands/${push(ref(db, "bands")).key}`;
  await set(ref(db, path), data);
}

/* ---------------------------------------------------------------------- */
/* Nets (the weekly net form + historical records)                        */
/* ---------------------------------------------------------------------- */

export async function createNet(netData) {
  const newRef = push(ref(db, "nets"));
  await set(newRef, netData);
  await logAudit("net_created", { id: newRef.key, date: netData.date });
  return newRef.key;
}

export async function updateNet(id, patch) {
  await update(ref(db, `nets/${id}`), patch);
  await logAudit("net_edited", { id, patch });
}

export async function deleteNet(id) {
  await remove(ref(db, `nets/${id}`));
  await logAudit("net_deleted", { id });
}

export async function getNet(id) {
  const snap = await get(ref(db, `nets/${id}`));
  return snap.exists() ? { id, ...snap.val() } : null;
}

export function watchRecentNets(count, callback) {
  const q = query(ref(db, "nets"), orderByChild("date"), limitToLast(count));
  return onValue(q, (snap) => {
    const arr = objectToArray(snap.val());
    arr.sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
    callback(arr);
  });
}

/* Autosave: writes a draft under nets/{id} with status:"draft" so the Weekly
   Net Form can save-as-you-go without the user hitting a Save button. */
export async function autosaveNetDraft(id, partialData) {
  const path = id ? `nets/${id}` : `nets/${push(ref(db, "nets")).key}`;
  const key = path.split("/")[1];
  await update(ref(db, path), { ...partialData, status: "draft", updatedAt: Date.now() });
  return key;
}

/* ---------------------------------------------------------------------- */
/* Invitations (admin-only)                                                */
/* ---------------------------------------------------------------------- */

export async function createInvitation({ name, email, callsign, role, expiresInDays = 7 }) {
  const code = generateInviteCode();
  await set(ref(db, `invitations/${code}`), {
    name,
    email,
    callsign,
    role,
    createdAt: Date.now(),
    expiresAt: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    used: false,
    revoked: false,
  });
  await logAudit("invitation_created", { code, email, role });
  return code;
}

export async function revokeInvitation(code) {
  await update(ref(db, `invitations/${code}`), { revoked: true });
  await logAudit("invitation_revoked", { code });
}

export function watchInvitations(callback) {
  return onValue(ref(db, "invitations"), (snap) => {
    const val = snap.val() || {};
    callback(Object.entries(val).map(([code, data]) => ({ code, ...data })));
  });
}

function generateInviteCode(length = 14) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
  let out = "";
  const rand = new Uint32Array(length);
  crypto.getRandomValues(rand);
  for (let i = 0; i < length; i++) out += chars[rand[i] % chars.length];
  return out;
}

/* ---------------------------------------------------------------------- */
/* Shared helpers                                                          */
/* ---------------------------------------------------------------------- */

/* ---------------------------------------------------------------------- */
/* Audit log reads (writes live in firebase/audit.js)                     */
/* ---------------------------------------------------------------------- */

export function watchRecentAuditLog(count, callback) {
  const q = query(ref(db, "auditLog"), orderByChild("timestamp"), limitToLast(count));
  return onValue(q, (snap) => {
    const arr = objectToArray(snap.val());
    arr.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    callback(arr);
  });
}

/* ---------------------------------------------------------------------- */
/* Emergency traffic (read across all nets, for dashboard alerts)          */
/* ---------------------------------------------------------------------- */

export function watchOpenEmergencyTraffic(callback) {
  return onValue(ref(db, "nets"), (snap) => {
    const nets = objectToArray(snap.val());
    const openItems = [];
    for (const net of nets) {
      for (const item of net.emergencyTraffic || []) {
        if (!item.resolved) openItems.push({ ...item, netId: net.id, netDate: net.date });
      }
    }
    callback(openItems);
  });
}

function objectToArray(obj) {
  if (!obj) return [];
  return Object.entries(obj).map(([id, data]) => ({ id, ...data }));
}
