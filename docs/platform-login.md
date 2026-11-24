# Platform identity and login

The game remains standalone. Google sign-in is optional, uses the same Firebase project as Yemken Hay, and persists independently on this game's origin. It does not grant room or admin privileges, and does not sync past matches. The Firebase SDK loads only in the home screen, not a direct room or projector entry.

Before testing Google sign-in, add `without-us.onrender.com` to Firebase Authentication → Settings → Authorized domains in the existing project. Enable Google provider if not already enabled. Redeploy this service. No service account or private credential is needed in the client. Keep the existing admin passcode separate.
