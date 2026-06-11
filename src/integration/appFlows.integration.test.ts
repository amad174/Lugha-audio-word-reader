/**
 * Firebase emulator integration tests — run via `npm run test:integration`.
 * Requires auth, firestore, and storage emulators (started automatically by that script).
 *
 * @jest-environment node
 */

jest.mock('../utils/pdf', () => ({
  pdfToDataUrls: jest.fn(async () => ['data:image/jpeg;base64,pdfpage']),
  countPdfPages: jest.fn(async () => 1),
}));

import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { setEmulatorClaims } from './emulatorClaims';
import {
  signUpTeacher,
  signUpStudent,
  signIn,
  findOrgByInviteCode,
  listOrgStudents,
} from '../services/authService';
import { createBook, getBook, listBooks } from '../services/libraryService';
import { importFilesToBook, listPages } from '../services/bookService';

const runIntegration = process.env.FIREBASE_INTEGRATION_TEST === 'true';
const describeIntegration = runIntegration ? describe : describe.skip;

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 1×1 PNG */
function tinyPngFile(name = 'page.png'): File {
  const base64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const bytes = Buffer.from(base64, 'base64');
  return new File([bytes], name, { type: 'image/png' });
}

describeIntegration('Firebase emulator flows', () => {
  jest.setTimeout(60000);

  afterEach(async () => {
    if (auth.currentUser) await signOut(auth);
  });

  test('FB-02: teacher signup creates org and user profile', async () => {
    const id = uid();
    const teacher = await signUpTeacher(
      `teacher-${id}@test.local`,
      'TestPass123!',
      'Test Teacher',
      `Org ${id}`
    );

    expect(teacher.role).toBe('teacher');
    expect(teacher.orgId).toBeTruthy();

    const userSnap = await getDoc(doc(db, 'users', teacher.uid));
    expect(userSnap.exists()).toBe(true);
    expect(userSnap.data()?.role).toBe('teacher');

    const orgSnap = await getDoc(doc(db, 'orgs', teacher.orgId));
    expect(orgSnap.exists()).toBe(true);
    expect(orgSnap.data()?.name).toBe(`Org ${id}`);
    expect(orgSnap.data()?.inviteCode).toMatch(/^[A-Z0-9]{6}$/);
  });

  test('FB-05: student joins org via invite code', async () => {
    const id = uid();
    const teacher = await signUpTeacher(
      `teacher-${id}@test.local`,
      'TestPass123!',
      'Teacher',
      `School ${id}`
    );
    const orgSnap = await getDoc(doc(db, 'orgs', teacher.orgId));
    const inviteCode = orgSnap.data()?.inviteCode as string;

    await signOut(auth);

    const student = await signUpStudent(
      `student-${id}@test.local`,
      'TestPass123!',
      'Test Student',
      inviteCode
    );

    expect(student.role).toBe('student');
    expect(student.orgId).toBe(teacher.orgId);

    const orgId = await findOrgByInviteCode(inviteCode);
    expect(orgId).toBe(teacher.orgId);

    await signOut(auth);
    await signIn(`teacher-${id}@test.local`, 'TestPass123!');
    const students = await listOrgStudents(teacher.orgId);
    expect(students.some(s => s.uid === student.uid)).toBe(true);
  });

  test('FB-03: teacher creates book and imports page to storage', async () => {
    const id = uid();
    const teacher = await signUpTeacher(
      `teacher-${id}@test.local`,
      'TestPass123!',
      'Teacher',
      `Org ${id}`
    );

    setEmulatorClaims(teacher.uid, teacher.orgId, 'teacher');
    await auth.currentUser!.getIdToken(true);

    const book = await createBook(teacher.orgId, 'Integration Book', null, teacher.uid);
    expect(book.pageCount).toBe(0);

    const added = await importFilesToBook(teacher.orgId, book.id, [tinyPngFile()]);
    expect(added).toBe(1);

    const pages = await listPages(teacher.orgId, book.id);
    expect(pages).toHaveLength(1);
    expect(pages[0].imageUrl).toMatch(/^http/);

    const updated = await getBook(teacher.orgId, book.id);
    expect(updated?.pageCount).toBe(1);
    expect(updated?.coverUrl).toBeTruthy();
  });

  test('AUTH-05: teacher can sign in after signup', async () => {
    const id = uid();
    const email = `teacher-${id}@test.local`;
    await signUpTeacher(email, 'TestPass123!', 'Teacher', `Org ${id}`);
    await signOut(auth);

    const user = await signIn(email, 'TestPass123!');
    expect(user.email).toBe(email);
    expect(user.role).toBe('teacher');
  });

  test('FB-04: books are scoped to org (teacher only sees own org books)', async () => {
    const id = uid();

    const teacherA = await signUpTeacher(
      `a-${id}@test.local`,
      'TestPass123!',
      'Teacher A',
      `Org A ${id}`
    );
    await createBook(teacherA.orgId, 'Book A', null, teacherA.uid);
    await signOut(auth);

    const teacherB = await signUpTeacher(
      `b-${id}@test.local`,
      'TestPass123!',
      'Teacher B',
      `Org B ${id}`
    );
    const booksB = await listBooks(teacherB.orgId);
    expect(booksB.every(b => b.title !== 'Book A' || booksB.length === 0)).toBe(true);
  });
});
