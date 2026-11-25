import Link from "next/link";
import {
  ArrowRight, Award, Building2, CalendarClock, Compass, FileText, Route, Sparkles, Target, TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { BRAND_NAME } from "@/lib/brand";
import HeroSearch from "@/components/home/HeroSearch";

// The numbers read the real counts; refresh them once an hour
export const revalidate = 3600;

type Db = Awaited<ReturnType<typeof createServerSupabaseClient>>;
type UpcomingDate = { slug: string; exam: string; what: string; date: string; days: number };

/** The next officially confirmed date of each exam (verified schedules only), soonest first */
async function upcomingDates(db: Db): Promise<UpcomingDate[]> {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  today.setHours(0, 0, 0, 0);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const until = new Date(today);
  until.setDate(until.getDate() + 120);
  const { data } = await db
    .from("exam_schedules")
    .select("registration_start, registration_end, exam_date_start, exams!inner(name, slug)")
    .eq("data_status", "verified")
    .or(`registration_start.gte.${iso(today)},registration_end.gte.${iso(today)},exam_date_start.gte.${iso(today)}`);
  const next = new Map<string, UpcomingDate>();
  for (const row of (data ?? []) as unknown as { registration_start: string | null; registration_end: string | null; exam_date_start: string | null; exams: { name: string; slug: string } }[]) {
    for (const [what, date] of [["Registration opens", row.registration_start], ["Registration closes", row.registration_end], ["Exam day", row.exam_date_start]] as const) {
      if (!date || date < iso(today) || date >= iso(until)) continue;
      const days = Math.round((new Date(`${date}T00:00:00`).getTime() - today.getTime()) / 86_400_000);
      const seen = next.get(row.exams.slug);
      if (!seen || date < seen.date) next.set(row.exams.slug, { slug: row.exams.slug, exam: row.exams.name, what, date, days });
    }
  }
  return [...next.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
}

const shortDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const inDays = (n: number) => (n === 0 ? "Today" : n === 1 ? "Tomorrow" : `In ${n} days`);

async function siteCounts(db: Db) {
  const count = async (table: string, active = false) => {
    let q = db.from(table).select("id", { count: "exact", head: true });
    if (active) q = q.eq("is_active", true);
    const { count } = await q;
    return count ?? 0;
  };
  const [careers, colleges, exams, scholarships] = await Promise.all([
    count("careers"),
    count("colleges"),
    count("exams"),
    count("scholarships", true),
  ]);
  return { careers, colleges, exams, scholarships };
}

type Tool = { href: string; icon: LucideIcon; tint: string; title: string; desc: string };

const POPULAR = [
  { href: "/exams/jee-main", label: "JEE Main" },
  { href: "/exams/neet-ug", label: "NEET UG" },
  { href: "/exams/cuet-ug", label: "CUET UG" },
  { href: "/colleges/iit-bombay", label: "IIT Bombay" },
  { href: "/scholarships/match", label: "Scholarships for you" },
];

const STEPS = [
  { icon: Compass, title: "Know your path", desc: "Tell us your subjects and interests, and see the careers that fit you." },
  { icon: Route, title: "Choose with confidence", desc: "Compare colleges, fees, cutoffs and placements — from official sources." },
  { icon: Target, title: "Own your future", desc: "Track your exams and scholarships, and get reminded before every deadline." },
];

export default async function Home() {
  const db = await createServerSupabaseClient();
  const [counts, upcoming, { data: { user } }] = await Promise.all([siteCounts(db), upcomingDates(db), db.auth.getUser()]);
  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0];
  const stats = [
    { href: "/careers", number: counts.careers, label: "Career paths" },
    { href: "/colleges", number: counts.colleges, label: "Colleges" },
    { href: "/exams", number: counts.exams, label: "Entrance exams" },
    { href: "/scholarships", number: counts.scholarships, label: "Scholarships" },
  ].filter((s) => s.number > 0);

  const tools: Tool[] = [
    { href: "/recommend", icon: Compass, tint: "bg-indigo-50 text-indigo-600", title: "Career matches", desc: "Answer a few questions and see the careers that fit your subjects and interests." },
    { href: "/colleges", icon: Building2, tint: "bg-sky-50 text-sky-600", title: "College finder", desc: `Compare fees, NIRF ranks, cutoffs and placements${counts.colleges ? ` of ${counts.colleges.toLocaleString("en-IN")} colleges` : ""}.` },
    { href: "/colleges/value", icon: TrendingUp, tint: "bg-emerald-50 text-emerald-700", title: "Fees vs placements", desc: "See which colleges pay back their fees fastest, using official NIRF salaries." },
    { href: "/exams", icon: CalendarClock, tint: "bg-amber-50 text-amber-700", title: "Exams and reminders", desc: "Dates, syllabus and cutoffs — with email reminders before every deadline." },
    { href: "/papers", icon: FileText, tint: "bg-rose-50 text-rose-700", title: "Previous year papers", desc: "Official question papers and answer keys, straight from the exam boards." },
    { href: "/scholarships/match", icon: Award, tint: "bg-violet-50 text-violet-600", title: "Scholarship matcher", desc: "Check which scholarships you qualify for, and what each one pays." },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-indigo-50 via-indigo-50/60 to-white px-4 pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {user ? (
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 bg-white text-indigo-700 border border-indigo-100 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1 rounded-full mb-5 sm:mb-6 hover:border-indigo-300 transition">
              Welcome back{firstName ? `, ${firstName}` : ""} · Go to your dashboard
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-white text-indigo-700 border border-indigo-100 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1 rounded-full mb-5 sm:mb-6">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              India&apos;s career, college and exam guide
            </span>
          )}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-5">
            Know your path, <span className="text-amber-500">own your future.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Find the right career, college, exam and scholarship — with official data, all in one place.
          </p>
          <HeroSearch />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-gray-500">Popular:</span>
            {POPULAR.map((p) => (
              <Link key={p.href} href={p.href} className="px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700 transition">
                {p.label}
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="text-gray-600 text-sm sm:text-base">Not sure what you want to do yet?</span>
            <Link href="/recommend" className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm sm:text-base font-semibold shadow-sm hover:bg-indigo-700 transition">
              Find my career <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* The real numbers in the database, each one a way in */}
        {stats.length > 0 && (
          <div className="max-w-4xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 bg-white rounded-2xl border border-gray-200 shadow-sm divide-x divide-y md:divide-y-0 divide-gray-100 overflow-hidden">
            {stats.map((s) => (
              <Link key={s.label} href={s.href} className="group px-4 py-5 text-center hover:bg-indigo-50/50 transition">
                <p className="text-3xl sm:text-4xl font-bold text-indigo-600 tabular-nums">{s.number.toLocaleString("en-IN")}</p>
                <p className="text-sm text-gray-500 mt-1 group-hover:text-indigo-700">{s.label}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Officially confirmed dates coming up */}
      {upcoming.length > 0 && (
        <section className="px-4 sm:px-6 pt-14 sm:pt-20 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Important dates coming up</h2>
              <p className="text-gray-500 mt-1">Confirmed on the official exam websites</p>
            </div>
            <Link href="/my-exams" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800">
              Get reminders for your exams <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcoming.map((u) => (
              <li key={u.slug}>
                <Link href={`/exams/${u.slug}`} className="group flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-sm transition">
                  <span className="w-14 h-14 rounded-xl bg-amber-50 text-amber-700 flex flex-col items-center justify-center shrink-0 leading-none">
                    <span className="text-lg font-bold">{shortDate(u.date).split(" ")[0]}</span>
                    <span className="text-[11px] font-medium uppercase mt-0.5">{shortDate(u.date).split(" ")[1]}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-gray-900 truncate group-hover:text-indigo-700">{u.exam}</span>
                    <span className="block text-sm text-gray-500">{u.what}</span>
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${u.days <= 7 ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600"}`}>{inDays(u.days)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tools */}
      <section className="px-4 sm:px-6 py-14 sm:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Everything you need to plan your career</h2>
          <p className="text-gray-500 mt-3 text-base sm:text-lg">Free tools built on official data</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {tools.map(({ href, icon: Icon, tint, title, desc }) => (
            <Link key={href} href={href} className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-md transition flex flex-col">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${tint}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <h3 className="text-lg font-semibold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">{desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
                Open <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works — the tagline, step by step */}
      <section className="bg-gray-50 border-y border-gray-100 px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 text-center mb-10 sm:mb-12">How {BRAND_NAME} works</h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <li key={title} className="relative bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center">{i + 1}</span>
                  <Icon className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto bg-indigo-600 rounded-3xl px-6 sm:px-12 py-10 sm:py-14 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Not sure where to start?</h2>
          <p className="text-indigo-100 text-base sm:text-lg mb-7">Answer a few questions and get career matches made for you — free.</p>
          <Link href="/recommend" className="inline-flex items-center gap-2 bg-white text-indigo-700 px-7 py-3.5 rounded-xl text-base font-semibold hover:bg-indigo-50 transition">
            Find my career <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
