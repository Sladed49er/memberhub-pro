import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Welcome Back to MemberHub Pro
        </h1>
        <SignIn 
          appearance={{
            elements: {
              card: "bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-white/80",
              formButtonPrimary: "bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg",
              footerActionLink: "text-white hover:text-white/80"
            }
          }}
        />
      </div>
    </div>
  );
}