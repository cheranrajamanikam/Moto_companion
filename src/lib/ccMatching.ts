import { userService } from "@/services/userService";

export const CC_TOLERANCE = 150;

export function getPrimaryEngineCc(fallback = 350): number {
  const user = userService.getCurrentUser();
  const primary = user.bikes.find((b) => b.isPrimary) || user.bikes[0];
  return primary?.engineCC ?? fallback;
}

export function getCcMatchRange(userCc?: number): { min: number; max: number; userCc: number } {
  const cc = userCc ?? getPrimaryEngineCc();
  return {
    userCc: cc,
    min: Math.max(50, cc - CC_TOLERANCE),
    max: Math.min(2000, cc + CC_TOLERANCE),
  };
}

export function isCcCompatible(matchedCc: number, userCc?: number): boolean {
  const { min, max } = getCcMatchRange(userCc);
  return matchedCc >= min && matchedCc <= max;
}
