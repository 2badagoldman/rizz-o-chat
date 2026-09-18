import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  dismissReviewPrompt,
  isNativeReviewPlatform,
  isReviewPromptEligible,
  onReviewReady,
  requestNativeReview,
} from "@/lib/app-review";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AppReviewPrompt({ pathname }: { pathname: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const inConversation = pathname.startsWith("/chat/") || pathname.startsWith("/rooms/");

  useEffect(() => {
    if (!user || inConversation) return;
    const qaPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has("reviewPrompt");
    const showIfEligible = () => {
      if ((isNativeReviewPlatform() && isReviewPromptEligible()) || qaPreview) setOpen(true);
    };
    const timer = window.setTimeout(showIfEligible, 900);
    const unsubscribe = onReviewReady(showIfEligible);
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [inConversation, pathname, user]);

  const close = () => {
    dismissReviewPrompt();
    setOpen(false);
  };

  const rate = async () => {
    setRequesting(true);
    try {
      // Store review sheets are controlled by Apple and Google, which may
      // suppress them after their own frequency limits have been reached.
      const opened = await requestNativeReview();
      if (!opened) dismissReviewPrompt();
      setOpen(false);
    } catch {
      // A store sheet can be unavailable in development or when the store
      // enforces its own quota. Quietly cool down instead of nagging again.
      dismissReviewPrompt();
      setOpen(false);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? close() : setOpen(true))}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl p-6" aria-describedby="app-review-description">
        <DialogHeader className="items-center text-center sm:text-center">
          <span className="mb-2 grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
            <Star className="h-7 w-7 fill-current" aria-hidden />
          </span>
          <DialogTitle className="font-display text-2xl">Enjoying Rizzla?</DialogTitle>
          <DialogDescription id="app-review-description" className="max-w-xs leading-relaxed">
            A quick rating helps more people discover real conversations and creators who reply.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 grid gap-2 sm:grid sm:grid-cols-2 sm:space-x-0">
          <Button type="button" variant="ghost" onClick={close} disabled={requesting}>
            Not now
          </Button>
          <Button type="button" onClick={() => void rate()} disabled={requesting}>
            <Star className="h-4 w-4" aria-hidden />
            {requesting ? "Opening…" : "Rate Rizzla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
