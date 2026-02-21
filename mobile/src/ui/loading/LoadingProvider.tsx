import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from "react-native";

type BackgroundStyle = "transparent" | "solid";

type LoadingState = {
  visible: boolean;
  message?: string;
  blocking: boolean;
  background: BackgroundStyle;
};

type ShowLoadingOptions = {
  message?: string;
  blocking?: boolean; // default true
  background?: BackgroundStyle; // default "transparent"
};

type LoadingContextValue = {
  show: (options?: ShowLoadingOptions) => void;
  hide: () => void;
  withLoading: <T>(
    fn: () => Promise<T>,
    options?: ShowLoadingOptions
  ) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LoadingState>({
    visible: false,
    message: undefined,
    blocking: true,
    background: "transparent",
    });

    const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const shownAt = useRef<number | null>(null);
    const lastOptions = useRef<ShowLoadingOptions | undefined>(undefined);

    const show = useCallback((options?: ShowLoadingOptions) => {
    lastOptions.current = options;
    const delayMs = 200;

    // Cancel any pending show
    if (showTimer.current) {
        clearTimeout(showTimer.current);
        showTimer.current = null;
    }

    showTimer.current = setTimeout(() => {
        shownAt.current = Date.now();
        setState({
        visible: true,
        message: options?.message,
        blocking: options?.blocking ?? true,
        background: options?.background ?? "transparent",
        });
    }, delayMs);
    }, []);

    const hide = useCallback(() => {
    // If we haven't shown yet, just cancel the pending show.
    if (showTimer.current) {
        clearTimeout(showTimer.current);
        showTimer.current = null;
    }

    // If we *have* shown, respect minVisibleMs to prevent flicker.
    const minVisibleMs = 300;

    if (shownAt.current) {
        const elapsed = Date.now() - shownAt.current;
        const remaining = Math.max(0, minVisibleMs - elapsed);

        if (remaining > 0) {
        setTimeout(() => {
            shownAt.current = null;
            setState((s) => ({ ...s, visible: false, message: undefined }));
        }, remaining);
        return;
        }
    }

    shownAt.current = null;
    setState((s) => ({ ...s, visible: false, message: undefined }));
    }, []);

  const withLoading = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      options?: ShowLoadingOptions
    ) => {
      show(options);
      try {
        return await fn();
      } finally {
        hide();
      }
    },
    [show, hide]
  );

  const value = useMemo(
    () => ({ show, hide, withLoading }),
    [show, hide, withLoading]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay {...state} />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return ctx;
}

function LoadingOverlay(props: LoadingState) {
  const { visible, message, blocking, background } = props;

  if (!visible) return null;

  return (
    <Modal visible transparent={background !== "solid"} statusBarTranslucent animationType="none">
      <View
        style={[
          StyleSheet.absoluteFill,
          background === "solid" ? styles.solidBg : styles.transparentBg,
        ]}
        pointerEvents={blocking ? "auto" : "none"}
      >
        {background === "transparent" && <View style={[StyleSheet.absoluteFill, styles.dim]} />}

        <View style={styles.centerWrap} pointerEvents="none">
          <View style={styles.card}>
            <ActivityIndicator size="large" color="#fff" />
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: {
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    minWidth: 180,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    alignItems: "center",
    backgroundColor: "rgba(20,20,20,0.9)",
  },
  gif: {
    width: 120,
    height: 120,
  },
  message: {
    color: "white",
    textAlign: "center",
  },
  solidBg: { backgroundColor: "#0B0B0B" },      // pick your app background
  transparentBg: { backgroundColor: "transparent" },
});