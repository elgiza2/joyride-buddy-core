import type { DocsPlanState } from "./planTypes";

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

/**
 * Turns the approved document plan (outline + research + imported file data +
 * reviewed content + a previously generated version) into a single rich brief
 * that drives the docs generator, so the final file follows exactly what the
 * user approved instead of being re-invented.
 */
export function buildDocsBrief(plan: DocsPlanState, previousHtml?: string): string {
  const ar = plan.language === "ar";
  const parts: string[] = [];

  parts.push(
    ar
      ? `أنشئ مستندًا من نوع: ${plan.docType} — الموضوع: ${plan.topic}`
      : `Produce a ${plan.docType} — topic: ${plan.topic}`,
  );
  parts.push(
    ar
      ? "التزم حرفيًا بالمخطط التالي: نفس الأقسام، نفس الترتيب، نفس العناوين، ونفس النصوص المعتمدة (يمكنك التنسيق فقط)."
      : "Follow this approved plan exactly: same sections, same order, same titles, and the same approved text (formatting only is yours).",
  );
  parts.push(
    ar
      ? "أسلوب الكتابة: متسق ومحافظ ومناسب لنوع المستند، بدون حشو، بدون عناصر نائبة مثل [الاسم]."
      : "Writing style: consistent, conservative, appropriate to the document type. No filler, no placeholders like [Your Name].",
  );

  (plan.sections || []).forEach((s, i) => {
    const written = plan.content?.[i]?.body?.trim();
    const points = (s.points || []).map((b) => `  - ${b}`).join("\n");
    parts.push(
      [`Section ${i + 1}: ${s.title}`, points, written ? `  > ${clip(written, 2500)}` : ""]
        .filter(Boolean)
        .join("\n"),
    );
  });

  if (plan.research?.summary) {
    parts.push(
      (ar
        ? "نتائج البحث العميق (استخدمها كمصدر للحقائق والأرقام):\n"
        : "Deep research findings (use as the factual source):\n") +
        clip(plan.research.summary, 7000),
    );
    const src = (plan.research.sources || []).slice(0, 12);
    if (src.length) {
      parts.push(
        (ar
          ? "المراجع الحقيقية — أضف في نهاية المستند قسم «المراجع» يسرد هذه المصادر بروابطها الحقيقية فقط، ولا تخترع أي مرجع:\n"
          : "Real references — add a final 'References' section listing exactly these real sources with their URLs. Never invent a reference:\n") +
          src.map((s, i) => `[${i + 1}] ${s.title} — ${s.url}`).join("\n"),
      );
    }
  }

  if (plan.sourceText?.trim()) {
    parts.push(
      (ar
        ? "بيانات مرفوعة من المستخدم (حلّلها واستخدم أرقامها الحقيقية، لا تخترع بيانات):\n"
        : "User-provided data (analyze it and use its real numbers; do not invent data):\n") +
        clip(plan.sourceText.trim(), 9000),
    );
  }

  if (previousHtml?.trim()) {
    parts.push(
      (ar
        ? "هذه هي النسخة السابقة من نفس المستند — عدّل عليها فقط وحافظ على التصميم والهوية والأقسام غير المطلوب تغييرها:\n"
        : "This is the previous version of the same document — revise it in place and keep its design, identity and untouched sections:\n") +
        clip(previousHtml.trim(), 24000),
    );
  }

  return parts.join("\n\n");
}
