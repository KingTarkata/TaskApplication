// Firestore security rules tests. Run with:  npm run test:rules
// (starts the Firestore emulator, runs this file with node:test, then stops it)
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-hearthstead',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

after(async () => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  // A household "h1" owned by alice, with alice as a member and one chore, plus an invite code
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'households/h1'), { name: 'Our Home', ownerId: 'alice' });
    await setDoc(doc(db, 'households/h1/members/alice'), { displayName: 'Alice' });
    await setDoc(doc(db, 'households/h1/tasks/t1'), { title: 'Sweep' });
    await setDoc(doc(db, 'invites/ABC123'), { householdId: 'h1', createdBy: 'alice' });
  });
});

const as = (uid) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

describe('household data', () => {
  it('members can read and write chores', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), 'households/h1/tasks/t1')));
    await assertSucceeds(setDoc(doc(as('alice'), 'households/h1/tasks/t2'), { title: 'Mop' }));
  });

  it('outsiders and signed-out users cannot read or write chores', async () => {
    await assertFails(getDoc(doc(as('mallory'), 'households/h1/tasks/t1')));
    await assertFails(setDoc(doc(as('mallory'), 'households/h1/tasks/t9'), { title: 'x' }));
    await assertFails(getDocs(collection(anon(), 'households/h1/tasks')));
  });

  it('outsiders cannot read the household or its members', async () => {
    await assertFails(getDoc(doc(as('mallory'), 'households/h1')));
    await assertFails(getDocs(collection(as('mallory'), 'households/h1/members')));
  });
});

describe('joining', () => {
  it('lets someone join with a valid invite code', async () => {
    await assertSucceeds(getDoc(doc(as('bob'), 'invites/ABC123')));
    await assertSucceeds(
      setDoc(doc(as('bob'), 'households/h1/members/bob'), { displayName: 'Bob', inviteCode: 'ABC123' })
    );
    await assertSucceeds(getDoc(doc(as('bob'), 'households/h1/tasks/t1')));
  });

  it('rejects joining without a code, with a wrong code, or as someone else', async () => {
    await assertFails(setDoc(doc(as('bob'), 'households/h1/members/bob'), { displayName: 'Bob' }));
    await assertFails(
      setDoc(doc(as('bob'), 'households/h1/members/bob'), { displayName: 'Bob', inviteCode: 'NOPE00' })
    );
    await assertFails(
      setDoc(doc(as('bob'), 'households/h1/members/carol'), { displayName: 'Carol', inviteCode: 'ABC123' })
    );
  });

  it('does not allow listing invite codes', async () => {
    await assertFails(getDocs(collection(as('bob'), 'invites')));
  });

  it('only members can create invites for their household', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'invites/XYZ789'), { householdId: 'h1', createdBy: 'alice' }));
    await assertFails(setDoc(doc(as('mallory'), 'invites/BAD000'), { householdId: 'h1', createdBy: 'mallory' }));
  });
});

describe('creating households', () => {
  it('lets you create a household you own and add yourself', async () => {
    const db = as('dave');
    await assertSucceeds(setDoc(doc(db, 'households/h2'), { name: 'Dave Home', ownerId: 'dave' }));
    await assertSucceeds(setDoc(doc(db, 'households/h2/members/dave'), { displayName: 'Dave' }));
  });

  it('does not let you create a household owned by someone else', async () => {
    await assertFails(setDoc(doc(as('dave'), 'households/h3'), { name: 'x', ownerId: 'alice' }));
  });

  it('does not let a member take over ownership', async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), 'households/h1/members/bob'), { displayName: 'Bob' })
    );
    await assertFails(setDoc(doc(as('bob'), 'households/h1'), { name: 'Mine now', ownerId: 'bob' }));
    await assertSucceeds(setDoc(doc(as('bob'), 'households/h1'), { name: 'Renamed', ownerId: 'alice' }));
  });
});

describe('user pointers', () => {
  it('each person can only access their own user doc', async () => {
    await assertSucceeds(setDoc(doc(as('bob'), 'users/bob'), { householdId: 'h1' }));
    await assertFails(getDoc(doc(as('mallory'), 'users/bob')));
    await assertFails(setDoc(doc(as('mallory'), 'users/bob'), { householdId: 'evil' }));
  });

  it('members can leave, and the owner can remove members', async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), 'households/h1/members/bob'), { displayName: 'Bob' })
    );
    await assertFails(deleteDoc(doc(as('mallory'), 'households/h1/members/bob')));
    await assertSucceeds(deleteDoc(doc(as('alice'), 'households/h1/members/bob')));
  });
});
