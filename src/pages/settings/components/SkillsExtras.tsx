/**
 * Skills page mobile extras: hero glass card + Add menu (Create with Megsy /
 * Create from files) — mirrors the Kimi mobile design.
 */
import { useRef, useState } from "react";
import { Drawer } from "vaul";
import { Plus, Sparkles, FileUp, ChevronLeft } from "lucide-react";
import skillsHero from "@/assets/skills-hero-glass.jpg";

export function SkillsHeroGlassCard({ onTry }: { onTry: () => void }) {
  return (
    <div
      className="relative overflow-hidden rounded-[24px] mb-5 bg-card text-card-foreground border border-border"
      dir="rtl"

    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground) / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative flex flex-col items-center px-5 pt-5 pb-6">
        <img decoding="async"
          src={skillsHero}
          alt=""
          loading="lazy"
          width={1024}
          height={768}
          className="w-[220px] h-[165px] object-contain select-none pointer-events-none drop-shadow-2xl"
          draggable={false}
        />
        <p className="mt-2 text-[22px] font-bold text-center leading-tight text-card-foreground">
          Doc2Skill
        </p>
        <p className="mt-2 text-[13.5px] text-center max-w-[290px] leading-relaxed text-muted-foreground">
          أعد مزج الأنماط بسهولة عن طريق تحويل المستندات إلى مهارات.
        </p>

        <button
          onClick={onTry}
          className="mt-4 inline-flex items-center justify-center h-10 px-7 rounded-full text-[14px] font-semibold transition-transform active:scale-[0.97]"
          style={{
            background: "hsl(var(--foreground))",
            color: "hsl(var(--background))",
          }}
        >
          جرّب الآن
        </button>
      </div>
    </div>
  );
}


export function SkillsAddMenu({
  onCreateWithMegsy,
  onCreateFromFiles,
}: {
  onCreateWithMegsy: () => void;
  onCreateFromFiles: (file: File) => void;
}) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".zip,.pdf,.docx,.xlsx,.pptx,.md,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onCreateFromFiles(f);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger asChild>
          <button
            aria-label="إضافة مهارة"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-semibold transition-colors"
            style={{
              background: "hsl(var(--foreground))",
              color: "hsl(var(--background))",
            }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
            إضافة
          </button>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-overlay bg-black/30" />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 z-overlay rounded-t-[28px] outline-none flex flex-col bg-popover text-popover-foreground"
            style={{
              borderTop: "1px solid hsl(var(--border))",
            }}
            dir="rtl"
          >
            <Drawer.Title className="sr-only">إضافة مهارة</Drawer.Title>
            <Drawer.Description className="sr-only">
              اختر طريقة إنشاء المهارة
            </Drawer.Description>
            <Drawer.Handle
              preventCycle
              className="mx-auto mt-2.5 mb-2 !w-10 !h-1.5 !bg-muted-foreground/40"
            />
            <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]">
              <p className="text-[15px] font-semibold mb-3 text-right">
                إضافة مهارة
              </p>

              <button
                onClick={() => {
                  setOpen(false);
                  onCreateWithMegsy();
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-2.5 text-right transition-colors bg-muted/60 hover:bg-muted border border-border"
              >
                <span className="shrink-0 w-10 h-10 rounded-xl grid place-items-center bg-primary/15">
                  <Sparkles className="w-5 h-5 text-primary" strokeWidth={1.8} />
                </span>
                <span className="flex-1 min-w-0 flex flex-col gap-1 text-right">
                  <span className="text-[15px] font-semibold leading-tight">
                    إنشاء مهارة باستخدام Megsy
                  </span>
                  <span className="text-[12.5px] text-muted-foreground leading-snug">
                    اطلب من Megsy مساعدتك في إنشاء مهارة عبر الشات
                  </span>
                </span>
                <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                  fileRef.current?.click();
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-right transition-colors bg-muted/60 hover:bg-muted border border-border"
              >
                <span className="shrink-0 w-10 h-10 rounded-xl grid place-items-center bg-foreground/10">
                  <FileUp className="w-5 h-5" strokeWidth={1.8} />
                </span>
                <span className="flex-1 min-w-0 flex flex-col gap-1 text-right">
                  <span className="text-[15px] font-semibold leading-tight">
                    إنشاء من ملفات
                  </span>
                  <span className="text-[12.5px] text-muted-foreground leading-snug">
                    ارفع ملفاتك وسينشئ الذكاء الاصطناعي مهارة منها
                  </span>
                </span>
                <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            </div>
          </Drawer.Content>

        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
