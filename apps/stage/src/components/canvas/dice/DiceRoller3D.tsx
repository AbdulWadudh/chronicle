import { Canvas } from "@react-three/fiber";
import { useCallback, useMemo, useRef } from "react";
import { Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useThemeTokens } from "~/theme/ThemeEngine";
import { createDieGeometry, faceNormals, landingQuaternion } from "./geometry";
import { useDieAnimation } from "./useDieAnimation";

export interface DiceRoller3DProps {
  roll: number;
  size: number;
  onSettled?: () => void;
}

function Die({ roll, onSettled }: { roll: number; onSettled: () => void }) {
  const tokens = useThemeTokens();
  const reduceMotion = useReducedMotion();

  const geometry = useMemo(() => createDieGeometry(), []);
  const normals = useMemo(() => faceNormals(geometry), [geometry]);
  const target = useMemo(() => landingQuaternion(normals, roll), [normals, roll]);

  const mesh = useDieAnimation({ target, reduceMotion, onSettled });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <mesh ref={mesh} geometry={geometry}>
        <meshStandardMaterial
          color={tokens.primary}
          flatShading
          metalness={0.25}
          roughness={0.35}
        />
      </mesh>
    </>
  );
}

export function DiceRoller3D({ roll, size, onSettled }: DiceRoller3DProps) {
  const settledOnce = useRef(false);

  const handleSettled = useCallback(() => {
    if (settledOnce.current) return;
    settledOnce.current = true;
    onSettled?.();
  }, [onSettled]);

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Canvas frameloop="demand" camera={{ position: [0, 0, 3.4], fov: 45 }}>
        <Die roll={roll} onSettled={handleSettled} />
      </Canvas>
      <Text className="absolute bottom-1 text-2xl font-semibold text-text-primary">{roll}</Text>
    </View>
  );
}
