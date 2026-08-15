import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import updateMyProfile from "./tools/update-my-profile";
import getMyWallet from "./tools/get-my-wallet";
import listHosts from "./tools/list-hosts";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "crush-mcp",
  title: "Crush",
  version: "0.1.0",
  instructions:
    "Tools for the signed-in Crush user. Read/update your profile, check your coin wallet, and browse hosts.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyProfile, updateMyProfile, getMyWallet, listHosts],
});
