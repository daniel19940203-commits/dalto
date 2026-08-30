import { describe, it, expect } from 'vitest';
import { encryptJSON, decryptJSON, verifyPin } from './crypto';

describe('Cifrado en reposo (AES-GCM + PBKDF2)', () => {
  const data = { concepts: [{ id: '1', amount: 4_500_000 }], secret: 'privado' };

  it('descifra con el PIN correcto (round-trip)', async () => {
    const env = await encryptJSON(data, '1994');
    const back = await decryptJSON<typeof data>(env, '1994');
    expect(back).toEqual(data);
  });

  it('falla con PIN incorrecto', async () => {
    const env = await encryptJSON(data, '1994');
    await expect(decryptJSON(env, '0000')).rejects.toBeTruthy();
    expect(await verifyPin(env, '0000')).toBe(false);
    expect(await verifyPin(env, '1994')).toBe(true);
  });

  it('cada cifrado usa salt/iv distintos', async () => {
    const a = await encryptJSON(data, 'pin');
    const b = await encryptJSON(data, 'pin');
    expect(a.salt).not.toBe(b.salt);
    expect(a.iv).not.toBe(b.iv);
    expect(a.data).not.toBe(b.data);
  });
});
