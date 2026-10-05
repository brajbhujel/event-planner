import { Brand } from "@/components/brand";
import { CalendarIcon, CheckIcon, LockClosedIcon } from "@radix-ui/react-icons";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen">
      {/* <section className="relative hidden flex-col overflow-hidden bg-[#203b5b] p-12 text-white lg:flex xl:p-16">
        <Brand light />
        <div className="my-auto py-16">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.18em] text-white/60">
            Event planning
          </p>
          <h1 className="max-w-md text-5xl font-medium leading-[1.14] tracking-tight">
            Plan events.
            <br />
            Stay organized.
          </h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-white/65">
            Create, manage, and browse events with tags, visibility, and RSVPs
            in one place.
          </p>
          <div className="mt-12 max-w-sm rounded-xl border border-white/15 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-white/10">
                <CalendarIcon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Everything in one place</p>
                <p className="mt-1 text-xs text-white/55">
                  Dates, locations, and people.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
              {[
                "Create and edit your events",
                "Filter by tags or visibility",
                "Only you can change your events",
              ].map((text) => (
                <div
                  key={text}
                  className="flex items-center gap-3 text-sm text-white/75"
                >
                  <CheckIcon className="size-4 text-white/50" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section> */}
      <section className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-12 lg:px-8">
        <div className="lg:hidden">
          <Brand />
        </div>
        <div className="m-auto w-full max-w-95 py-12">
          {children}
          {/* <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <LockClosedIcon className="size-3" />
            Secure sign-in with JWT
          </div> */}
        </div>
      </section>
    </main>
  );
}
