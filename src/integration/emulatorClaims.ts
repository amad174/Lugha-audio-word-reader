import { execFileSync } from 'child_process';
import path from 'path';

/** Sets auth custom claims via Admin SDK script (runs outside Jest). */
export function setEmulatorClaims(
  uid: string,
  orgId: string,
  role: 'teacher' | 'student'
): void {
  const script = path.resolve(__dirname, '../../scripts/set-emulator-claims.cjs');
  execFileSync(process.execPath, [script, uid, orgId, role], {
    env: process.env,
    stdio: 'pipe',
  });
}
