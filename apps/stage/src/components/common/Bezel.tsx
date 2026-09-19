import type { ReactNode } from "react";
import { View } from "react-native";

export interface BezelProps {
  children: ReactNode;
  tone?: "default" | "raised";
}

export function Bezel({ children, tone = "default" }: BezelProps) {
  return (
    <View
      className="rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-1.5"
      style={
        tone === "raised"
          ? {
              shadowColor: "#000",
              shadowOpacity: 0.55,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 18 },
            }
          : undefined
      }
    >
      <View
        className="overflow-hidden rounded-[22px] border border-white/[0.05] bg-card"
        style={{
          shadowColor: "#FFFFFF",
          shadowOpacity: 0.06,
          shadowRadius: 1,
          shadowOffset: { width: 0, height: 1 },
        }}
      >
        {children}
      </View>
    </View>
  );
}
