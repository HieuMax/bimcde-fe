import LoginForm from "../components/loginForm";

export const metadata = {
  title: "Login - BIM CDE",
  description: "Login to your BIM CDE account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden bg-gradient-to-br from-[#1D3F52] via-[#2a5a73] to-[#152d3a]">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        />

        <div className="relative z-10 flex flex-col h-full justify-between">
          {/* Branding */}
          <div>
            <div className="flex items-center gap-3 mb-16">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <div className="w-7 h-7 bg-white rounded-lg"></div>
              </div>
              <span className="text-2xl font-bold">BIM CDE</span>
            </div>

            {/* Hero */}
            <div className="space-y-6">
              <h2 className="text-4xl font-bold leading-tight">
                Collaborate Smarter with BIM CDE
              </h2>
              <p className="text-white/90 text-base leading-relaxed">
                Centralize your construction data, optimize workflows, and empower your team with real-time collaboration.
              </p>
            </div>

            {/* Features */}
            <div className="mt-10 space-y-5">
              <FeatureItem
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                }
                title="Real-time Collaboration"
                description="Work together seamlessly with your team"
              />
              <FeatureItem
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                }
                title="Centralized Data"
                description="All your project information in one place"
              />
              <FeatureItem
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                }
                title="Enterprise Security"
                description="Advanced security and compliance features"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/70 text-xs mt-8">
            © 2025 BIM CDE. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

// Feature Item Component
function FeatureItem({ icon, title, description }: any) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="font-semibold text-white text-base mb-1">{title}</div>
        <div className="text-white/80 text-sm">{description}</div>
      </div>
    </div>
  );
}
