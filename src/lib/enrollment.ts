import { timingSafeEqual,createHash } from "node:crypto";
export function validEnrollmentToken(token:unknown,expected:string|undefined){
  return Boolean(expected&&/^[a-f0-9]{64}$/.test(expected)&&typeof token==="string"&&timingSafeEqual(createHash("sha256").update(token).digest(),Buffer.from(expected,"hex")));
}
