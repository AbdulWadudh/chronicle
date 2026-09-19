import { useFrame, useThree } from "@react-three/fiber";
import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import type { Mesh, Quaternion } from "three";

const TUMBLE_SECONDS = 1.1;
const SETTLE_RATE = 6;
const SETTLE_EPSILON = 0.002;
const TUMBLE_SPEED = { x: 5.2, y: 7.4, z: 3.1 };

export interface DieAnimationOptions {
  target: Quaternion;
  reduceMotion: boolean;
  onSettled: () => void;
}

export function useDieAnimation({ target, reduceMotion, onSettled }: DieAnimationOptions) {
  const mesh = useRef<Mesh>(null);
  const elapsed = useRef(0);
  const settled = useRef(false);
  const { invalidate } = useThree();

  useEffect(() => {
    elapsed.current = 0;
    settled.current = false;
    if (reduceMotion && mesh.current !== null) {
      mesh.current.quaternion.copy(target);
      settled.current = true;
      onSettled();
      invalidate();
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    invalidate();
  }, [reduceMotion, target, onSettled, invalidate]);

  useFrame((_state, delta) => {
    const die = mesh.current;
    if (die === null || settled.current) return;

    elapsed.current += delta;

    if (elapsed.current < TUMBLE_SECONDS) {
      die.rotation.x += TUMBLE_SPEED.x * delta;
      die.rotation.y += TUMBLE_SPEED.y * delta;
      die.rotation.z += TUMBLE_SPEED.z * delta;
      invalidate();
      return;
    }

    die.quaternion.slerp(target, Math.min(SETTLE_RATE * delta, 1));
    if (die.quaternion.angleTo(target) < SETTLE_EPSILON) {
      die.quaternion.copy(target);
      settled.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSettled();
      return;
    }
    invalidate();
  });

  return mesh;
}
