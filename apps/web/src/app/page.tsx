import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

// The numbers strip reads the real counts; refresh them once an hour
export const revalidate = 3600;

async function siteCounts() {
  const db = await createServerSupabaseClient();
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

export default async function Home() {
  const counts = await siteCounts();
  const stats = [
    { number: counts.careers, label: "Career paths" },
    { number: counts.colleges, label: "Colleges" },
    { number: counts.exams, label: "Entrance exams" },
    { number: counts.scholarships, label: "Scholarships" },
  ].filter((s) => s.number > 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-16 sm:py-20 md:py-24">
        <span className="bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1 rounded-full mb-4 sm:mb-6">
          India&apos;s career, college and exam guide
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 max-w-3xl leading-tight mb-4 sm:mb-6">
          Know your path, <span className="text-amber-500">own your future.</span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mb-6 sm:mb-8 md:mb-10">
          Find the right career, college, exam and scholarship — with official data, all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <Link href="/recommend" className="bg-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base md:text-lg font-semibold hover:bg-indigo-700 transition">
            Find My Career →
          </Link>
          <Link href="/careers" className="bg-white text-indigo-600 border border-indigo-200 px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base md:text-lg font-semibold hover:bg-indigo-50 transition">
            Explore Careers
          </Link>
        </div>
      </section>

      {/* Stats Section: the real numbers in the database */}
      {stats.length > 0 && (
        <section className="flex flex-wrap justify-center gap-6 sm:gap-12 md:gap-16 py-8 sm:py-12 bg-white px-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center min-w-[120px] sm:min-w-[140px]">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-indigo-600">{stat.number.toLocaleString("en-IN")}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </section>
      )}

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
          Everything You Need to Plan Your Career
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {[
            { icon: "🎯", title: "AI Recommendations", desc: "Get career matches based on your subjects and interest scores" },
            { icon: "🗺️", title: "Career Roadmaps", desc: "Step-by-step guides from where you are to your dream career" },
            { icon: "🏫", title: "College Finder", desc: "Find top colleges with rankings, fees, and cutoff details" },
            { icon: "📝", title: "Exam Tracker", desc: "Never miss an exam with dates, syllabus, and eligibility" },
            { icon: "💰", title: "Scholarships", desc: "Find financial aid and scholarships for your education" },
            { icon: "📚", title: "Career Blog", desc: "Expert tips, industry news, and success stories" },
          ].map((feature) => (
            <div key={feature.title} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm sm:text-base text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 text-white text-center py-12 sm:py-16 px-4">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Ready to Find Your Career?</h2>
        <p className="text-indigo-200 mb-6 sm:mb-8 text-sm sm:text-base md:text-lg">Explore careers, colleges, exams and scholarships — free to start</p>
        <Link href="/recommend" className="bg-white text-indigo-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base md:text-lg font-semibold hover:bg-indigo-50 transition">
          Start Free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 sm:py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="text-white font-bold text-base">{BRAND_NAME}</p>
            <p className="text-xs sm:text-sm text-gray-400">{BRAND_TAGLINE}</p>
          </div>
          <p className="text-xs sm:text-sm">© 2026 {BRAND_NAME} · Built for Indian students</p>
        </div>
      </footer>
    </main>
  )
}
