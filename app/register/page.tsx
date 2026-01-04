import RegisterForm from "../components/registerForm"; 

export const metadata = {
  title: "Register - BIM CDE",
  description: "Create a new BIM CDE account",
};

export default function RegisterPage() {
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
                Bắt đầu hành trình của bạn
              </h2>
              <p className="text-white/90 text-base leading-relaxed">
                Tham gia cùng hàng nghìn chuyên gia xây dựng đang sử dụng BIM
                CDE để quản lý dự án hiệu quả hơn.
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                }
                title="Dễ dàng bắt đầu"
                description="Tạo tài khoản chỉ trong vài phút và bắt đầu ngay"
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
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                }
                title="Hỗ trợ 24/7"
                description="Đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ bạn"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/70 text-xs mt-8">
            © 2025 BIM CDE. Tất cả quyền được bảo lưu.
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <RegisterForm />
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
