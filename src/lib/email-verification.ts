export type VerificationStatus = "verified" | "invalid" | "signout_failed";
type VerificationResponse = { data: { user: { email_confirmed_at?: string | null } | null }; error: unknown };
export type VerificationAuth = {
  verifyOtp: (options: { token_hash: string; type: "email" }) => Promise<VerificationResponse>;
  exchangeCodeForSession: (code: string) => Promise<VerificationResponse>;
  signOut: (options: { scope: "local" }) => Promise<{ error: unknown }>;
};

export async function verifyConfirmation(params: URLSearchParams, getAuth: () => Promise<VerificationAuth>): Promise<VerificationStatus> {
  const code=params.get("code"),hash=params.get("token_hash"),type=params.get("type");
  if ((!code&&!hash)||(code&&hash)||(hash&&type!=="email")||(code&&code.length>4096)||(hash&&hash.length>4096)) return "invalid";
  try {
    const auth=await getAuth();
    const result=hash ? await auth.verifyOtp({token_hash:hash,type:"email"}) : await auth.exchangeCodeForSession(code!);
    if(result.error) return "invalid";
    // Confirmation establishes a temporary session. End only that session so
    // the customer signs in explicitly without signing out their other devices.
    const signedOut=await auth.signOut({scope:"local"});
    if(signedOut.error) return "signout_failed";
    return result.data.user?.email_confirmed_at ? "verified" : "invalid";
  } catch { return "invalid"; }
}
