# Toolbar Definition for Config and Renderer DX

Toolbar config discovery may accept a **Toolbar Definition** produced by a renderer package's `createToolbar`, not only a plain **Toolbar Config** object. The same exported value can provide backend **Tool Registration**, render the toolbar in application code, and expose typed tool hooks, which lets tools such as the **Control Panel** infer frontend value types from shared config without generated type files or duplicate renderer config.

The trade-off is that `toolbar.config.ts` must remain frontend-safe when application code imports the **Toolbar Definition**. Server-only setup should move behind explicit server boundaries if a future tool needs Node-only behavior.
