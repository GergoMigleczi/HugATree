How to use LoadingProvider
==========================

Wrap your application (or the top-level part of it that should show global loading UI) with the `LoadingProvider` so the context is available throughout the tree. Put the provider near the root so any screen or component can trigger the overlay.

Example (App root)
------------------

```tsx
import React from "react";
import { LoadingProvider } from "./ui/loading/LoadingProvider";
import { Navigation } from "../navigation"; // your app navigation

export default function App() {
  return (
    <LoadingProvider>
      <Navigation />
    </LoadingProvider>
  );
}
```

Examples
========

Using the hook to show/hide manually
------------------------------------

```tsx
import React from "react";
import { Button } from "react-native";
import { useLoading } from "./ui/loading/LoadingProvider";

export function SomeScreen() {
  const { show, hide } = useLoading();

  return (
    <Button
      title="Start"
      onPress={() => {
        show({ message: "Working…", blocking: true });
        setTimeout(hide, 1500);
      }}
    />
  );
}
```

Using `withLoading` to wrap async work
--------------------------------------

```tsx
import React from "react";
import { useLoading } from "./ui/loading/LoadingProvider";

export function SaveButton() {
  const { withLoading } = useLoading();

  async function onSave() {
    await withLoading(async () => {
      await api.saveChanges();
    }, { message: "Saving…" });
  }

  return <Button title="Save" onPress={onSave} />;
}
```

Non-blocking overlay (user can still interact)
----------------------------------------------

```ts
show({ message: "Loading data…", blocking: false });
```

Solid background overlay
------------------------

```ts
show({ message: "Please wait", background: "solid" });
```

API and behavior (what `LoadingProvider` provides)
=================================================

- `show(options?)`: schedules showing the overlay. `options` may include:
  - `message?: string` — optional message shown under the spinner.
  - `blocking?: boolean` — if true (default) the overlay blocks touches; if false the overlay is visually present but lets touches through.
  - `background?: "transparent" | "solid"` — `transparent` (default) renders a dim background; `solid` renders a solid app background behind the overlay.
- `hide()`: hides the overlay (honors a brief minimum visible time to prevent flicker).
- `withLoading(fn, options?)`: convenience helper that calls `show(options)`, awaits the provided async function `fn`, then calls `hide()` in a finally block.

Implementation notes
====================

- The provider uses a short show delay (200ms) before making the overlay visible. This avoids flashing the overlay for very fast operations.
- Once visible, it enforces a minimum visible time (~300ms) so quick hide/show cycles don't flicker the UI.
- The overlay is implemented with a `Modal` and an `ActivityIndicator` and renders the optional `message`.

Source
======

See the implementation: [mobile/src/ui/loading/LoadingProvider.tsx](mobile/src/ui/loading/LoadingProvider.tsx)
