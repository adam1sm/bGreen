"use client";

import Link from "next/link";

export default function Hero() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="hero" className="relative pt-60 pb-20 sm:pt-52 sm:pb-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 -z-10" />

      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
            Track your emissions through{" "}
            <span className="text-emerald-600 dark:text-emerald-400">
              every dollar spent
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Greenline turns your spending into CO₂e estimates you can test,
            tune, and improve.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/try"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 shadow-lg hover:shadow-xl inline-block"
            >
              Start experimenting
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Trusted by forward-thinking businesses
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                Stripe
              </div>
              <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                •
              </div>
              <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                EEIO
              </div>
              <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                •
              </div>
              <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                MCC
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
