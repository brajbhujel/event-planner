"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "@/hooks/use-toast";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { CodeInput } from "@/components/ui/code-input";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";

type Step =
  | "confirm-enable"
  | "scan-qr"
  | "verify-totp"
  | "backup-codes"
  | "confirm-disable"
  | "verify-disable";

export function TwoFactorSettings({
  initiallyEnabled,
}: {
  initiallyEnabled?: boolean;
}) {
  const [enabled, setEnabled] = useState(Boolean(initiallyEnabled));
  const [backupCount, setBackupCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("confirm-enable");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const [pending, start] = useTransition();

  const refreshStatus = () =>
    start(async () => {
      try {
        const status = await authService.twoFactorStatus();
        setEnabled(status.twoFactorEnabled);
        setBackupCount(status.backupCodesCount);
      } catch {
        /* profile still usable */
      }
    });

  useEffect(() => {
    refreshStatus();
  }, []);

  const openEnable = () => {
    setStep("confirm-enable");
    setToken("");
    setQr("");
    setSecret("");
    setCodes([]);
    setOpen(true);
  };

  const openDisable = () => {
    setStep("confirm-disable");
    setToken("");
    setOpen(true);
  };

  return (
    <>
      <Card className="max-w-xl">
        <CardHeader>
          <h2 className="text-sm font-semibold">Two-factor authentication</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Protect your account with an authenticator app and backup codes.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">
                {enabled ? "Enabled" : "Disabled"}
              </p>
              {enabled ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {backupCount} backup code{backupCount === 1 ? "" : "s"} left
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Add a second step when signing in
                </p>
              )}
            </div>
            <Switch
              checked={enabled}
              disabled={pending}
              onCheckedChange={(next) => {
                if (next) openEnable();
                else openDisable();
              }}
              aria-label="Toggle two-factor authentication"
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>
            {enabled && step.startsWith("confirm-disable")
              ? "Disable 2FA"
              : step === "backup-codes"
                ? "Backup codes"
                : "Enable 2FA"}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted-foreground">
            {step === "confirm-enable" &&
              "You’ll need an authenticator app like Google Authenticator or Authy."}
            {step === "scan-qr" &&
              "Scan this QR code, or enter the secret key manually."}
            {step === "verify-totp" &&
              "Enter the 6-digit code from your authenticator app."}
            {step === "backup-codes" &&
              "Save these codes now. Each works once and won’t be shown again."}
            {step === "confirm-disable" &&
              "You’ll need a code from your authenticator (or a backup code) to disable 2FA."}
            {step === "verify-disable" &&
              "Enter your authenticator or backup code."}
          </DialogDescription>

          <div className="mt-5 space-y-4">
            {step === "confirm-enable" ? (
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      try {
                        const data = await authService.setupTwoFactor();
                        setQr(data.qrDataUrl);
                        setSecret(data.secret);
                        setStep("scan-qr");
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : "Could not start 2FA.",
                        );
                      }
                    })
                  }
                >
                  {pending ? "Starting…" : "Continue"}
                </Button>
              </div>
            ) : null}

            {step === "scan-qr" ? (
              <>
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qr}
                    alt="2FA QR code"
                    className="mx-auto size-48 rounded-md border bg-white p-2"
                  />
                ) : null}
                <p className="break-all rounded-md bg-muted/50 p-3 font-mono text-xs">
                  {secret}
                </p>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    setToken("");
                    setStep("verify-totp");
                  }}
                >
                  I’ve scanned the QR code
                </Button>
              </>
            ) : null}

            {step === "verify-totp" ? (
              <>
                <CodeInput value={token} onChange={setToken} autoFocus />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("scan-qr")}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    disabled={pending || token.length !== 6}
                    onClick={() =>
                      start(async () => {
                        try {
                          const data = await authService.verifyTwoFactor(token);
                          setCodes(data.backupCodes);
                          setEnabled(true);
                          setBackupCount(data.backupCodes.length);
                          setStep("backup-codes");
                          toast.success("Two-factor authentication enabled.");
                        } catch (e) {
                          toast.error(
                            e instanceof Error ? e.message : "Invalid code.",
                          );
                        }
                      })
                    }
                  >
                    {pending ? "Verifying…" : "Confirm and enable"}
                  </Button>
                </div>
              </>
            ) : null}

            {step === "backup-codes" ? (
              <>
                <ul className="grid grid-cols-2 gap-2 rounded-md border bg-muted/40 p-3 font-mono text-xs">
                  {codes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard.writeText(codes.join("\n"));
                      toast.success("Backup codes copied.");
                    }}
                  >
                    Copy codes
                  </Button>
                  <Button type="button" onClick={() => setOpen(false)}>
                    Done
                  </Button>
                </div>
              </>
            ) : null}

            {step === "confirm-disable" ? (
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setToken("");
                    setStep("verify-disable");
                  }}
                >
                  Continue
                </Button>
              </div>
            ) : null}

            {step === "verify-disable" ? (
              <>
                <Field id="disable-code" label="Authenticator or backup code">
                  <Input
                    id="disable-code"
                    value={token}
                    onChange={(e) => setToken(e.target.value.trim())}
                    placeholder="123456 or A1B2C3D4"
                    autoFocus
                  />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("confirm-disable")}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={pending || token.length < 6}
                    onClick={() =>
                      start(async () => {
                        try {
                          await authService.disableTwoFactor(token);
                          setEnabled(false);
                          setBackupCount(0);
                          setOpen(false);
                          toast.success("Two-factor authentication disabled.");
                        } catch (e) {
                          toast.error(
                            e instanceof Error ? e.message : "Could not disable 2FA.",
                          );
                        }
                      })
                    }
                  >
                    {pending ? "Disabling…" : "Disable 2FA"}
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
